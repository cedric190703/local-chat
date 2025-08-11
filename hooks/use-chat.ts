/**
 * @file This file contains the core chat hook for the local chat application.
 * It manages the chat state, including messages, chats, and the active chat.
 */

import { useState, useCallback } from "react"
import { enhancedChatService } from "@/services/agent-service"
import { documentContextManager } from "@/services/document-context"

/**
 * Represents a message in the chat.
 */
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  isStreaming?: boolean
  files?: Array <{
    id: string
    name: string
    type: string
    size?: string
    icon?: string
  }> 
}

/**
 * Represents a chat session.
 */
export interface Chat {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: string
  updatedAt: string
}

/**
 * Represents the return value of the useChat hook.
 */
export interface UseChatReturn {
  chats: Chat[]
  activeChat: string | null
  isGenerating: boolean
  setActiveChat: (chatId: string) => void
  createNewChat: (options?: { model?: string; title?: string }) => Chat
  deleteChat: (chatId: string) => void
  sendMessage: (content: string, model: string, initialResponse?: string, files?: Array <{id: string, name: string, type: string, size?: string}>) => Promise<void>
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

/**
 * A custom hook for managing the chat state.
 * @returns The chat state and functions for managing it.
 */
export function useChat(): UseChatReturn {
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null)

  /**
   * Generates a unique ID.
   * @returns A unique ID.
   */
  const generateId = () => Math.random().toString(36).substr(2, 9)

  /**
   * Gets the icon for a given file type.
   * @param type The file type.
   * @param name The file name.
   * @returns The icon for the file type.
   */
  const getFileIcon = (type: string, name: string): string => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('audio/')) return '🎵'
    if (type.startsWith('video/')) return '🎥'
    if (type === 'application/pdf') return '📄'
    if (type === 'application/json') return '📋'
    if (name.endsWith('.md')) return '📝'
    if (name.endsWith('.py')) return '🐍'
    if (name.endsWith('.js') || name.endsWith('.ts')) return '⚡'
    if (name.endsWith('.html')) return '🌐'
    if (name.endsWith('.css')) return '🎨'
    if (name.endsWith('.csv')) return '📊'
    if (name.endsWith('.sql')) return '🗄️'
    return '📄'
  }

  /**
   * Creates a new chat.
   * @param options The options for creating the new chat.
   * @returns The new chat.
   */
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

  /**
   * Deletes a chat.
   * @param chatId The ID of the chat to delete.
   */
  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    setActiveChat(prev => (prev === chatId ? null : prev))
  }, [])

  /**
   * Clears a chat.
   * @param chatId The ID of the chat to clear.
   */
  const clearChat = useCallback((chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [], updatedAt: new Date().toISOString() }
          : chat
      )
    )
  }, [])

  /**
   * Updates the title of a chat.
   * @param chatId The ID of the chat to update.
   * @param title The new title of the chat.
   */
  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, title, updatedAt: new Date().toISOString() }
          : chat
      )
    )
  }, [])

  /**
   * Generates a title from the content of a message.
   * @param content The content of the message.
   * @returns The generated title.
   */
  const generateTitle = (content: string): string => {
    // Generate a simple title from the first message
    const words = content.trim().split(" ").slice(0, 6)
    return words.join(" ") + (words.length === 6 ? "..." : "")
  }

  /**
   * Stops the generation of a response.
   */
  const stopGeneration = useCallback(() => {
    if (currentAbortController) {
      currentAbortController.abort()
      setCurrentAbortController(null)
      setIsGenerating(false)
    }
  }, [currentAbortController])

  /**
   * Sends a message to the chat.
   * @param content The content of the message.
   * @param model The model to use for the response.
   * @param initialResponse The initial response to display.
   * @param files The files to include with the message.
   */
  const sendMessage = useCallback(
    async (content: string, model: string, initialResponse?: string, files?: Array <{id: string, name: string, type: string, size?: string}>) => {
      if (!content.trim() || !model) return;

      // Start new prompt context for document management
      const promptId = documentContextManager.startNewPrompt();

      // Stop any ongoing generation
      stopGeneration();

      let chatId = activeChat;
      let targetChat = chats.find(c => c.id === activeChat);

      // Create new chat if none exists or is selected
      if (!targetChat) {
        targetChat = createNewChat({ model, title: generateTitle(content) });
        chatId = targetChat.id;
        setActiveChat(chatId);
      }

      // Add file icons to files if not present
      const filesWithIcons = files?.map(file => ({
        ...file,
        icon: getFileIcon(file.type, file.name)
      }));

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
        files: filesWithIcons
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: initialResponse || "",
        timestamp: new Date().toISOString(),
        isStreaming: true
      };

      // Add user message and placeholder assistant message
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage, assistantMessage],
                model,
                updatedAt: new Date().toISOString(),
                title: chat.messages.length === 0 ? generateTitle(content) : chat.title
              }
            : chat
        )
      );

      setIsGenerating(true);

      try {
        // Create abort controller for this request
        const abortController = new AbortController();
        setCurrentAbortController(abortController);

        let fullResponse = initialResponse || "";

        // Add files to document context
        if (files) {
          files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            documentContextManager.addDocumentToCurrentPrompt(file.name, '', isImage);
          });
        }

        // Get document context for this prompt
        const documentContext = await documentContextManager.getDocumentContext(content, promptId);
        
        // Prepare enhanced message with context
        const enhancedMessage = documentContext 
          ? `${content}\n\n${documentContext}`
          : content;

        // Use the enhanced chat service with LangChain/LangGraph capabilities
        const response = await enhancedChatService.streamMessage(
          enhancedMessage,
          chatId || 'default',
          model,
          (chunk: string) => {
            // Check if generation was aborted
            if (abortController.signal.aborted) return;

            fullResponse += chunk;

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
            );
          },
        );

        // The enhanced chat service returns a string, not an object with success/error
        if (!response || response.includes('Error')) {
          throw new Error(response || "Failed to generate response");
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
                          content: fullResponse || response || "",
                          isStreaming: false
                        }
                      : msg
                  ),
                  updatedAt: new Date().toISOString()
                }
              : chat
          )
        );
      } catch (error) {
        console.error("Error generating response:", error);

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
        );
      } finally {
        setIsGenerating(false);
        setCurrentAbortController(null);
      }
    },
    [activeChat, chats, createNewChat, stopGeneration]
  );

  /**
   * Regenerates the last message in the chat.
   * @param model The model to use for the response.
   */
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

  /**
   * Edits a message and resends it.
   * @param messageId The ID of the message to edit.
   * @param newContent The new content of the message.
   * @param model The model to use for the response.
   */
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
