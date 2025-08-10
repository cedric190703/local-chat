"use client"

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Bot, Copy, Check, Edit, X, Save, Send, User } from 'lucide-react'
import { usePreferences } from '@/hooks/use-preferences'
import { useTheme } from 'next-themes'
import { Message } from '@/hooks/use-chat'

interface ChatMessagesProps {
  messages: Message[]
  onEditMessage?: (id: string, newContent: string) => void
  onResendMessage?: (id: string, newContent: string) => void
  onEditAIMessage?: (id: string, newContent: string) => void
}

// Code theme color definitions
const codeThemes = {
  dracula: {
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
  },
  github: {
    background: "#ffffff",
    currentLine: "#f6f8fa",
    foreground: "#24292f",
    comment: "#6a737d",
    cyan: "#0969da",
    green: "#1a7f37",
    orange: "#d1242f",
    pink: "#8250df",
    purple: "#8250df",
    red: "#cf222e",
    yellow: "#bf8700",
  },
  vscode: {
    background: "#1e1e1e",
    currentLine: "#2d2d30",
    foreground: "#d4d4d4",
    comment: "#6a9955",
    cyan: "#4ec9b0",
    green: "#6a9955",
    orange: "#ce9178",
    pink: "#c586c0",
    purple: "#c586c0",
    red: "#f44747",
    yellow: "#dcdcaa",
  }
}

interface MarkdownRendererProps {
  content: string
  font?: 'sans' | 'serif' | 'mono'
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark' | 'auto'
  style?: 'default' | 'compact' | 'spacious'
}

