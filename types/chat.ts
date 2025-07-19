export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
}
