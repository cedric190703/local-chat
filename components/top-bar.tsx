"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { PanelLeftOpen, RefreshCw, AlertCircle } from "lucide-react"
import ollamaService from "@/services/ollama-service"
import { cn } from "@/lib/utils"

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
  showLeftPanel: boolean
  onToggleLeftPanel: () => void
}

export function TopBar({
  selectedModel,
  onModelChange,
  showLeftPanel,
  onToggleLeftPanel,
}: TopBarProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOllamaRunning, setIsOllamaRunning] = useState(false)
  const [error, setError] = useState<string>("")

  const loadModels = async () => {
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
  }

  useEffect(() => {
    loadModels()
  }, [])

  const formatModelSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
  }

  const getModelDisplayName = (model: ModelInfo): string => {
    const baseName = model.name.split(':')[0]
    return baseName.charAt(0).toUpperCase() + baseName.slice(1)
  }

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-10 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {!showLeftPanel && (
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
                <TooltipContent>Show sidebar</TooltipContent>
              </Tooltip>
            )}
            
            <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Local AI Chat
            </h1>
          </div>

          {/* Center section - Model selection */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 max-w-2xl w-full">
              <Select 
                value={selectedModel} 
                onValueChange={onModelChange}
                disabled={!isOllamaRunning || isLoading}
              >
                <SelectTrigger className="w-full min-w-[240px]">
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
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Refresh button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={loadModels}
                  disabled={isLoading}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 text-primary",
                    isLoading && "animate-spin"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh models</TooltipContent>
            </Tooltip>

            {/* Status indicator */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isOllamaRunning ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium">
                {isOllamaRunning ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Error message */}
            {error && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]" side="bottom">
                  <p className="text-amber-600 dark:text-amber-400">{error}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}