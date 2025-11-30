/**
 * ListForm component - form for creating and editing task lists
 */

import { useState, useEffect } from 'react'
import type { TaskList } from '@/types'
import { createTaskList } from '@/lib/storage/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ListFormProps {
  list?: TaskList
  onSubmit: (list: TaskList) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
]

export function ListForm({
  list,
  onSubmit,
  onCancel,
  isLoading,
}: ListFormProps) {
  const [formData, setFormData] = useState<TaskList>(
    list || createTaskList()
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (list) {
      setFormData(list)
    }
  }, [list])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('List name is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save list')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          List Name *
        </Label>
        <Input
          id="name"
          placeholder="e.g., Work, Personal, Shopping"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          disabled={isLoading}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Color</Label>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-full h-10 rounded-lg border-2 transition-all ${
                formData.color === color
                  ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.archived}
            onChange={(e) =>
              setFormData({ ...formData, archived: e.target.checked })
            }
            disabled={isLoading}
            className="w-4 h-4 rounded border-gray-300 text-purple-600"
          />
          <span className="text-sm font-medium">Archive list</span>
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : list ? 'Update List' : 'Create List'}
        </Button>
      </div>
    </form>
  )
}
