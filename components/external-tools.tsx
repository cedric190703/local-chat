import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "@/components/ui/tooltip"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const externalTools = [
  { id: "web-search", name: "Web Search", description: "Search the web for current information", icon: "🌐" },
  { id: "mcp", name: "MCP", description: "Model Context Protocol integration", icon: "🔗", isBeta: true },
]

interface ExternalToolsProps {
  selectedTool: string | null
  onSelect: (toolId: string) => void
}

export function ExternalTools({ selectedTool, onSelect }: ExternalToolsProps) {
  const handleToolClick = (toolId: string) => {
    if (toolId === "mcp") {
      alert("MCP is currently in beta and not implemented.")
      return
    }
    if (selectedTool === toolId) {
      // Optionally, you can pass an empty string to indicate deselection
      onSelect("");
    } else {
      onSelect(toolId);
    }
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToolClick(tool.id)}
                  className={cn(
                    "relative transition-all",
                    selectedTool === tool.id && "bg-primary/10 border-primary text-primary"
                  )}
                >
                  <span className="mr-2">{tool.icon}</span>
                  {tool.name}
                  {tool.isBeta && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Beta
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{tool.description}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}