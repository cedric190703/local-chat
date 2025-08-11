/**
 * @file This file contains the RAG (Retrieval-Augmented Generation) service for the local chat application.
 * It provides functions for retrieving relevant document chunks and running the RAG chain.
 */

import { ChatOllama } from "@langchain/ollama"
import { RunnableSequence } from "@langchain/core/runnables"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { documentProcessor, type DocumentChunk } from "./document-service"
import type { BaseMessage } from "@langchain/core/messages"

/**
 * Retrieves relevant chunks from the document processor.
 * @param query The query to retrieve relevant chunks for.
 * @param k The number of chunks to retrieve.
 * @returns The relevant chunks.
 */
export async function retrieveRelevantChunks(query: string, k: number = 5): Promise<DocumentChunk[]> {
  return await documentProcessor.searchDocuments(query, k)
}

/**
 * Represents the options for the RAG service.
 */
export interface RagOptions {
  modelName: string
}

/**
 * Represents the parameters for the file analysis function.
 */
interface FileAnalysisParams {
  imageChunks: DocumentChunk[]
  documentChunks: DocumentChunk[]
  binaryChunks: DocumentChunk[]
  regularTextChunks: DocumentChunk[]
  query: string
  history: BaseMessage[]
  modelName: string
}

/**
 * Analyzes all the files and returns a comprehensive analysis.
 * @param params The parameters for the file analysis.
 * @returns A comprehensive analysis of the files.
 */
async function analyzeAllFiles(params: FileAnalysisParams): Promise<string> {
  const { imageChunks, documentChunks, binaryChunks, regularTextChunks, query, history, modelName } = params
  
  // Create file analysis summary
  const fileAnalysis: string[] = []
  
  // Analyze images
  if (imageChunks.length > 0) {
    for (const chunk of imageChunks) {
      const lines = chunk.content.split('\n')
      const fileName = lines[0].replace('IMAGE_FILE: ', '')
      const type = lines.find(line => line.startsWith('Type: '))?.replace('Type: ', '') || 'unknown'
      const size = lines.find(line => line.startsWith('Size: '))?.replace('Size: ', '') || 'unknown'
      
      fileAnalysis.push(`📸 **Image File**: ${fileName}
- Type: ${type}
- Size: ${size}
- Analysis: This is an image file that can be processed for visual content analysis, object detection, text extraction, or general image description.`)
    }
  }
  
  // Analyze documents
  if (documentChunks.length > 0) {
    for (const chunk of documentChunks) {
      const lines = chunk.content.split('\n')
      const fileName = lines[0].replace('DOCUMENT_FILE: ', '')
      const type = lines.find(line => line.startsWith('Type: '))?.replace('Type: ', '') || 'unknown'
      const size = lines.find(line => line.startsWith('Size: '))?.replace('Size: ', '') || 'unknown'
      
      // Extract content preview
      const contentStart = chunk.content.indexOf('Content:\n')
      const content = contentStart !== -1 ? chunk.content.substring(contentStart + 9) : ''
      const preview = content.substring(0, 200) + (content.length > 200 ? '...' : '')
      
      // Determine file type analysis
      let analysisType = 'text document'
      let capabilities = 'text analysis, content extraction, summarization'
      
      if (fileName.endsWith('.py')) {
        analysisType = 'Python code file'
        capabilities = 'code analysis, function extraction, syntax checking, documentation generation'
      } else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
        analysisType = 'JavaScript/TypeScript code file'
        capabilities = 'code analysis, function extraction, type checking, refactoring suggestions'
      } else if (fileName.endsWith('.html')) {
        analysisType = 'HTML document'
        capabilities = 'structure analysis, element extraction, accessibility checking'
      } else if (fileName.endsWith('.css')) {
        analysisType = 'CSS stylesheet'
        capabilities = 'style analysis, selector optimization, responsive design review'
      } else if (fileName.endsWith('.json')) {
        analysisType = 'JSON data file'
        capabilities = 'data structure analysis, validation, key extraction'
      } else if (fileName.endsWith('.csv')) {
        analysisType = 'CSV data file'
        capabilities = 'data analysis, statistical insights, column analysis'
      } else if (fileName.endsWith('.sql')) {
        analysisType = 'SQL database file'
        capabilities = 'query analysis, schema review, optimization suggestions'
      } else if (fileName.endsWith('.md')) {
        analysisType = 'Markdown document'
        capabilities = 'content analysis, structure extraction, formatting review'
      }
      
      fileAnalysis.push(`📄 **${analysisType}**: ${fileName}
- Type: ${type}
- Size: ${size}
- Capabilities: ${capabilities}
- Content Preview: ${preview}`)
    }
  }
  
  // Analyze binary files
  if (binaryChunks.length > 0) {
    for (const chunk of binaryChunks) {
      const fileName = chunk.content.replace('BINARY_FILE: ', '').split(' ')[0]
      fileAnalysis.push(`🗂️ **Binary File**: ${fileName}
- Analysis: This is a binary file that has been uploaded but cannot be directly analyzed for text content. File metadata and properties are available.`)
    }
  }
  
  // Analyze regular text
  if (regularTextChunks.length > 0) {
    for (const chunk of regularTextChunks) {
      fileAnalysis.push(`📝 **Text Content**: ${chunk.metadata.source}
- Analysis: General text content available for analysis, search, and question answering.`)
    }
  }
  
  // Create comprehensive analysis prompt
  const fileContext = fileAnalysis.join('\n\n')
  const allContent = [...documentChunks, ...regularTextChunks]
    .map((c: any, i: number) => `[${c.metadata.source}] ${c.content}`)
    .join('\n\n')
  
  const model = new ChatOllama({ baseUrl: "http://localhost:11434", model: modelName, temperature: 0.3 })
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are an expert file analyst and assistant. The user has uploaded multiple files and asked: "${query}"

