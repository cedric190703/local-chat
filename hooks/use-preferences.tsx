"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type CodeTheme = "dracula" | "github" | "vscode"
export type MarkdownFont = "sans" | "serif" | "mono"
export type MarkdownSize = "sm" | "md" | "lg"

export interface PreferencesState {
  codeTheme: CodeTheme
  markdownFont: MarkdownFont
  markdownSize: MarkdownSize
}

const defaultPreferences: PreferencesState = {
  codeTheme: "dracula",
  markdownFont: "sans",
  markdownSize: "md",
}

interface PreferencesContextValue extends PreferencesState {
  setCodeTheme: (theme: CodeTheme) => void
  setMarkdownFont: (font: MarkdownFont) => void
  setMarkdownSize: (size: MarkdownSize) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreferencesState>(defaultPreferences)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("preferences")
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PreferencesState>
        setState(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("preferences", JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  const value = useMemo(() => ({
    ...state,
    setCodeTheme: (codeTheme: CodeTheme) => setState(prev => ({ ...prev, codeTheme })),
    setMarkdownFont: (markdownFont: MarkdownFont) => setState(prev => ({ ...prev, markdownFont })),
    setMarkdownSize: (markdownSize: MarkdownSize) => setState(prev => ({ ...prev, markdownSize })),
  }), [state]) as PreferencesContextValue

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  )
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider")
  }
  return ctx
}
