"use client"

import { useState, useRef, useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PreferencesProvider } from "@/hooks/use-preferences"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MainChatArea } from "@/components/main-chat-area"
import { TopBar } from "@/components/top-bar"
import { useChat } from "@/hooks/use-chat"
import { useTheme } from "@/hooks/use-theme"
import { useFileUpload } from "@/hooks/use-file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ollamaService from "@/services/ollama-service"
import { Sidebar, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { enhancedChatService } from "@/services/agent-service"

export default function LLMInterface() {
  const [selectedModel, setSelectedModel] = useState("") // Selected model for the chat
  const [prompt, setPrompt] = useState("") // User input prompt
  const [isRecording, setIsRecording] = useState(false) // Flag for recording state
  const [showOllamaSetup, setShowOllamaSetup] = useState(false) // Flag to show Ollama setup alert
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking') // Ollama service status
  const fileInputRef = useRef<HTMLInputElement>(null) // Reference for file input RAG
  const [selectedTool, setSelectedTool] = useState<string | null>(null) // Selected external tool for the chat (e.g., web search)
  const { theme, setTheme } = useTheme() // Custom hook for theme management
  const [isSearching, setIsSearching] = useState(false);
  const {
    chats,
    activeChat,
    isGenerating,
    setActiveChat,
    createNewChat,
    deleteChat,
    sendMessage,
    editAndResendMessage,
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
    clearFiles,
  } = useFileUpload()

  // Edit a user message and resend using chat state
  const handleEditMessage = (id: string, newContent: string) => {
    if (!selectedModel) return
    editAndResendMessage(id, newContent, selectedModel)
  }

  // Resend with modified content
  const handleResendMessage = (id: string, newContent: string) => {
    if (!selectedModel) return
    editAndResendMessage(id, newContent, selectedModel)
  }

  // Optional: editing AI text locally is not persisted to chat history; omit for now
  const handleEditAIMessage = (_id: string, _newContent: string) => {}

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

  // Enhance prompt functionality
  // This function is called to improve the user's prompt before sending it
  /**
   * 
   * @returns void
   */
  const enhancePrompt = async () => {
    if (!prompt.trim() || !selectedModel) return
    const originalPrompt = prompt
    setPrompt("Improving your prompt...")

    try {
      const enhancementResponse = await ollamaService.generate({
        model: selectedModel,
        prompt: `Please improve this prompt... Original prompt: """${originalPrompt}"""
        Just return the improved prompt without any additional text like correct the grammar or spelling.
        Make it more concise and clear but do not make additional comments and responds in the language of the original prompt.`,
      })

      if (enhancementResponse.success && enhancementResponse.data) {
        setPrompt(enhancementResponse.data.trim())
      } else {
        setPrompt(originalPrompt)
      }
    } catch (error) {
      setPrompt(originalPrompt)
    }
  }

  // Handle sending messages
  // This function is called when the user clicks the send button
  /** * 
   * @returns void
   */
  const handleSendMessage = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return;

    setPrompt(""); // Clear the input prompt immediately
    
    // Store current files before clearing them and convert to proper format
    const currentFiles = uploadedFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : undefined
    }));
    clearFiles(); // Clear files from input bar immediately after sending
    
    try {
      if (selectedTool === "web-search") {
        setIsSearching(true); // Start search-specific indicator
        console.log(isSearching);
        
        // Enable web search mode
        enhancedChatService.setWebSearchEnabled(true);
        const response = await enhancedChatService.streamMessage(
          prompt,
          activeChat ?? 'default',
          selectedModel
        );
        await sendMessage(prompt, selectedModel, response, currentFiles);
        // Disable web search after use
        enhancedChatService.setWebSearchEnabled(false);
      } else {
        // Ensure web search is disabled
        enhancedChatService.setWebSearchEnabled(false);
        await sendMessage(prompt, selectedModel, undefined, currentFiles);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally, add error handling UI here (e.g., display an error message)
    } finally {
      // Ensure indicators are turned off regardless of success or failure
      setIsSearching(false); // Stop search-specific indicator
    }
  };

  const currentChat = chats.find(chat => chat.id === activeChat)
  const { toggleSidebar } = useSidebar()
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)

  return (
    <TooltipProvider>
      <PreferencesProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Ollama Alert */}
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

        {/* Main Area */}
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
                onEditAIMessage={handleEditAIMessage}
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
                isSearching={isSearching}
                onStopGeneration={stopGeneration}
                selectedModel={selectedModel}
                ollamaStatus={ollamaStatus}
                selectedTool={selectedTool}
                onSelectTool={setSelectedTool}
              />
              
            </div>
          </div>
        </SidebarInset>

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
      </PreferencesProvider>
    </TooltipProvider>
  )
}