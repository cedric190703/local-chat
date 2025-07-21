"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RefreshCw, AlertCircle } from "lucide-react"
import ollamaService from "@/services/ollama-service"

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
  const [models, setModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOllamaRunning, setIsOllamaRunning] = useState(false)
  const [error, setError] = useState<string>("")

  const loadModels = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      // Check if Ollama is running
      const running = await ollamaService.isOllamaRunning()
      setIsOllamaRunning(running)
      
      if (!running) {
        setError("Ollama service is not running. Please start Ollama.")
        setModels([])
        return
      }

      // Get available models
      const response = await ollamaService.listModels()
      if (response.success && response.data) {
        setModels(response.data)
        
        // If no model is selected and models are available, select the first one
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
    // Extract clean model name (remove tags like :latest)
    const baseName = model.name.split(':')[0]
    return baseName.charAt(0).toUpperCase() + baseName.slice(1)
  }

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
              <h1 className="text-xl font-semibold">Local AI Chat</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                value={selectedModel} 
                onValueChange={onModelChange}
                disabled={!isOllamaRunning || isLoading}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={
                    isLoading ? "Loading models..." : 
                    !isOllamaRunning ? "Ollama not running" : 
                    models.length === 0 ? "No models available" :
                    "Select a model"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{getModelDisplayName(model)}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="secondary" className="text-xs">
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
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={loadModels}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh models</TooltipContent>
              </Tooltip>
              
              {/* Status indicator */}
              <div className="flex items-center gap-1">
                {isOllamaRunning ? (
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                ) : (
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                )}
                <span className="text-xs text-muted-foreground">
                  {isOllamaRunning ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
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