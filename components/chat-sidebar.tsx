"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { MessageSquare, X, Plus } from "lucide-react"
import type { Chat } from "@/types/chat"
import { cn } from "@/lib/utils"
import { Sidebar, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { SettingsMenu } from "@/components/settings-menu"
import { useTheme } from "@/hooks/use-theme"

interface ChatSidebarProps {
  chats: Chat[]
  activeChat: string
  onChatSelect: (chatId: string) => void
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export function ChatSidebar({ 
  chats,
  activeChat,
  onChatSelect,
  onCreateChat,
  onDeleteChat,
  theme,
  onThemeChange,
}: ChatSidebarProps) {
  const { isMobile } = useSidebar()

  return (
    <Sidebar>
      <TooltipProvider>
        <div className="flex items-center justify-between p-4 border-b border-foreground/10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Conversations
            </span>
          </h2>
          <SidebarTrigger />
        </div>

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
        <div className="mt-auto p-4 border-t border-foreground/10">
          <SettingsMenu theme={theme} onThemeChange={onThemeChange} />
        </div>
      </TooltipProvider>
    </Sidebar>
  )
}