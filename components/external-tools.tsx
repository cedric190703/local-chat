"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Zap } from "lucide-react"

const externalTools = [
  { id: "web-search", name: "Web Search", description: "Search the web for current information", icon: "🌐" },
  { id: "mcp", name: "MCP", description: "Model Context Protocol integration", icon: "🔗", isBeta: true },
]

export function ExternalTools() {
  const handleToolClick = (toolId: string) => {
    if (toolId === "mcp") {
      alert("MCP (Model Context Protocol) is currently in beta and not yet implemented.")
      return
    }
    console.log(`Tool clicked: ${toolId}`)
  }

  return (
    <TooltipProvider>
      <div className="mt-4 p-2 md:p-0">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          External Tools
        </h3>
        <div className="flex flex-wrap gap-2">
          {externalTools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => handleToolClick(tool.id)} className="relative">
                  <span className="mr-2">{tool.icon}</span>
                  {tool.name}
                  {tool.isBeta && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Beta
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {tool.description}
                {tool.isBeta && " (Not yet implemented)"}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
