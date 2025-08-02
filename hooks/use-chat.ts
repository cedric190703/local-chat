import { useState, useCallback } from "react"
import ollamaService from "@/services/ollama-service"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  isStreaming?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: string
  updatedAt: string
}

export interface UseChatReturn {
  chats: Chat[]
  activeChat: string | null
  isGenerating: boolean
  setActiveChat: (chatId: string) => void
  createNewChat: (options?: { model?: string; title?: string }) => Chat
  deleteChat: (chatId: string) => void
  sendMessage: (content: string, model: string) => Promise<void>
  clearChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  regenerateLastMessage: (model: string) => Promise<void>
  editAndResendMessage: (
    messageId: string,
    newContent: string,
    model: string
  ) => Promise<void>
  stopGeneration: () => void
}

export function useChat(): UseChatReturn {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const createNewChat = useCallback(
    (options?: { model?: string; title?: string }) => {
      const chatId = generateId()
      const newChat: Chat = {
        id: chatId,
        title: options?.title || "New Chat",
        messages: [],
        model: options?.model || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setChats(prev => [newChat, ...prev])

      return newChat
    },
    []
  )

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    setActiveChat(prev => (prev === chatId ? null : prev))
  }, [])

  const clearChat = useCallback((chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [], updatedAt: new Date().toISOString() }
          : chat
      )
    )
  }, [])

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, title, updatedAt: new Date().toISOString() }
          : chat
      )
    )
  }, [])

  const generateTitle = (content: string): string => {
    // Generate a simple title from the first message
    const words = content.trim().split(" ").slice(0, 6)
    return words.join(" ") + (words.length === 6 ? "..." : "")
  }

  const stopGeneration = useCallback(() => {
    if (currentAbortController) {
      currentAbortController.abort()
      setCurrentAbortController(null)
      setIsGenerating(false)
    }
  }, [currentAbortController])

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      
      if (!content.trim() || !model) return

      // Stop any ongoing generation
      stopGeneration()

      let chatId = activeChat
      let targetChat = chats.find(c => c.id === activeChat)

      // Create new chat if none exists or is selected
      if (!targetChat) {
        targetChat = createNewChat({ model, title: generateTitle(content) })
        chatId = targetChat.id
        setActiveChat(chatId)
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString()
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true
      }

      // Add user message and placeholder assistant message
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, assistantMessage],
                model,
                updatedAt: new Date().toISOString(),
                title:
                  chat.messages.length === 0
                    ? generateTitle(content)
                    : chat.title
              }
            : chat
        )
      )

      setIsGenerating(true)

      try {
        // Create abort controller for this request
        const abortController = new AbortController()
        setCurrentAbortController(abortController)

        let fullResponse = ""

        const response = await ollamaService.generate(
          {
            model,
            prompt: content,
            stream: true
          },
          (token: string) => {
            // Check if generation was aborted
            if (abortController.signal.aborted) return

            fullResponse += token

            // Update the streaming message
            setChats(prev =>
              prev.map(chat =>
                chat.id === chatId
                  ? {
                      ...chat,
                      messages: chat.messages.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: fullResponse }
                          : msg
                      ),
                      updatedAt: new Date().toISOString()
                    }
                  : chat
              )
            )
          }
        )

        if (!response.success) {
          throw new Error(response.error || "Failed to generate response")
        }

        // Mark streaming as complete
        setChats(prev =>
          prev.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content: fullResponse || response.data || "",
                          isStreaming: false
                        }
                      : msg
                  ),
                  updatedAt: new Date().toISOString()
                }
              : chat
          )
        )
      } catch (error) {
        console.error("Error generating response:", error)

        // Update message with error
        setChats(prev =>
          prev.map(chat =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === assistantMessage.id
                      ? {
                          ...msg,
                          content:
                            "Sorry, I encountered an error while generating a response. Please make sure Ollama is running and try again.",
                          isStreaming: false
                        }
                      : msg
                  ),
                  updatedAt: new Date().toISOString()
                }
              : chat
          )
        )
      } finally {
        setIsGenerating(false)
        setCurrentAbortController(null)
      }
    },
    [activeChat, chats, createNewChat, stopGeneration]
  )

  const regenerateLastMessage = useCallback(
    async (model: string) => {
      const targetChat = chats.find(c => c.id === activeChat)
      if (!targetChat || targetChat.messages.length < 2) return

      const messages = [...targetChat.messages]
      const lastUserMessage = messages[messages.length - 2]

      if (lastUserMessage?.role !== "user") return

      // Remove the last assistant message
      const updatedMessages = messages.slice(0, -1)

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: updatedMessages, updatedAt: new Date().toISOString() }
            : chat
        )
      )

      // Send the last user message again
      await sendMessage(lastUserMessage.content, model)
    },
    [activeChat, chats, sendMessage]
  )

  const editAndResendMessage = useCallback(
    async (messageId: string, newContent: string, model: string) => {
      const targetChat = chats.find(c => c.id === activeChat)
      if (!targetChat || !newContent.trim()) return

      const messageIndex = targetChat.messages.findIndex(m => m.id === messageId)
      if (
        messageIndex === -1 ||
        targetChat.messages[messageIndex]?.role !== "user"
      ) {
        return
      }

      // Truncate messages up to the point of the edited message
      const truncatedMessages = targetChat.messages.slice(0, messageIndex)

      setChats(prev =>
        prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: truncatedMessages,
                updatedAt: new Date().toISOString()
              }
            : chat
        )
      )

      // Send the edited content as a new message in the truncated chat
      await sendMessage(newContent, model)
    },
    [activeChat, chats, sendMessage]
  )

  return {
    chats,
    activeChat,
    isGenerating,
    setActiveChat,
    createNewChat,
    deleteChat,
    sendMessage,
    clearChat,
    updateChatTitle,
    regenerateLastMessage,
    editAndResendMessage,
    stopGeneration
  }
}