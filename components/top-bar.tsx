"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { PanelLeftOpen, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import ollamaService from "@/services/ollama-service"
import { cn } from "@/lib/utils"
import useMobile from "@/hooks/use-mobile"

interface ModelInfo {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface TopBarProps {
  selectedModel: string
  onModelChange: (model: string) => void
  onToggleLeftPanel: () => void
  sidebarIsHidden: boolean
  setIsSidebarHidden: (hidden: boolean) => void
}

export function TopBar({
  selectedModel,
  onModelChange,
  onToggleLeftPanel,
  sidebarIsHidden,
  setIsSidebarHidden
}: TopBarProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOllamaRunning, setIsOllamaRunning] = useState(false)
  const [error, setError] = useState<string>("")
  const isMobile = useMobile()

  const loadModels = useCallback(async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const running = await ollamaService.isOllamaRunning()
      setIsOllamaRunning(running)
      
      if (!running) {
        setError("Ollama service is not running")
        setModels([])
        return
      }

      const response = await ollamaService.listModels()
      if (response.success && response.data) {
        setModels(response.data)
        if (!selectedModel && response.data.length > 0) {
          onModelChange(response.data[0].name)
        }
      } else {
        setError(response.error || "Failed to load models")
        setModels([])
      }
    } catch (err) {
      setError("Failed to connect to Ollama service")
      setModels([])
    } finally {
      setIsLoading(false)
    }
  }, [onModelChange, selectedModel])

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const formatModelSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
  }

  const getModelDisplayName = (model: ModelInfo): string => {
    const baseName = model.name.split(':')[0]
    return baseName.charAt(0).toUpperCase() + baseName.slice(1)
  }

  const handleButtonClick = () => {
    loadModels()
    onToggleLeftPanel()
    setIsSidebarHidden(!sidebarIsHidden)
  }

  const renderMobileActions = () => (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
        </TooltipTrigger>
        <TooltipContent>
          {isLoading ? "Refreshing models..." : sidebarIsHidden ? "Show sidebar" : "Hide sidebar"}
        </TooltipContent>
      </Tooltip>
    </div>
  )

  const renderModelSelector = () => (
    <Select 
      value={selectedModel} 
      onValueChange={onModelChange}
      disabled={!isOllamaRunning || isLoading}
    >
      <SelectTrigger className="w-full min-w-[200px] md:min-w-[240px]">
        <SelectValue placeholder={
          isLoading ? "Loading models..." : 
          !isOllamaRunning ? "Ollama not running" : 
          models.length === 0 ? "No models available" :
          "Select a model"
        } />
      </SelectTrigger>
      <SelectContent className="max-h-[60vh]">
        {models.map((model) => (
          <SelectItem key={model.name} value={model.name} className="group">
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{getModelDisplayName(model)}</span>
              {!isMobile && (
                <div className="flex items-center gap-1 ml-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {formatModelSize(model.size)}
                  </Badge>
                  {model.details?.parameter_size && (
                    <Badge variant="outline" className="text-xs">
                      {model.details.parameter_size}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderDesktopActions = () => (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
        </TooltipTrigger>
        <TooltipContent>
          {isLoading ? "Refreshing models..." : sidebarIsHidden ? "Show sidebar" : "Hide sidebar"}
        </TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-10 p-2 md:p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={onToggleLeftPanel}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <PanelLeftOpen className="h-4 w-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle sidebar</TooltipContent>
            </Tooltip>
            
            {!isMobile && (
              <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Local AI Chat
              </h1>
            )}
          </div>

          <div className="flex-1 flex justify-center px-2">
            <div className="w-full max-w-md">
              {renderModelSelector()}
            </div>
          </div>

          {isMobile ? renderMobileActions() : renderDesktopActions()}
        </div>
      </div>
    </TooltipProvider>
  )
}