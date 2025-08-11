/**
 * @file This file contains the type definitions for the chat application.
 */

/**
 * Represents a chat session.
 */
export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  model?: string
  parameters?: {
    temperature?: number
    top_p?: number
    top_k?: number
    seed?: number
    num_ctx?: number
  }
}

/**
 * Represents a message in a chat session.
 */
export interface Message {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  timestamp: string // ISO string for better serialization
  isStreaming?: boolean
}

/**
 * Represents an uploaded file.
 */
export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
}

/**
 * Represents a model.
 */
export interface Model {
  name: string
  modified_at: string
  size: number
  digest: string
}