/**
 * @file This file contains the theme hook for the local chat application.
 * It manages the theme of the application.
 */

"use client"

import { useState, useEffect } from "react"

type Theme = "light" | "dark" | "system"

/**
 * A custom hook for managing the theme of the application.
 * @returns The theme state and a function for setting the theme.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return { theme, setTheme }
}