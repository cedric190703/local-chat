"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { FileText, ImageIcon, Sparkles, Paperclip, Mic, MicOff, Send, X } from "lucide-react"
import type { UploadedFile } from "@/types/chat"

interface PromptInputProps {
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

export function PromptInput({
  prompt,
  onPromptChange,
  onSendMessage,
  onEnhancePrompt,
  isRecording,
  onToggleRecording,
  uploadedFiles,
  onRemoveFile,
  fileInputRef,
}: PromptInputProps) {
  return (
    <TooltipProvider>
      <>
        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="text-sm truncate max-w-32">{file.name}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => onRemoveFile(file.id)} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove file</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="relative">
          <div className="flex gap-2 mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={onEnhancePrompt} disabled={!prompt.trim()}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enhance Prompt
                </Button>
              </TooltipTrigger>
              <TooltipContent>Enhance your prompt with additional context and structure</TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter your prompt here..."
            className="min-h-32 pr-32 resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                onSendMessage()
              }
            }}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant={isRecording ? "destructive" : "ghost"} onClick={onToggleRecording}>
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRecording ? "Stop recording" : "Start voice input"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={onSendMessage} disabled={!prompt.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </>
    </TooltipProvider>
  )
}
