"use client"

import { useState, useRef } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { StatsSidebar } from "@/components/stats-sidebar"
import { SettingsMenu } from "@/components/settings-menu"
import { TopBar } from "@/components/top-bar"
import { useChat } from "@/hooks/use-chat"
import { useTheme } from "@/hooks/use-theme"
import { useFileUpload } from "@/hooks/use-file-upload"

interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
}

type Theme = "light" | "dark" | "system"

const models = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
]

const externalTools = [
  { id: "web-search", name: "Web Search", description: "Search the web for current information", icon: "🌐" },
  { id: "code-interpreter", name: "Code Interpreter", description: "Execute and analyze code", icon: "💻" },
  { id: "image-generator", name: "Image Generator", description: "Generate images from text", icon: "🎨" },
  { id: "pdf-reader", name: "PDF Reader", description: "Extract and analyze PDF content", icon: "📄" },
  { id: "mcp", name: "MCP", description: "Model Context Protocol integration", icon: "🔗", isBeta: true },
]

const educationalTopics = [
  { topic: "Machine Learning", frequency: 45, resources: 12 },
  { topic: "React Development", frequency: 38, resources: 8 },
  { topic: "Data Science", frequency: 32, resources: 15 },
  { topic: "API Integration", frequency: 28, resources: 6 },
  { topic: "UI/UX Design", frequency: 22, resources: 9 },
]

export default function LLMInterface() {
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [prompt, setPrompt] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { theme, setTheme } = useTheme()
  const { chats, activeChat, setActiveChat, createNewChat, deleteChat, sendMessage } = useChat()
  const {
    uploadedFiles,
    isDragOver,
    handleFileUpload,
    handleDragOver: handleDragOverFile,
    handleDragLeave,
    handleDrop,
    removeFile,
  } = useFileUpload()

  const enhancePrompt = () => {
    if (!prompt.trim()) return
    const enhancedPrompt = `Please provide a comprehensive and detailed response to the following: ${prompt}\n\nPlease include:\n- Clear explanations\n- Relevant examples\n- Step-by-step guidance where applicable\n- Best practices and recommendations`
    setPrompt(enhancedPrompt)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleSendMessage = () => {
    sendMessage(prompt)
    setPrompt("")
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Left Sidebar - Chat Management */}
        {showLeftPanel && (
          <ChatSidebar
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            onCreateChat={createNewChat}
            onDeleteChat={deleteChat}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <TopBar
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            showLeftPanel={showLeftPanel}
            showRightPanel={showRightPanel}
            onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
            onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          />

          <div className="flex-1 flex">
            {/* Chat Area */}
            <MainChatArea
              currentChat={currentChat}
              prompt={prompt}
              onPromptChange={setPrompt}
              onSendMessage={handleSendMessage}
              onEnhancePrompt={enhancePrompt}
              isRecording={isRecording}
              onToggleRecording={toggleRecording}
              uploadedFiles={uploadedFiles}
              onRemoveFile={removeFile}
              fileInputRef={fileInputRef}
              isDragOver={isDragOver}
              onDragOver={handleDragOverFile}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            {/* Right Sidebar */}
            {showRightPanel && (
              <StatsSidebar
                prompt={prompt}
                isDragOver={isDragOver}
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
              />
            )}
          </div>
        </div>

        {/* Settings Menu */}
        <SettingsMenu theme={theme} onThemeChange={setTheme} />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </TooltipProvider>
  )
}
