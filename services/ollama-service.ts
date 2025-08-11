/**
 * @file This file contains the Ollama service for the local chat application.
 * It provides a wrapper around the Ollama API for interacting with local LLMs.
 */

/**
 * Represents a response from the Ollama API.
 */
interface OllamaResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Represents the progress of a model pull.
 */
interface PullProgress {
  status: string
  digest?: string
  total?: number
  completed?: number
}

/**
 * Represents the options for generating a response from a model.
 */
interface GenerateOptions {
  model: string
  prompt: string
  system?: string
  template?: string
  context?: number[]
  stream?: boolean
  raw?: boolean
  format?: string
  options?: {
    num_ctx?: number
    num_predict?: number
    temperature?: number
    top_p?: number
    top_k?: number
    repeat_penalty?: number
    seed?: number
  }
}

/**
 * Represents information about a model.
 */
interface ModelInfo {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

/**
 * A service for interacting with the Ollama API.
 */
class OllamaService {
  private baseUrl: string

  /**
   * Creates a new OllamaService instance.
   * @param baseUrl The base URL of the Ollama API.
   */
  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  /**
   * Checks if the Ollama service is running.
   * @returns A boolean indicating whether the service is running.
   */
  async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Lists the available models.
   * @returns A list of the available models.
   */
  async listModels(): Promise<OllamaResponse<ModelInfo[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }
      const data = await response.json()
      return {
        success: true,
        data: data.models
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Shows information about a model.
   * @param modelName The name of the model to get information about.
   * @returns Information about the model.
   */
  async showModelInfo(modelName: string): Promise<OllamaResponse<ModelInfo>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }
      const data = await response.json()
      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Pulls a model from the registry.
   * @param modelName The name of the model to pull.
   * @param onProgress A callback to be called with the progress of the pull.
   * @returns A response indicating whether the pull was successful.
   */
  async pullModel(
    modelName: string,
    onProgress?: (progress: PullProgress) => void
  ): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          try {
            const progress = JSON.parse(line) as PullProgress
            if (onProgress) onProgress(progress)
          } catch (e) {
            console.error('Error parsing pull progress:', e)
          }
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generates a response from a model.
   * @param options The options for generating the response.
   * @param onToken A callback to be called with each token of the response.
   * @returns The response from the model.
   */
  async generate(
    options: GenerateOptions,
    onToken?: (token: string) => void
  ): Promise<OllamaResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...options,
          stream: !!onToken
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }

      if (!onToken) {
        const data = await response.json()
        return {
          success: true,
          data: data.response
        }
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as { response?: string }
            if (parsed.response) {
              fullResponse += parsed.response
              onToken(parsed.response)
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e)
          }
        }
      }

      return {
        success: true,
        data: fullResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Creates a model from a Modelfile.
   * @param modelName The name of the model to create.
   * @param modelfile The Modelfile to use to create the model.
   * @returns A response indicating whether the creation was successful.
   */
  async createModel(
    modelName: string,
    modelfile: string
  ): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName,
          modelfile,
          stream: false
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Deletes a model.
   * @param modelName The name of the model to delete.
   * @returns A response indicating whether the deletion was successful.
   */
  async deleteModel(modelName: string): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Copies a model.
   * @param sourceName The name of the model to copy.
   * @param destinationName The name of the new model.
   * @returns A response indicating whether the copy was successful.
   */
  async copyModel(
    sourceName: string,
    destinationName: string
  ): Promise<OllamaResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceName,
          destination: destinationName
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Gets the version of the Ollama API.
   * @returns The version of the Ollama API.
   */
  async getVersion(): Promise<OllamaResponse<string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`)
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`
        }
      }
      const data = await response.json()
      return {
        success: true,
        data: data.version
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Singleton instance
const ollamaService = new OllamaService()

export default ollamaService
