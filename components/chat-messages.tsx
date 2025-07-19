import { Bot } from "lucide-react"
import type { Message } from "@/types/chat"

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-6">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Start a conversation</p>
          <p className="text-sm">Ask me anything to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-6 rounded-xl shadow-sm transition-all duration-200 ${
            message.role === "user"
              ? "bg-primary text-primary-foreground ml-16 border border-primary/20"
              : "bg-muted mr-16 border border-border hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            {message.role === "assistant" && <Bot className="h-5 w-5 text-primary" />}
            {message.role === "user" && (
              <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
                U
              </div>
            )}
            <div className="text-sm font-medium opacity-90">{message.role === "user" ? "You" : "AI Assistant"}</div>
            <div className="text-xs opacity-60 ml-auto">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="text-base leading-relaxed whitespace-pre-wrap font-medium">{message.content}</div>
        </div>
      ))}
    </div>
  )
}