UPLOADED FILES ANALYSIS:
${fileContext}

Based on the uploaded files, provide a comprehensive analysis that:
1. Acknowledges what files were uploaded and their types
2. Provides specific insights relevant to each file type
3. Answers the user's question using the file content
4. Offers actionable suggestions based on the file analysis

Use the actual file content below to provide detailed, accurate responses.`],
    ["system", `FILE CONTENT:\n\n${allContent}`],
    new MessagesPlaceholder("history"),
    ["human", "{question}"]
  ])

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ])

  const answer = await chain.invoke({
    history,
    question: query,
  })

  return answer
}

/**
 * Runs the RAG chain.
 * @param query The query to run the RAG chain with.
 * @param history The history of the conversation.
 * @param modelName The name of the model to use.
 * @returns The answer from the RAG chain.
 */
export async function runRag(
  query: string,
  history: BaseMessage[],
  { modelName }: RagOptions
): Promise<string> {
  const chunks = await retrieveRelevantChunks(query, 5)
  
  // Categorize chunks by file type for specialized handling
  const imageChunks = chunks.filter(c => c.content.startsWith('IMAGE_FILE:'))
  const documentChunks = chunks.filter(c => c.content.startsWith('DOCUMENT_FILE:'))
  const binaryChunks = chunks.filter(c => c.content.startsWith('BINARY_FILE:'))
  const regularTextChunks = chunks.filter(c => 
    !c.content.startsWith('IMAGE_FILE:') && 
    !c.content.startsWith('DOCUMENT_FILE:') && 
    !c.content.startsWith('BINARY_FILE:')
  )
  
  // Check what types of files we have
  const hasImages = imageChunks.length > 0
  const hasDocuments = documentChunks.length > 0
  const hasBinaryFiles = binaryChunks.length > 0
  const hasRegularText = regularTextChunks.length > 0
  
  // If we have any files, provide comprehensive analysis
  if (hasImages || hasDocuments || hasBinaryFiles || hasRegularText) {
    return await analyzeAllFiles({
      imageChunks,
      documentChunks,
      binaryChunks,
      regularTextChunks,
      query,
      history,
      modelName
    })
  }
  
  // Use vision-capable model if images are present
  const effectiveModelName = hasImages && !modelName.includes('llava') ? 'llava:latest' : modelName
  
  if (hasImages) {
    // For vision models, we need to handle images differently
    // Extract the first image for vision analysis
    const firstImageChunk = imageChunks[0]
    const lines = firstImageChunk.content.split('\n')
    const fileName = lines[0].replace('IMAGE_FILE: ', '')
    const base64Line = lines.find(line => line.startsWith('Base64: '))
    
    if (base64Line) {
      const base64Data = base64Line.replace('Base64: ', '')
      
      try {
        // Try to use a vision-capable model (llava) if available
        const visionModel = new ChatOllama({ 
          baseUrl: "http://localhost:11434", 
          model: "llava:latest", 
          temperature: 0.3 
        })
        
        // Process text context if available
        const allTextChunks = [...documentChunks, ...regularTextChunks]
        const textContext = allTextChunks.length > 0 
          ? `\n\nAdditional context from documents:\n${allTextChunks.map((c: any, i: number) => `(${i + 1}) [${c.metadata.source}] ${c.content}`).join("\n\n")}`
          : ""
        
        // Create a comprehensive prompt for vision analysis
        const visionPrompt = `You are analyzing an image uploaded by the user. Please describe what you see in the image in detail and then answer their question: "${query}"
        
        Image file: ${fileName}
        ${textContext}
        
        Please provide:
        1. A detailed description of what you see in the image
        2. Answer to the user's specific question: "${query}"
        3. Any relevant insights or observations about the image content`
        
        // For Ollama vision models, we need to send the image data properly
        // This is a simplified approach - in production, you'd want more robust image handling
        const prompt = ChatPromptTemplate.fromMessages([
          ["human", `${visionPrompt}\n\n[Image data: ${base64Data.substring(0, 100)}...]`]
        ])

        const chain = RunnableSequence.from([
          prompt,
          visionModel,
          new StringOutputParser(),
        ])

        const answer = await chain.invoke({
          history,
        })

        return answer
        
      } catch (visionError) {
        console.warn('Vision model (llava) not available or failed, providing helpful guidance:', visionError)
        
        // Provide helpful guidance when vision model isn't available
        const regularModel = new ChatOllama({ baseUrl: "http://localhost:11434", model: modelName, temperature: 0.3 })
        
        const allTextChunks = [...documentChunks, ...regularTextChunks]
        const textContext = allTextChunks.length > 0 
          ? `\n\nAdditional context from documents:\n${allTextChunks.map((c: any, i: number) => `(${i + 1}) [${c.metadata.source}] ${c.content}`).join("\n\n")}`
          : ""
        
        const prompt = ChatPromptTemplate.fromMessages([
          ["system", `You are a helpful assistant. The user has uploaded an image file (${fileName}) and asked: "${query}". 
          
          Since vision capabilities are not currently available, explain this limitation and offer alternative ways to help. Be helpful and suggest what they could do to get their image analyzed, such as:
          1. Describing the image themselves so you can help interpret it
          2. Using online vision tools
          3. Installing a vision-capable model like llava
          
          Use any provided text context to help answer their question if possible.`],
          ["system", `CONTEXT:\n\n${textContext || "Image file uploaded: " + fileName}`],
          new MessagesPlaceholder("history"),
          ["human", "{question}"]
        ])

        const chain = RunnableSequence.from([
          prompt,
          regularModel,
          new StringOutputParser(),
        ])

        const answer = await chain.invoke({
          history,
          question: query,
        })

        return answer
      }
    }
  }
  
  // Regular text processing (no images or fallback)
  const allTextChunks = [...documentChunks, ...regularTextChunks]
  const textContext = allTextChunks.map((c: any, i: number) => `(${i + 1}/${allTextChunks.length}) [${c.metadata.source}] ${c.content}`).join("\n\n")
  
  const model = new ChatOllama({ baseUrl: "http://localhost:11434", model: modelName, temperature: 0.3 })
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful assistant. Use the provided CONTEXT to answer the user. If the answer is not in the context, say you don't know.`],
    ["system", `CONTEXT:\n\n{context}`],
    new MessagesPlaceholder("history"),
    ["human", "{question}"]
  ])

  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ])

  const answer = await chain.invoke({
    context: textContext || "No relevant documents found.",
    history,
    question: query,
  })

  return answer
}
