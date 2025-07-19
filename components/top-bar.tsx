"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react"

const models = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "Anthropic" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "Google" },
]

interface TopBarProps {
  selectedModel: string
  onModelChange: (model: string) => void
  showLeftPanel: boolean
  showRightPanel: boolean
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
}

export function TopBar({
  selectedModel,
  onModelChange,
  showLeftPanel,
  showRightPanel,
  onToggleLeftPanel,
  onToggleRightPanel,
}: TopBarProps) {
  return (
    <TooltipProvider>
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {!showLeftPanel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={onToggleLeftPanel}>
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show chat panel</TooltipContent>
                </Tooltip>
              )}
              <h1 className="text-xl font-semibold">LLM Interface</h1>
            </div>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {model.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {showLeftPanel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onToggleLeftPanel} className="gap-2 bg-transparent">
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="hidden sm:inline">Hide Chat Panel</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hide chat management panel</TooltipContent>
              </Tooltip>
            )}
            {!showRightPanel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onToggleRightPanel} className="gap-2 bg-transparent">
                    <PanelRightOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Show Statistics & Resources</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Show statistics and educational resources panel</TooltipContent>
              </Tooltip>
            )}
            {showRightPanel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onToggleRightPanel} className="gap-2 bg-transparent">
                    <PanelRightClose className="h-4 w-4" />
                    <span className="hidden sm:inline">Hide Statistics & Resources</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hide statistics and educational resources panel</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
