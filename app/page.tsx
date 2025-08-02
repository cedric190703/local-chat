"use client"

import { useState, useRef, useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { SettingsMenu } from "@/components/settings-menu"
import { TopBar } from "@/components/top-bar"
import { useChat } from "@/hooks/use-chat"
import { useTheme } from "@/hooks/use-theme"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ollamaService from "@/services/ollama-service"
import type { Message } from "@/types/chat"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Sidebar, SidebarInset, useSidebar } from "@/components/ui/sidebar"

export default function LLMInterface() {
  const [selectedModel, setSelectedModel] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showOllamaSetup, setShowOllamaSetup] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery()

  const { theme, setTheme } = useTheme()
  const { 
    chats, 
    activeChat, 
    isGenerating,
    setActiveChat, 
    createNewChat, 
    deleteChat, 
    sendMessage,
    stopGeneration 
  } = useChat()
  const {
    uploadedFiles,
    isDragOver,
    handleFileUpload,
    handleDragOver: handleDragOverFile,
    handleDragLeave,
    handleDrop,
    removeFile,
  } = useFileUpload()

  const [messages, setMessages] = useState<Message[]>([])

  const handleEditMessage = (id: string, newContent: string) => {
    setMessages(prev => {
      const index = prev.findIndex(m => m.id === id)
      if (index === -1) return prev
      
      const updated = [...prev.slice(0, index + 1)]
      updated[index] = { ...updated[index], content: newContent }
      return updated
    })
  }

  const handleResendMessage = (id: string) => {
    const message = messages.find(m => m.id === id)
    if (!message) return
    
    setMessages(prev => prev.slice(0, prev.findIndex(m => m.id === id) + 1))
    sendMessage(message.content, selectedModel)
  }
  
  useEffect(() => {
    const checkOllama = async () => {
      setOllamaStatus('checking')
      const isRunning = await ollamaService.isOllamaRunning()
      setOllamaStatus(isRunning ? 'connected' : 'disconnected')
      setShowOllamaSetup(!isRunning)
    }
    
    checkOllama()
    
    const interval = setInterval(checkOllama, 30000)
    return () => clearInterval(interval)
  }, [])

  const enhancePrompt = async () => {
    if (!prompt.trim() || !selectedModel) return;
    const originalPrompt = prompt;
    setPrompt("Improving your prompt...");

    try {
      const enhancementResponse = await ollamaService.generate({
        model: selectedModel,
        prompt: `Please improve this prompt... Original prompt: """${originalPrompt}"""`
      });
      
      if (enhancementResponse.success && enhancementResponse.data) {
        setPrompt(enhancementResponse.data.trim());
      } else {
        setPrompt(originalPrompt);
      }
    } catch (error) {
      setPrompt(originalPrompt);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return
    
    if (chats.length === 0 || !activeChat) {
      const newChat = createNewChat({ model: selectedModel })
      setActiveChat(newChat.id)
    }
    setPrompt("")
    await sendMessage(prompt, selectedModel)
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  const { toggleSidebar } = useSidebar()
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Alerte Ollama */}
        {showOllamaSetup && ollamaStatus === 'disconnected' && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md p-4">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="space-y-2">
                  <p className="font-medium">Ollama is not running</p>
                  <p className="text-sm">To use this local AI interface, you need to install and run Ollama.</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowOllamaSetup(false)}>
                      Dismiss
                    </Button>
                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                      <Button size="sm">Get Ollama</Button>
                    </a>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Sidebar */}
        <Sidebar variant="inset">
          <ChatSidebar
            chats={chats}
            activeChat={activeChat || ""}
            onChatSelect={setActiveChat}
            onCreateChat={createNewChat}
            onDeleteChat={deleteChat}
            theme={theme}
            onThemeChange={setTheme}
          />
        </Sidebar>

        {/* Zone décalée : TopBar + MainChatArea */}
        <SidebarInset>
          <div className="flex flex-col h-full">
            <TopBar
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onToggleLeftPanel={toggleSidebar}
              sidebarIsHidden={isSidebarHidden}
              setIsSidebarHidden={setIsSidebarHidden}
            />

            <div className="flex-1 overflow-y-auto">
              <MainChatArea
                currentChat={currentChat}
                prompt={prompt}
                onPromptChange={setPrompt}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onResendMessage={handleResendMessage}
                onEnhancePrompt={enhancePrompt}
                isRecording={isRecording}
                onToggleRecording={() => setIsRecording(!isRecording)}
                uploadedFiles={uploadedFiles}
                onRemoveFile={removeFile}
                fileInputRef={fileInputRef}
                isDragOver={isDragOver}
                onDragOver={handleDragOverFile}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isGenerating={isGenerating}
                onStopGeneration={stopGeneration}
                selectedModel={selectedModel}
                ollamaStatus={ollamaStatus}
              />
            </div>
          </div>
        </SidebarInset>


        {/* Fichier upload */}
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