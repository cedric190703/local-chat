export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  model?: string
  parameters?: {
    temperature?: number
    top_p?: number
    top_k?: number
    seed?: number
    num_ctx?: number
  }
}

export interface Message {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  timestamp: string // ISO string for better serialization
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export interface Model {
  name: string
  modified_at: string
  size: number
  digest: string
}
