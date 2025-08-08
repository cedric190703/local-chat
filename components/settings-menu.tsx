"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Settings, Sun, Moon, Monitor } from "lucide-react"
import useMobile from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { usePreferences, type CodeTheme, type MarkdownFont, type MarkdownSize, type MarkdownTheme, type MarkdownStyle } from "@/hooks/use-preferences"

type Theme = "light" | "dark" | "system"

interface SettingsMenuProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function SettingsMenu({ theme, onThemeChange }: SettingsMenuProps) {
  const isMobile = useMobile()
  const { codeTheme, markdownFont, markdownSize, markdownTheme, markdownStyle, setCodeTheme, setMarkdownFont, setMarkdownSize, setMarkdownTheme, setMarkdownStyle } = usePreferences()

  return (
    <div className={cn(
      "",
      isMobile ? "" : ""
    )}>
      <TooltipProvider>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full h-10 w-10 p-0 bg-transparent">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Settings and preferences</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align={isMobile ? "end" : "start"} className="w-64">
            <div className="px-2 py-1.5 text-sm font-medium">Theme</div>
            <DropdownMenuItem onClick={() => onThemeChange("light")} className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Light
              {theme === "light" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange("dark")} className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Dark
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange("system")} className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              System
              {theme === "system" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>

            <div className="px-2 pt-3 pb-1.5 text-sm font-medium">Code theme</div>
            {(["dracula", "github", "vscode"] as CodeTheme[]).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setCodeTheme(t)} className="capitalize">
                {t}
                {codeTheme === t && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}

            <div className="px-2 pt-3 pb-1.5 text-sm font-medium">Markdown font</div>
            {(["sans", "serif", "mono"] as MarkdownFont[]).map((f) => (
              <DropdownMenuItem key={f} onClick={() => setMarkdownFont(f)} className="capitalize">
                {f}
                {markdownFont === f && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}

            <div className="px-2 pt-3 pb-1.5 text-sm font-medium">Markdown size</div>
            {(["sm", "md", "lg"] as MarkdownSize[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setMarkdownSize(s)} className="uppercase">
                {s}
                {markdownSize === s && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
            
            <div className="px-2 pt-3 pb-1.5 text-sm font-medium">Markdown style</div>
            {(["default", "compact", "spacious"] as MarkdownStyle[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setMarkdownStyle(s)} className="capitalize">
                {s}
                {markdownStyle === s && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  )
}
