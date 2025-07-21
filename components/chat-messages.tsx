import React from "react"
import { Bot, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"

interface ChatMessagesProps {
  messages: Message[]
}

// Dracula theme colors for code blocks only
const draculaColors = {
  background: "#282a36",
  currentLine: "#44475a",
  foreground: "#f8f8f2",
  comment: "#6272a4",
  cyan: "#8be9fd",
  green: "#50fa7b",
  orange: "#ffb86c",
  pink: "#ff79c6",
  purple: "#bd93f9",
  red: "#ff5555",
  yellow: "#f1fa8c",
}

function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g)
  
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3)
          const lines = codeContent.split('\n')
          const language = lines[0].trim() || 'text'
          const code = lines.slice(1).join('\n').trim()
          const codeId = `code-${index}`

          return (
            <div key={index} className="relative">
              <div 
                className="rounded-lg border overflow-hidden"
                style={{
                  backgroundColor: draculaColors.currentLine,
                  borderColor: draculaColors.comment
                }}
              >
                <div 
                  className="flex items-center justify-between px-3 py-2 border-b text-xs"
                  style={{
                    backgroundColor: draculaColors.background,
                    borderColor: draculaColors.comment
                  }}
                >
                  <span 
                    className="font-medium"
                    style={{ color: draculaColors.cyan }}
                  >
                    {language}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 hover:text-foreground"
                    style={{ 
                      color: draculaColors.foreground,
                      backgroundColor: 'transparent'
                    }}
                    onClick={() => copyCode(code, codeId)}
                  >
                    {copiedCode === codeId ? (
                      <Check className="h-3 w-3" style={{ color: draculaColors.green }} />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre 
                  className="p-4 overflow-x-auto text-sm"
                  style={{ color: draculaColors.foreground }}
                >
                  <code className="font-mono">{code}</code>
                </pre>
              </div>
            </div>
          )
        }

        if (part.startsWith('`') && part.endsWith('`')) {
          const inlineCode = part.slice(1, -1)
          return (
            <code
              key={index}
              className="px-1.5 py-0.5 rounded text-sm font-mono border"
              style={{
                backgroundColor: draculaColors.currentLine,
                color: draculaColors.purple,
                borderColor: draculaColors.comment
              }}
            >
              {inlineCode}
            </code>
          )
        }

        // Regular text remains unstyled
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      })}
    </div>
  )
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
    <div className="p-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-6 rounded-xl shadow-sm transition-all duration-200 ${
            message.role === "user"
              ? "bg-primary text-primary-foreground ml-16 border border-primary/20"
              : "bg-muted mr-16 border border-border hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            {message.role === "assistant" && <Bot className="h-5 w-5 text-primary" />}
            {message.role === "user" && (
              <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
                U
              </div>
            )}
            <div className="text-sm font-medium opacity-90">
              {message.role === "user" ? "You" : "AI Assistant"}
            </div>
            <div className="text-xs opacity-60 ml-auto">
              {message.timestamp.toString().slice(0, 16).replace("T", " ")}
            </div>
          </div>
          
          <div className="text-base leading-relaxed">
            {message.role === "user" ? (
              <div className="whitespace-pre-wrap font-medium">{message.content}</div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={message.content} />
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}