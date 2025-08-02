import type React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "@/components/chat-messages";
import { PromptInput } from "@/components/prompt-input";
import { ExternalTools } from "@/components/external-tools";
import type { Chat, UploadedFile } from "@/types/chat";
import useMobile from "@/hooks/use-mobile";

interface MainChatAreaProps {
  currentChat?: Chat;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSendMessage: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onResendMessage: (messageId: string) => void;
  onEditAIMessage: (messageId: string, newContent: string) => void;
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
}

export function MainChatArea({
  currentChat,
  prompt,
  onPromptChange,
  onSendMessage,
  onEditMessage,
  onResendMessage,
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
  ollamaStatus = 'checking'
}: MainChatAreaProps) {
  const isMobile = useMobile();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-background">
        <ScrollArea className="h-full">
          <div className="p-2 md:p-4">
            <ChatMessages
              messages={currentChat?.messages || []}
              onEditMessage={onEditMessage}
              onResendMessage={onResendMessage}
              onEditAIMessage={onEditAIMessage}
            />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background">
        <div className="p-2 md:p-6">
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
            isGenerating={isGenerating}
            onStopGeneration={onStopGeneration}
            selectedModel={selectedModel}
            ollamaStatus={ollamaStatus}
            disabled={ollamaStatus !== 'connected' || !selectedModel}
          />
        </div>

        <div className="px-6 pb-4">
          <ExternalTools />
        </div>
      </div>
    </div>
  );
}