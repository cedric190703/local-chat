"use client"

import { useState, useRef, useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { StatsSidebar } from "@/components/stats-sidebar"
import { SettingsMenu } from "@/components/settings-menu"
import { TopBar } from "@/components/top-bar"
import { useChat } from "@/hooks/use-chat"
import { useTheme } from "@/hooks/use-theme"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ollamaService from "@/services/ollama-service"

export default function LLMInterface() {
  const [selectedModel, setSelectedModel] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showOllamaSetup, setShowOllamaSetup] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Check Ollama connection on mount
  useEffect(() => {
    const checkOllama = async () => {
      setOllamaStatus('checking')
      const isRunning = await ollamaService.isOllamaRunning()
      setOllamaStatus(isRunning ? 'connected' : 'disconnected')
      setShowOllamaSetup(!isRunning)
    }
    
    checkOllama()
    
    // Check periodically
    const interval = setInterval(checkOllama, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const enhancePrompt = async () => {
    if (!prompt.trim() || !selectedModel) return;
    
    // Store the original prompt
    const originalPrompt = prompt;
    
    // Show loading state
    setPrompt("Improving your prompt...");

    try {
      // Ask the model to improve the prompt
      const enhancementResponse = await ollamaService.generate({
        model: selectedModel,
        prompt: `Please improve this prompt to make it more effective for an AI assistant.
        And do not ask question or provide options, just return the improved prompt.
        Original prompt: """${originalPrompt}"""
        
        Respond ONLY with the improved prompt, no additional commentary.`
      });
      
      if (enhancementResponse.success && enhancementResponse.data) {
        // Update the input with the improved version
        setPrompt(enhancementResponse.data.trim());
      } else {
        // Fallback to original if enhancement fails
        setPrompt(originalPrompt);
        console.error("Failed to enhance prompt:", enhancementResponse.error);
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      setPrompt(originalPrompt);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleSendMessage = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return
    
    // Create a new chat if none exists
    if (chats.length === 0 || !activeChat) {
      const newChat = createNewChat({ model: selectedModel })
      setActiveChat(newChat.id)
    }
    setPrompt("")
    await sendMessage(prompt, selectedModel)
  }

  const handleStopGeneration = () => {
    stopGeneration()
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Ollama Setup Alert */}
        {showOllamaSetup && ollamaStatus === 'disconnected' && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-96">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="space-y-2">
                  <p className="font-medium">Ollama is not running</p>
                  <p className="text-sm">To use this local AI interface, you need to:</p>
                  <ol className="text-sm list-decimal list-inside space-y-1">
                    <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
                    <li>Download a model (e.g., <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">ollama pull llama2</code>)</li>
                    <li>Start the Ollama service</li>
                  </ol>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setShowOllamaSetup(false)}>
                      Dismiss
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={async () => {
                        const isRunning = await ollamaService.isOllamaRunning()
                        setOllamaStatus(isRunning ? 'connected' : 'disconnected')
                        setShowOllamaSetup(!isRunning)
                      }}
                    >
                      Check Again
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

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
              isGenerating={isGenerating}
              onStopGeneration={handleStopGeneration}
              selectedModel={selectedModel}
              ollamaStatus={ollamaStatus}
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
                currentChat={currentChat}
                ollamaStatus={ollamaStatus}
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