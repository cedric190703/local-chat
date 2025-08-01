"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { MessageSquare, X, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import type { Chat } from "@/types/chat"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  chats: Chat[]
  activeChat: string
  onChatSelect: (chatId: string) => void
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
  isCollapsed: boolean
  onToggle: () => void
}

export function ChatSidebar({ 
  chats, 
  activeChat, 
  onChatSelect, 
  onCreateChat, 
  onDeleteChat,
  isCollapsed,
  onToggle 
}: ChatSidebarProps) {
  return (
    <>
      {/* Sidebar container */}
      <div className={cn(
        "relative h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-0" : "w-72"
      )}>
        {/* Inner content */}
        <div className={cn(
          "h-full flex flex-col bg-background/95 backdrop-blur-sm",
          "border-r border-foreground/10 shadow-lg",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "translate-x-[-100%]" : "translate-x-0"
        )}>
          <TooltipProvider>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-foreground/10">
              <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Conversations
                </span>
              </h2>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={onToggle}
                    className="h-8 w-8 hover:bg-foreground/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>

            {/* New conversation button */}
            <div className="px-4 pt-3 pb-2">
              <Button 
                onClick={onCreateChat}
                className="w-full gap-2 transition-all hover:shadow-md"
                variant="default"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </Button>
            </div>

            {/* Chat tabs */}
            <Tabs value={activeChat} onValueChange={onChatSelect} className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-3 py-2">
                <TabsList className="grid w-full grid-cols-1 gap-1 bg-transparent">
                  {chats.map((chat) => (
                    <div key={chat.id} className="flex items-center gap-1 group">
                      <TabsTrigger
                        value={chat.id}
                        className={cn(
                          "flex-1 justify-start px-3 py-2 rounded-md",
                          "data-[state=active]:bg-primary/10 data-[state=active]:text-foreground",
                          "hover:bg-foreground/5 transition-colors",
                          "border border-transparent data-[state=active]:border-primary/20"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                        <span className="truncate">{chat.title}</span>
                      </TabsTrigger>
                      {chats.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteChat(chat.id)
                              }}
                              className={cn(
                                "h-8 w-8 p-0 text-foreground/40 hover:text-foreground",
                                "opacity-0 group-hover:opacity-100 transition-opacity",
                                "hover:bg-destructive/10 hover:text-destructive"
                              )}
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
          </TooltipProvider>
        </div>

        {/* Collapsed state toggle */}
        {isCollapsed && (
          <Button 
            onClick={onToggle}
            className={cn(
              "absolute top-4 left-0 h-10 w-6 p-0 rounded-r-lg",
              "bg-background border border-l-0 border-foreground/10",
              "hover:bg-primary/10 hover:text-primary",
              "transition-all duration-300 ease-in-out",
              "shadow-sm hover:shadow-md"
            )}
            variant="ghost"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  )
}