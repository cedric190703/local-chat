"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type MarkdownFont = "sans" | "serif" | "mono"
export type MarkdownSize = "sm" | "md" | "lg"
export type MarkdownTheme = "light" | "dark" | "auto"
export type MarkdownStyle = "default" | "compact" | "spacious"

export interface PreferencesState {
  markdownFont: MarkdownFont
  markdownSize: MarkdownSize
  markdownTheme: MarkdownTheme
  markdownStyle: MarkdownStyle
}

const defaultPreferences: PreferencesState = {
  markdownFont: "sans",
  markdownSize: "md",
  markdownTheme: "auto",
  markdownStyle: "default",
}

interface PreferencesContextValue extends PreferencesState {
  setMarkdownFont: (font: MarkdownFont) => void
  setMarkdownSize: (size: MarkdownSize) => void
  setMarkdownTheme: (theme: MarkdownTheme) => void
  setMarkdownStyle: (style: MarkdownStyle) => void
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
    setMarkdownFont: (markdownFont: MarkdownFont) => setState(prev => ({ ...prev, markdownFont })),
    setMarkdownSize: (markdownSize: MarkdownSize) => setState(prev => ({ ...prev, markdownSize })),
    setMarkdownTheme: (markdownTheme: MarkdownTheme) => setState(prev => ({ ...prev, markdownTheme })),
    setMarkdownStyle: (markdownStyle: MarkdownStyle) => setState(prev => ({ ...prev, markdownStyle })),
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
