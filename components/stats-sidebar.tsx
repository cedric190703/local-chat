"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart3, BookOpen, TrendingUp, Upload } from "lucide-react"

const educationalTopics = [
  { topic: "Machine Learning", frequency: 45, resources: 12 },
  { topic: "React Development", frequency: 38, resources: 8 },
  { topic: "Data Science", frequency: 32, resources: 15 },
  { topic: "API Integration", frequency: 28, resources: 6 },
  { topic: "UI/UX Design", frequency: 22, resources: 9 },
]

interface StatsSidebarProps {
  prompt: string
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}

export function StatsSidebar({ prompt, isDragOver, onDragOver, onDragLeave, onDrop, fileInputRef }: StatsSidebarProps) {
  const charCount = prompt.length
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0
  const tokenCount = Math.ceil(charCount / 4)
  const lineCount = prompt.split("\n").length

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col">
      {/* Statistics */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Prompt Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Characters:</span>
            <span>{charCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Words:</span>
            <span>{wordCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tokens (est.):</span>
            <span>{tokenCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Lines:</span>
            <span>{lineCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Educational Resources */}
      <Card className="m-4 mt-2 flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Educational Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground mb-2">Based on your frequent topics:</div>
            {educationalTopics.map((topic) => (
              <div key={topic.topic} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{topic.topic}</span>
                  <Badge variant="secondary" className="text-xs">
                    {topic.resources}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{topic.frequency} queries</span>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drop files here or{" "}
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => fileInputRef.current?.click()}>
                browse
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Images, PDFs, documents</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
