import { useCallback, useState, useEffect } from 'react'
import type { Theme } from '@/components/theme-provider'
import {
  ThemeToggleButton,
  useThemeTransition,
} from '@/components/ui/shadcn-io/theme-toggle-button'
import { useTheme } from '@/components/theme-provider'

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  const { startTransition } = useThemeTransition()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const handleThemeToggle = useCallback(() => {
    const newMode: Theme = theme === 'dark' ? 'light' : 'dark'

    startTransition(() => {
      setTheme(newMode)
    })
  }, [setTheme, startTransition, theme])
  const currentTheme = theme === 'system' ? 'light' : theme
  if (!mounted) {
    return null
  }
  return (
    <ThemeToggleButton
      theme={currentTheme}
      onClick={handleThemeToggle}
      variant="circle-blur"
      start="top-right"
    />
  )
}
export default ThemeToggle
