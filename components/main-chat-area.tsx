import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessages } from "@/components/chat-messages"
import { PromptInput } from "@/components/prompt-input"
import { ExternalTools } from "@/components/external-tools"
import type { Chat, UploadedFile } from "@/types/chat"

interface MainChatAreaProps {
  currentChat?: Chat
  prompt: string
  onPromptChange: (prompt: string) => void
  onSendMessage: () => void
  onEnhancePrompt: () => void
  isRecording: boolean
  onToggleRecording: () => void
  uploadedFiles: UploadedFile[]
  onRemoveFile: (fileId: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export function MainChatArea({
  currentChat,
  prompt,
  onPromptChange,
  onSendMessage,
  onEnhancePrompt,
  isRecording,
  onToggleRecording,
  uploadedFiles,
  onRemoveFile,
  fileInputRef,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: MainChatAreaProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 overflow-hidden">
        <ChatMessages messages={currentChat?.messages || []} />
      </ScrollArea>

      {/* Prompt Input Section */}
      <div className="p-6 border-t">
        <PromptInput
          prompt={prompt}
          onPromptChange={onPromptChange}
          onSendMessage={onSendMessage}
          onEnhancePrompt={onEnhancePrompt}
          isRecording={isRecording}
          onToggleRecording={onToggleRecording}
          uploadedFiles={uploadedFiles}
          onRemoveFile={onRemoveFile}
          fileInputRef={fileInputRef}
          isDragOver={isDragOver}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />

        <ExternalTools />
      </div>
    </div>
  )
}
