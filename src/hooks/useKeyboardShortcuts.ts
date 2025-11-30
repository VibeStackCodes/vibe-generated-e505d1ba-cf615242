/**
 * Custom hook for keyboard shortcuts
 */

import { useEffect } from 'react'

export interface KeyboardShortcuts {
  'cmd+n': () => void // Create new task (Cmd+N on Mac, Ctrl+N on Windows)
  'cmd+k': () => void // Focus search (Cmd+K on Mac, Ctrl+K on Windows)
  'cmd+e': () => void // Export data (Cmd+E on Mac, Ctrl+E on Windows)
  escape: () => void // Close modals
}

export function useKeyboardShortcuts(shortcuts: Partial<KeyboardShortcuts>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + N: New task
      if (modKey && e.key === 'n') {
        e.preventDefault()
        shortcuts['cmd+n']?.()
      }

      // Cmd/Ctrl + K: Focus search
      if (modKey && e.key === 'k') {
        e.preventDefault()
        shortcuts['cmd+k']?.()
      }

      // Cmd/Ctrl + E: Export
      if (modKey && e.key === 'e') {
        e.preventDefault()
        shortcuts['cmd+e']?.()
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        shortcuts.escape?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