function MarkdownRenderer({ 
  content, 
  font = 'sans', 
  size = 'md', 
  theme = 'auto',
  style = 'default'
}: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)
  const [showInsights, setShowInsights] = React.useState(false)

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Content analysis for insights
  const analyzeContent = (content: string) => {
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
    const inlineCode = (content.match(/`[^`]+`/g) || []).length
    const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length
    const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length
    const boldText = (content.match(/\*\*.*?\*\*/g) || []).length
    const italicText = (content.match(/_.*?_/g) || []).length
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed: 200 words per minute
    
    return {
      codeBlocks,
      inlineCode,
      links,
      images,
      boldText,
      italicText,
      wordCount,
      readingTime
    }
  }

  const insights = analyzeContent(content)

  // Enhanced regex to handle markdown features including titles
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`|!\[.*?\]\(.*?\)|\[.*?\]\(.*\)|\*\*.*?\*\*|_.*?_|\n- .*?(?=\n)|^\* .*$(?:\n^\* .*$)*|^#{1,6} .+$)/gm)
  
  // Dynamic styling based on props
  const getFontClass = () => {
    switch (font) {
      case 'serif': return 'font-serif'
      case 'mono': return 'font-mono'
      default: return 'font-sans'
    }
  }
  
  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm'
      case 'lg': return 'text-lg'
      default: return 'text-base'
    }
  }
  
  const getSpacingClass = () => {
    switch (style) {
      case 'compact': return 'space-y-1'
      case 'spacious': return 'space-y-6'
      default: return 'space-y-3'
    }
  }
  
  const fontClass = getFontClass()
  const sizeClass = getTextSize()
  const spacingClass = getSpacingClass()
  const themeClass = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : ''
  
  return (
    <div className={`${spacingClass} ${fontClass} ${sizeClass} ${themeClass}`}>
      {/* Content Insights Panel */}
      {showInsights && (
        <div className={`mb-4 p-4 rounded-lg border shadow-sm bg-blue-200 border-gray-200`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📊</span>
              <h4 className='text-sm font-semibold text-black'>
                Content Insights
              </h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInsights(false)}
              className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-200 border border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              title="Close insights"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className={`grid grid-cols-2 gap-3 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            <div className={`flex items-center gap-1 text-black`}>
              <span className="text-sm">📝</span>
              <span className="font-medium">Words:</span> 
              <span className={`font-semibold text-black`}>{insights.wordCount}</span>
            </div>
            <div className='flex items-center gap-1 text-black'>
              <span className="text-sm">⏱️</span>
              <span className="font-medium">Reading:</span> 
              <span className='font-semibold text-black'>{insights.readingTime}min</span>
            </div>
            {insights.codeBlocks > 0 && (
              <div className='flex items-center gap-1 text-black'>
                <span className="text-sm">💻</span>
                <span className="font-medium">Code blocks:</span> 
                <span className='font-semibold text-black'>{insights.codeBlocks}</span>
              </div>
            )}
            {insights.inlineCode > 0 && (
              <div className='flex items-center gap-1 text-black'>
                <span className="text-sm">⌨️</span>
                <span className="font-medium">Inline code:</span> 
                <span className='font-semibold text-black'>{insights.inlineCode}</span>
              </div>
            )}
            {insights.links > 0 && (
              <div className='flex items-center gap-1 text-gray-300'>
                <span className="text-sm">🔗</span>
                <span className="font-medium">Links:</span> 
                <span className='font-semibold text-black'>{insights.links}</span>
              </div>
            )}
            {insights.images > 0 && (
              <div className='flex items-center gap-1 text-black'>
                <span className="text-sm">🖼️</span>
                <span className="font-medium">Images:</span> 
                <span className='font-semibold text-black'>{insights.images}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Insights Toggle Button */}
      {!showInsights && (insights.wordCount > 50 || insights.codeBlocks > 0 || insights.links > 0) && (
        <div className={`${style === 'compact' ? 'mb-1' : style === 'spacious' ? 'mb-4' : 'mb-2'}`}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInsights(true)}
            className={`${size === 'sm' ? 'h-6 text-xs px-2' : size === 'lg' ? 'h-8 text-sm px-4' : 'h-7 text-xs px-3'} transition-all duration-200 border-gray-300 hover:bg-blue-300 text-blue-700' `}
            title="View content statistics and analysis"
          >
            <span className="mr-1">📊</span>
            Show Insights
          </Button>
        </div>
      )}
      
      {parts.filter(part => part && part.trim() !== '').map((part, index) => {
        // Code blocks
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3)
          const lines = codeContent.split('\n')
          const language = lines[0].trim() || 'text'
          const code = lines.slice(1).join('\n').trim()
          const codeId = `code-${index}`
          // Simplified code rendering - no HTML markup
          const getPlainCode = (code: string) => {
            return code
          }
          const plainCode = getPlainCode(code)
          
          // Dynamic styling based on theme and size
          const codeBlockPadding = style === 'compact' ? 'p-2' : style === 'spacious' ? 'p-6' : 'p-4'
          const headerPadding = style === 'compact' ? 'px-3 py-1.5' : style === 'spacious' ? 'px-5 py-3' : 'px-4 py-2'
          const languageLabelSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
          
          // Theme-based colors
          const getCodeBlockTheme = () => {
            return {
              background: '#dbeafe', // Equivalent to bg-blue-100 (softer) or bg-blue-200 (stronger)
              border: '#bfdbfe',     // Equivalent to border-blue-200
              headerBg: '#bfdbfe',  // Slightly darker blue for header
              headerBorder: '#93c5fd', // Border color for header
              languageColor: '#1444c7ff', // Darker blue for language label
              textColor: '#1e3a8a'     // Dark blue for text (readable on light bg)
            };
          };
          
          const codeTheme = getCodeBlockTheme()

          return (
            <div key={index} className="relative group">
              <div 
                className="rounded-lg overflow-hidden shadow-md border"
                style={{
                  backgroundColor: codeTheme.background,
                  borderColor: codeTheme.border
                }}
              >
                <div 
                  className={`flex items-center justify-between ${headerPadding} border-b`}
                  style={{
                    backgroundColor: codeTheme.headerBg,
                    borderColor: codeTheme.headerBorder
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-mono ${languageLabelSize} font-medium`}
                      style={{ color: codeTheme.languageColor }}
                    >
                      {language}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-2 hover:bg-background/20"
                    style={{ 
                      color: codeTheme.textColor,
                    }}
                    onClick={() => copyCode(code, codeId)}
                  >
                    {copiedCode === codeId ? (
                      <Check className="h-3.5 w-3.5" style={{ color: theme === 'dark' ? '#10b981' : theme === 'light' ? '#059669' : codeThemes.dracula.green }} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <pre 
                  className={`${codeBlockPadding} rounded-lg border overflow-x-auto font-mono ${getFontClass()} ${getTextSize()} bg-gray-800 text-gray-200`}
                >
                  {plainCode}
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
              className={`px-1.5 py-0.5 rounded font-mono border bg-gray-700 text-purple-300 ${getTextSize()}`}
            >
              {inlineCode}
            </code>
          )
        }

        // Images
        if (part.startsWith('![')) {
          const altText = part.match(/!\[(.*?)\]/)?.[1] || ''
          const src = part.match(/\((.*?)\)/)?.[1] || ''
          const imageSpacing = style === 'compact' ? 'my-2' : style === 'spacious' ? 'my-6' : 'my-3'
          return (
            <div key={index} className={`${imageSpacing} rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : theme === 'light' ? 'border-gray-200' : 'border-border'}`}>
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
              {showInsights && (
                <div className={'mb-4 p-4 rounded-lg border shadow-sm bg-gray-800 border-gray-600'}>
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
          const linkColor = 'text-blue-400 hover:text-blue-300'
          return (
            <a 
              key={index} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${linkColor} ${getFontClass()} ${getTextSize()} underline transition-colors duration-200`}
              title={url}
            >
              {text || url}
            </a>
          )
        }

        // Bold text
        if (part.startsWith('**') && part.endsWith('**')) {
          const text = part.slice(2, -2)
          const boldWeight = style === 'compact' ? 'font-medium' : 'font-semibold'
          return (
            <strong key={index} className={`${boldWeight} ${getFontClass()} ${getTextSize()} text-gray-100`}>
              {text}
            </strong>
          )
        }

        // Italic text
        if (part.startsWith('_') && part.endsWith('_')) {
          const text = part.slice(1, -1)
          return (
            <em key={index} className={`italic ${getFontClass()} ${getTextSize()} text-gray-200`}>
              {text}
            </em>
          )
        }

        // Markdown titles (h1-h6)
        if (part.match(/^#{1,6} .+$/)) {
          const level = part.match(/^(#{1,6})/)?.[1].length || 1
          const text = part.replace(/^#{1,6} /, '')
          
          const getTitleStyles = (level: number) => {
            const baseStyles = `font-bold leading-tight ${getFontClass()}`
            const themeClass = 'text-gray-100'
            const sizeClass = getTextSize()
            
            switch (level) {
              case 1: return `${sizeClass} ${baseStyles} ${themeClass} mb-4 mt-6 border-b border-border pb-2`
              case 2: return `${sizeClass} ${baseStyles} ${themeClass} mb-3 mt-5`
              case 3: return `${sizeClass} ${baseStyles} ${themeClass} mb-2 mt-4`
              case 4: return `${sizeClass} ${baseStyles} ${themeClass} mb-2 mt-3`
              case 5: return `${sizeClass} ${baseStyles} ${themeClass} mb-1 mt-2`
              case 6: return `${sizeClass} ${baseStyles} ${themeClass} mb-1 mt-2`
              default: return `${sizeClass} ${baseStyles} ${themeClass} mb-2 mt-3`
            }
          }
          
          // Render appropriate heading level
          switch (level) {
            case 1:
              return <h1 key={index} className={getTitleStyles(level)}>{text}</h1>
            case 2:
              return <h2 key={index} className={getTitleStyles(level)}>{text}</h2>
            case 3:
              return <h3 key={index} className={getTitleStyles(level)}>{text}</h3>
            case 4:
              return <h4 key={index} className={getTitleStyles(level)}>{text}</h4>
            case 5:
              return <h5 key={index} className={getTitleStyles(level)}>{text}</h5>
            case 6:
              return <h6 key={index} className={getTitleStyles(level)}>{text}</h6>
            default:
              return <h3 key={index} className={getTitleStyles(level)}>{text}</h3>
          }
        }

        // Lists
        if (part.startsWith('\n- ') || part.startsWith('* ')) {
          const items = part.split('\n').filter((item: string) => item.trim())
          return (
            <ul key={index} className={`list-disc pl-5 ${getSpacingClass()} ${getFontClass()}`}>
              {items.map((item: string, i: number) => (
                <li key={i} className={`${getTextSize()} text-gray-200`}>
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
  const { markdownFont, markdownSize, markdownTheme, markdownStyle } = usePreferences()
  const { theme: appTheme } = useTheme()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editContent, setEditContent] = React.useState('')
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null)

  // Simplified theme resolution using Next.js useTheme hook
  const effectiveTheme = markdownTheme === 'auto' ? appTheme : markdownTheme

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
                  <div className="space-y-3">
                    {/* File Input Section - Clearly linked to the message below */}
                    {(() => {
                      // Use files from message data instead of parsing content
                      const messageFiles = message.files || [];
                      if (messageFiles.length > 0) {
                        return (
                          <div className="relative">
                            {/* File Input Header with clear connection indicator */}
                            <div className={`flex items-center gap-2 ${markdownStyle === 'compact' ? 'mb-2' : markdownStyle === 'spacious' ? 'mb-4' : 'mb-3'}`}>
                              <div className={`flex items-center gap-1.5 font-semibold text-muted-foreground bg-muted/50 rounded-full border ${
                                markdownSize === 'sm' ? 'text-xs px-2 py-0.5' : 
                                markdownSize === 'lg' ? 'text-sm px-3 py-1.5' : 
                                'text-xs px-2.5 py-1'
                              }`}>
                                <span className={markdownSize === 'sm' ? 'text-xs' : markdownSize === 'lg' ? 'text-base' : 'text-sm'}>📎</span>
                                <span>File Input ({messageFiles.length})</span>
                              </div>
                              <div className="flex-1 h-px bg-border"></div>
                              <div className="w-2 h-2 bg-primary/60 rounded-full"></div>
                            </div>
                            
                            {/* File Cards with enhanced visual connection */}
                            <div className={`grid gap-2 ${markdownStyle === 'compact' ? 'mb-2' : markdownStyle === 'spacious' ? 'mb-6' : 'mb-4'}`}>
                              {messageFiles.map((file, index: number) => (
                                <div
                                  key={index}
                                  className={`group relative flex items-center rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/30 transition-all duration-200 ${
                                    markdownStyle === 'compact' ? 'gap-2 p-2' : 
                                    markdownStyle === 'spacious' ? 'gap-4 p-4' : 
                                    'gap-3 p-3'
                                  }`}
                                  title={`File: ${file.name} (${file.type}) ${file.size ? `- ${file.size}` : ''}`}
                                >
                                  {/* Connection line to message */}
                                  <div className="absolute -right-2 top-1/2 w-4 h-px bg-primary/40 group-hover:bg-primary/60 transition-colors"></div>
                                  
                                  {/* File icon with enhanced styling */}
                                  <div className={`flex-shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center ${
                                    markdownSize === 'sm' ? 'w-8 h-8' : 
                                    markdownSize === 'lg' ? 'w-12 h-12' : 
                                    'w-10 h-10'
                                  }`}>
                                    <span className={`${
                                      markdownSize === 'sm' ? 'text-lg' : 
                                      markdownSize === 'lg' ? 'text-2xl' : 
                                      'text-xl'
                                    }`}>{file.icon || '📄'}</span>
                                  </div>
                                  
                                  {/* File information */}
                                  <div className="flex-1 min-w-0">
                                    <div className={`flex items-center gap-2 ${markdownStyle === 'compact' ? 'mb-0.5' : 'mb-1'}`}>
                                      <span className={`font-semibold text-foreground truncate max-w-[200px] ${
                                        markdownSize === 'sm' ? 'text-sm' : 
                                        markdownSize === 'lg' ? 'text-lg' : 
                                        'text-base'
                                      }`}>
                                        {file.name}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium ${
                                        markdownSize === 'sm' ? 'text-xs' : 
                                        markdownSize === 'lg' ? 'text-sm' : 
                                        'text-xs'
                                      }`}>
                                        {file.type.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className={`flex items-center gap-2 text-muted-foreground ${
                                      markdownSize === 'sm' ? 'text-xs' : 
                                      markdownSize === 'lg' ? 'text-sm' : 
                                      'text-xs'
                                    }`}>
                                      {file.size && (
                                        <span className="flex items-center gap-1">
                                          <span>📊</span>
                                          <span>{file.size}</span>
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <span>🔗</span>
                                        <span>Linked to prompt below</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Visual connection to message */}
                            <div className="absolute -bottom-2 left-4 w-px h-4 bg-gradient-to-b from-primary/40 to-transparent"></div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Apply markdown renderer to user messages too */}
                    <div className={`prose ${
                        markdownSize === 'sm' ? 'prose-sm' : markdownSize === 'lg' ? 'prose-lg' : 'prose-base'
                      } max-w-none dark:prose-invert prose-pre:bg-transparent prose-pre:p-0`}>
                      <MarkdownRenderer 
                        content={(() => {
                          let cleanContent = message.content;
                          
                          // Remove all file-related content blocks completely
                          cleanContent = cleanContent.replace(/IMAGE_FILE:[\s\S]*?(?=\n(?![A-Z_]+:)|$)/g, '');
                          cleanContent = cleanContent.replace(/DOCUMENT_FILE:[\s\S]*?(?=\n(?![A-Z_]+:)|$)/g, '');
                          cleanContent = cleanContent.replace(/BINARY_FILE:[\s\S]*?(?=\n(?![A-Z_]+:)|$)/g, '');
                          
                          // Remove any remaining file metadata patterns
                          cleanContent = cleanContent.replace(/Type:\s*[^\n]*\n?/g, '');
                          cleanContent = cleanContent.replace(/Size:\s*[^\n]*\n?/g, '');
                          cleanContent = cleanContent.replace(/Base64:\s*[^\n]*\n?/g, '');
                          cleanContent = cleanContent.replace(/Content:\s*[\s\S]*?(?=\n[A-Z]|$)/g, '');
                          cleanContent = cleanContent.replace(/Description:\s*[^\n]*\n?/g, '');
                          
                          // Clean up excessive whitespace and empty lines
                          cleanContent = cleanContent.replace(/\n\s*\n\s*\n+/g, '\n\n');
                          cleanContent = cleanContent.replace(/^\s+|\s+$/g, '');
                          
                          // If content is empty or only contains file references, show placeholder
                          if (!cleanContent || cleanContent.length < 3) {
                            const fileCount = message.files?.length || 0;
                            return fileCount > 0 ? "Files uploaded for analysis" : "Message";
                          }
                          
                          return cleanContent;
                        })()}
                        font={markdownFont}
                        size={markdownSize}
                        style={markdownStyle}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`prose ${
                      markdownSize === 'sm' ? 'prose-sm' : markdownSize === 'lg' ? 'prose-lg' : 'prose-base'
                    } max-w-none dark:prose-invert prose-pre:bg-transparent prose-pre:p-0`}>
                    <MarkdownRenderer 
                      content={message.content} 
                      font={markdownFont}
                      size={markdownSize}
                      style={markdownStyle}
                    />
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