import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Send, 
  Square, 
  Mic, 
  MicOff, 
  Sparkles, 
  Upload, 
  X, 
  AlertCircle,
  Loader2
} from "lucide-react"
import type { UploadedFile } from "@/types/chat"
import { motion, AnimatePresence } from "framer-motion";

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
  isGenerating?: boolean
  onStopGeneration?: () => void
  selectedModel?: string
  ollamaStatus?: 'checking' | 'connected' | 'disconnected'
  disabled?: boolean
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
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isGenerating = false,
  onStopGeneration,
  selectedModel,
  ollamaStatus = 'checking',
  disabled = false
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isGenerating && !isEnhancing && prompt.trim()) {
        onSendMessage();
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || !selectedModel || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      await onEnhancePrompt();
    } finally {
      setIsEnhancing(false);
    }
  };

  const canSend = !disabled && !isGenerating && !isEnhancing && prompt.trim() && selectedModel;
  const showStopButton = isGenerating && onStopGeneration;
  const isInputDisabled = disabled || isEnhancing;

  return (
    <div className="space-y-4">
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((file) => (
            <Badge
              key={file.id}
              variant="secondary"
              className="flex items-center gap-2 py-1 px-2"
            >
              <span className="text-xs truncate max-w-32">{file.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemoveFile(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {ollamaStatus === 'disconnected' && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Ollama is not running. Please start Ollama to use the chat.</span>
        </div>
      )}

      {ollamaStatus === 'connected' && !selectedModel && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Please select a model to start chatting.</span>
        </div>
      )}

      {/* Main Input Area */}
      <div
        className={`relative rounded-xl border transition-all duration-200 ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : isFocused
            ? 'border-primary shadow-lg'
            : 'border-border'
        } ${disabled ? 'opacity-60' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AnimatePresence>
          {isEnhancing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="text-sm font-medium">Enhancing your prompt...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            disabled 
              ? ollamaStatus === 'disconnected' 
                ? "Ollama is not running..."
                : "Select a model to start..."
              : "Type your message... (Enter to send, Shift+Enter for new line)"
          }
          className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-32"
          disabled={isInputDisabled}
        />

        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {/* Recording Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isRecording ? "default" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={onToggleRecording}
                disabled={isInputDisabled}
              >
                {isRecording ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRecording ? 'Stop recording' : 'Start voice recording'}
            </TooltipContent>
          </Tooltip>

          {/* Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleUploadClick}
                disabled={isInputDisabled}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload files</TooltipContent>
          </Tooltip>

          {/* Enhance Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isEnhancing ? "default" : "ghost"}
                className="h-8 w-8 p-0"
                onClick={handleEnhancePrompt}
                disabled={isInputDisabled || !prompt.trim() || isEnhancing}
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isEnhancing ? 'Enhancing...' : 'Enhance prompt'}
            </TooltipContent>
          </Tooltip>

          {/* Send/Stop Button */}
          {showStopButton ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  onClick={onStopGeneration}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop generation</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onSendMessage}
                  disabled={!canSend}
                >
                  {ollamaStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!canSend
                  ? disabled
                    ? 'Not available'
                    : !prompt.trim()
                    ? 'Type a message'
                    : !selectedModel
                    ? 'Select a model'
                    : 'Send message'
                  : 'Send message (Enter)'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {selectedModel && (
            <span>Model: {selectedModel}</span>
          )}
          {ollamaStatus === 'connected' && (
            <span className="text-green-600">● Connected</span>
          )}
          {ollamaStatus === 'disconnected' && (
            <span className="text-red-600">● Disconnected</span>
          )}
          {ollamaStatus === 'checking' && (
            <span className="text-amber-600">● Checking...</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isGenerating && (
            <span className="text-blue-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </span>
          )}
          {isEnhancing && (
            <span className="text-purple-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Enhancing...
            </span>
          )}
          <span>{prompt.length} characters</span>
        </div>
      </div>
    </div>
  );
}