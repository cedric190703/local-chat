"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { MessageSquare, Plus, X } from "lucide-react"
import type { Chat } from "@/types/chat"

interface ChatSidebarProps {
  chats: Chat[]
  activeChat: string
  onChatSelect: (chatId: string) => void
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
}

export function ChatSidebar({ chats, activeChat, onChatSelect, onCreateChat, onDeleteChat }: ChatSidebarProps) {
  return (
    <div className="w-80 border-r bg-muted/30">
      <TooltipProvider>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={onCreateChat}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create new chat</TooltipContent>
            </Tooltip>
          </div>

          <Tabs value={activeChat} onValueChange={onChatSelect}>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <TabsList className="grid w-full grid-cols-1 gap-2 h-auto bg-transparent">
                {chats.map((chat) => (
                  <div key={chat.id} className="flex items-center gap-2">
                    <TabsTrigger
                      value={chat.id}
                      className="flex-1 justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span className="truncate">{chat.title}</span>
                    </TabsTrigger>
                    {chats.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteChat(chat.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete chat</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>
      </TooltipProvider>
    </div>
  )
}
