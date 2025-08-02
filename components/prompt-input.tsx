import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
} from "lucide-react";
import type { UploadedFile } from "@/types/chat";
import { motion, AnimatePresence } from "framer-motion";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSendMessage: () => void;
  onEnhancePrompt: () => void;
  isRecording: boolean;
  onToggleRecording: () => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  selectedModel?: string;
  ollamaStatus?: 'checking' | 'connected' | 'disconnected';
  disabled?: boolean;
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

  // Auto-resize textarea and maintain focus
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Save current cursor position
    const cursorPosition = textarea.selectionStart;

    // Adjust height
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    // Restore cursor position if content changed programmatically
    if (textarea.selectionStart !== cursorPosition) {
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [prompt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isGenerating && !isEnhancing && prompt.trim()) {
        onSendMessage();
      }
    }
  }, [disabled, isGenerating, isEnhancing, onSendMessage, prompt]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || !selectedModel || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      await onEnhancePrompt();
    } finally {
      setIsEnhancing(false);
      // Restore focus to textarea after enhancement
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [prompt, selectedModel, isEnhancing, onEnhancePrompt]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

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
              className="flex items-center gap-2 py-1 px-2 rounded-full"
            >
              <span className="text-xs truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                className="h-4 w-4 p-0 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => onRemoveFile(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {ollamaStatus === 'disconnected' && (
        <div className="flex items-center gap-2 text-amber-600 text-sm px-2 py-1.5 bg-amber-50 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Ollama is not running. Please start Ollama to use the chat.</span>
        </div>
      )}

      {ollamaStatus === 'connected' && !selectedModel && (
        <div className="flex items-center gap-2 text-amber-600 text-sm px-2 py-1.5 bg-amber-50 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Please select a model to start chatting.</span>
        </div>
      )}

      {/* Main Input Area */}
      <div
        className={`relative rounded-xl border transition-all duration-200 bg-background ${
          isDragOver
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : isFocused
            ? 'border-primary shadow-lg'
            : 'border-border'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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
              className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 rounded-xl backdrop-blur-sm"
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
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={
            disabled 
              ? ollamaStatus === 'disconnected' 
                ? "Ollama is not running..."
                : "Select a model to start..."
              : "Type your message... (Enter to send, Shift+Enter for new line)"
          }
          className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-32 bg-transparent"
          disabled={isInputDisabled}
          aria-label="Chat message input"
        />

        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {/* Recording Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isRecording ? "default" : "ghost"}
                className="h-8 w-8 p-0 rounded-lg"
                onClick={onToggleRecording}
                disabled={isInputDisabled}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {isRecording ? 'Stop recording' : 'Start voice recording'}
            </TooltipContent>
          </Tooltip>

          {/* Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg"
                onClick={handleUploadClick}
                disabled={isInputDisabled}
                aria-label="Upload files"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Upload files</TooltipContent>
          </Tooltip>

          {/* Enhance Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={isEnhancing ? "default" : "ghost"}
                className="h-8 w-8 p-0 rounded-lg"
                onClick={handleEnhancePrompt}
                disabled={isInputDisabled || !prompt.trim() || isEnhancing}
                aria-label="Enhance prompt"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
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
                  className="h-8 w-8 p-0 rounded-lg"
                  onClick={onStopGeneration}
                  aria-label="Stop generation"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Stop generation</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${
                    canSend ? 'bg-primary hover:bg-primary/90' : 'bg-muted'
                  }`}
                  onClick={onSendMessage}
                  disabled={!canSend}
                  aria-label="Send message"
                >
                  {ollamaStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3 flex-wrap">
          {selectedModel && (
            <span className="bg-muted px-2 py-1 rounded-md">Model: {selectedModel}</span>
          )}
          {ollamaStatus === 'connected' && (
            <span className="text-green-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </span>
          )}
          {ollamaStatus === 'disconnected' && (
            <span className="text-red-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Disconnected
            </span>
          )}
          {ollamaStatus === 'checking' && (
            <span className="text-amber-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Checking...
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isGenerating && (
            <span className="text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </span>
          )}
          {isEnhancing && (
            <span className="text-purple-600 flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
              <Sparkles className="h-3 w-3" />
              Enhancing...
            </span>
          )}
          <span className="bg-muted px-2 py-1 rounded-md">{prompt.length} characters</span>
        </div>
      </div>
    </div>
  );
}