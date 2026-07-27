import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'mediaforge.theme'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'dark'
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f2f1ea' : '#0a0b09')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* modo privado */
    }
  }, [theme])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')) }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme tem de ser usado dentro de <ThemeProvider>')
  return context
}
