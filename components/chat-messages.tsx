"use client"

import React from "react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Bot, Copy, Check, Edit, Send, X, User, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"

interface ChatMessagesProps {
  messages: Message[]
  onEditMessage?: (id: string, newContent: string) => void
  onResendMessage?: (id: string, newContent: string) => void
  onEditAIMessage?: (id: string, newContent: string) => void
}

// Dracula theme colors with enhanced contrast
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

// Syntax highlighting function
const highlightSyntax = (code: string, language: string) => {
  if (!language || language === 'text') return code
  
  const keywords = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'throw'],
    python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'import', 'from', 'as', 'with', 'lambda'],
    typescript: ['interface', 'type', 'enum', 'implements', 'extends', 'namespace', 'declare'],
    html: ['<!DOCTYPE html>', '<html', '<head', '<body', '<div', '<span', '<p', '<a', '<img', '<script', '<style'],
    css: ['@media', '@keyframes', '@import', '@font-face', 'margin', 'padding', 'color', 'background', 'font-size', 'display', 'position']
  }

  const langKeywords = keywords[language as keyof typeof keywords] || []
  
  return code.split('\n').map((line, i) => {
    let highlightedLine = line
    
    // Highlight keywords
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g')
      highlightedLine = highlightedLine.replace(regex, `<span style="color: ${draculaColors.pink}">${keyword}</span>`)
    })
    
    // Highlight strings
    highlightedLine = highlightedLine.replace(/(['"])(.*?)\1/g, `<span style="color: ${draculaColors.green}">$1$2$1</span>`)
    
    // Highlight numbers
    highlightedLine = highlightedLine.replace(/\b(\d+)\b/g, `<span style="color: ${draculaColors.purple}">$1</span>`)
    
    // Highlight comments
    if (language === 'javascript' || language === 'typescript' || language === 'css') {
      highlightedLine = highlightedLine.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, `<span style="color: ${draculaColors.comment}">$&</span>`)
    }
    if (language === 'python') {
      highlightedLine = highlightedLine.replace(/#.*/g, `<span style="color: ${draculaColors.comment}">$&</span>`)
    }
    
    return highlightedLine
  }).join('\n')
}

