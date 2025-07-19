"use client"

import { useState } from "react"
import type { Chat, Message } from "@/types/chat"

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "New Chat",
      messages: [
        {
          id: "demo-1",
          role: "user",
          content: "Hello! Can you help me understand how machine learning works?",
          timestamp: new Date(Date.now() - 300000),
        },
        {
          id: "demo-2",
          role: "assistant",
          content:
            "Hello! I'd be happy to help you understand machine learning. Machine learning is a subset of artificial intelligence (AI) that enables computers to learn and make decisions from data without being explicitly programmed for every task.\n\nHere are the key concepts:\n\n1. **Data**: The foundation of ML - algorithms learn patterns from examples\n2. **Algorithms**: Mathematical models that find patterns in data\n3. **Training**: The process of teaching the algorithm using historical data\n4. **Prediction**: Using the trained model to make decisions on new data\n\nWould you like me to explain any specific aspect in more detail?",
          timestamp: new Date(Date.now() - 250000),
        },
      ],
      createdAt: new Date(),
    },
  ])
  const [activeChat, setActiveChat] = useState("1")

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
      messages: [],
      createdAt: new Date(),
    }
    setChats([...chats, newChat])
    setActiveChat(newChat.id)
  }

  const deleteChat = (chatId: string) => {
    if (chats.length === 1) return
    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    setChats(updatedChats)
    if (activeChat === chatId) {
      setActiveChat(updatedChats[0].id)
    }
  }

  const sendMessage = (prompt: string) => {
    if (!prompt.trim()) return

    const currentChat = chats.find((chat) => chat.id === activeChat)
    if (!currentChat) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    }

    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage],
    }

    setChats(chats.map((chat) => (chat.id === activeChat ? updatedChat : chat)))

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a simulated response from the AI model. In a real implementation, this would be the actual model response based on your prompt and the selected model.",
        timestamp: new Date(),
      }

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiResponse],
      }

      setChats((prevChats) => prevChats.map((chat) => (chat.id === activeChat ? finalChat : chat)))
    }, 1000)
  }

  return {
    chats,
    activeChat,
    setActiveChat,
    createNewChat,
    deleteChat,
    sendMessage,
  }
}
