/**
 * Keyboard Shortcuts Help component
 */

export function KeyboardShortcutsHelp() {
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = [
    {
      key: `${modKey} + N`,
      action: 'Create new task',
    },
    {
      key: `${modKey} + K`,
      action: 'Focus search',
    },
    {
      key: `${modKey} + E`,
      action: 'Export data',
    },
    {
      key: 'Esc',
      action: 'Close modals',
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{shortcut.action}</span>
            <kbd className="px-2 py-1 rounded bg-gray-100 text-gray-900 font-mono text-xs border border-gray-300">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