function MarkdownRenderer({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Enhanced regex to handle markdown features
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|\*\*.*?\*\*|_.*?_|\n- .*?(?=\n)|^\* .*$(?:\n^\* .*$)*)/gm)
  
  return (
    <div className="space-y-3">
      {parts.filter(part => part && part.trim() !== '').map((part, index) => {
        // Code blocks
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3)
          const lines = codeContent.split('\n')
          const language = lines[0].trim() || 'text'
          const code = lines.slice(1).join('\n').trim()
          const codeId = `code-${index}`
          const highlightedCode = highlightSyntax(code, language)

          return (
            <div key={index} className="relative group">
              <div 
                className="rounded-lg overflow-hidden shadow-md border"
                style={{
                  backgroundColor: draculaColors.background,
                  borderColor: draculaColors.comment
                }}
              >
                <div 
                  className="flex items-center justify-between px-4 py-2 border-b"
                  style={{
                    backgroundColor: draculaColors.currentLine,
                    borderColor: draculaColors.comment
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-mono text-xs font-medium"
                      style={{ color: draculaColors.cyan }}
                    >
                      {language}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-2 hover:bg-background/20"
                    style={{ 
                      color: draculaColors.foreground,
                    }}
                    onClick={() => copyCode(code, codeId)}
                  >
                    {copiedCode === codeId ? (
                      <Check className="h-3.5 w-3.5" style={{ color: draculaColors.green }} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <pre 
                  className="p-4 overflow-x-auto text-sm leading-relaxed"
                  style={{ 
                    backgroundColor: draculaColors.background
                  }}
                >
                  <code 
                    className="font-mono"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                </pre>
              </div>
            </div>
          )
        }

        // Inline code
        if (part.startsWith('`') && part.endsWith('`')) {
          const inlineCode = part.slice(1, -1)
          return (
            <code
              key={index}
              className="px-4 py-0.5 rounded-md text-sm font-mono bg-background border"
              style={{
                color: draculaColors.purple,
                borderColor: draculaColors.comment
              }}
            >
              {inlineCode}
            </code>
          )
        }

        // Images
        if (part.startsWith('![')) {
          const altText = part.match(/!\[(.*?)\]/)?.[1] || ''
          const src = part.match(/\((.*?)\)/)?.[1] || ''
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border">
              <Image 
                src={src} 
                alt={altText} 
                width={500}
                height={300}
                className="max-w-full h-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {altText && (
                <div className="text-xs text-center p-2 text-muted-foreground bg-muted">
                  {altText}
                </div>
              )}
            </div>
          )
        }

        // Links
        if (part.startsWith('[') && part.includes('](')) {
          const text = part.match(/\[(.*?)\]/)?.[1] || ''
          const url = part.match(/\((.*?)\)/)?.[1] || ''
          return (
            <a 
              key={index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {text || url}
            </a>
          )
        }

        // Bold text
        if (part.startsWith('**') && part.endsWith('**')) {
          const text = part.slice(2, -2)
          return (
            <strong key={index} className="font-semibold">
              {text}
            </strong>
          )
        }

        // Italic text
        if (part.startsWith('_') && part.endsWith('_')) {
          const text = part.slice(1, -1)
          return (
            <em key={index} className="italic">
              {text}
            </em>
          )
        }

        // Lists
        if (part.startsWith('\n- ') || part.startsWith('* ')) {
          const items = part.split('\n').filter(item => item.trim())
          return (
            <ul key={index} className="list-disc pl-5 space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-sm">
                  {item.replace(/^[-*] /, '')}
                </li>
              ))}
            </ul>
          )
        }

        // Arrays (JSON-like)
        if (part.trim().startsWith('[') && part.trim().endsWith(']')) {
          try {
            const array = JSON.parse(part)
            if (Array.isArray(array)) {
              return (
                <div key={index} className="bg-muted/50 p-3 rounded-lg border">
                  <div className="text-xs font-mono text-muted-foreground mb-1">Array ({array.length} items)</div>
                  <div className="max-h-60 overflow-y-auto">
                    {array.map((item, i) => (
                      <div key={i} className="text-sm p-1.5 border-b last:border-b-0">
                        {typeof item === 'object' ? JSON.stringify(item) : item.toString()}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          } catch (e) {
            // Not a valid JSON array
          }
        }

        // Regular text with proper line breaks
        return (
          <span key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
            {part.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
          </span>
        )
      })}
    </div>
  )
}

export function ChatMessages({ 
  messages,
  onEditMessage,
  onResendMessage,
  onEditAIMessage
}: ChatMessagesProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editContent, setEditContent] = React.useState('')
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null)

  const handleStartEdit = (message: Message) => {
    setEditingId(message.id)
    setEditContent(message.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = (resend?: boolean, isAIMessage?: boolean) => {
    console.log("handleSaveEdit called", { editingId, editContent, resend, isAIMessage });
    if (editingId && editContent.trim()) {
      if (isAIMessage && onEditAIMessage) {
        console.log("Calling onEditAIMessage", { editingId, editContent });
        onEditAIMessage(editingId, editContent)
      } else if (onEditMessage) {
        console.log("Calling onEditMessage", { editingId, editContent });
        onEditMessage(editingId, editContent)
      }

      if (resend && onResendMessage) {
        console.log("Calling onResendMessage", { editingId, editContent });
        onResendMessage(editingId, editContent)
      }
      setEditingId(null)
      setEditContent('')
    }
  }

  const handleCopyMessage = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Start a conversation</p>
          <p className="text-sm">Ask me anything to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 p-4 rounded-lg transition-all duration-200 ${
            message.role === "user"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
          
          <div className={`flex-1 max-w-3xl rounded-xl p-4 relative ${
            message.role === "user"
              ? "bg-primary/5 border border-primary/20"
              : "bg-muted/50 border border-border"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium">
                {message.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div className="text-xs text-muted-foreground ml-auto">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {/* Copy button only for assistant messages */}
                {message.role === "user" && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopyMessage(message.content, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleStartEdit(message)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopyMessage(message.content, message.id)}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleStartEdit(message)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="text-base leading-relaxed">
              {editingId === message.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-background min-h-[100px] text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEdit}
                      className="gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    {message.role === "user" && onResendMessage && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleSaveEdit(true)}
                        className="gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Resend
                      </Button>
                    )}
                    {message.role === "assistant" && onEditAIMessage && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(false, true)}
                        className="gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                message.role === "user" ? (
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert prose-pre:bg-transparent prose-pre:p-0">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "")
                          const language = match?.[1] || ""
                          if (inline) {
                            return (
                              <code className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground" {...props}>
                                {children}
                              </code>
                            )
                          }
                          const content = String(children).replace(/\n$/, "")
                          const highlighted = highlightSyntax(content, language)
                          const codeId = `code-${message.id}`
                          return (
                            <div className="relative group border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/50">
                                <span className="font-mono text-xs text-muted-foreground">{language || 'text'}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(content)
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <pre className="p-3 overflow-x-auto text-sm leading-relaxed" style={{ backgroundColor: draculaColors.background }}>
                                <code
                                  className="font-mono"
                                  dangerouslySetInnerHTML={{ __html: highlighted }}
                                />
                              </pre>
                            </div>
                          )
                        },
                        a({ children, href, ...props }: any) {
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" {...props}>
                              {children}
                            </a>
                          )
                        },
                        img({ alt, src }: any) {
                          if (!src || typeof src !== 'string') return null
                          return (
                            <Image src={src} alt={alt || ''} width={500} height={300} className="max-w-full h-auto rounded border" />
                          )
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {message.role === "user" && (
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}