/**
 * TaskForm component - form for creating and editing tasks
 */

import { useState, useEffect } from 'react'
import type { Task, TaskList } from '@/types'
import { createTask } from '@/lib/storage/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface TaskFormProps {
  task?: Task
  lists: TaskList[]
  onSubmit: (task: Task) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TaskForm({
  task,
  lists,
  onSubmit,
  onCancel,
  isLoading,
}: TaskFormProps) {
  const [formData, setFormData] = useState<Task>(
    task || createTask()
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (task) {
      setFormData(task)
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Task title is required')
      return
    }

    if (!formData.listId) {
      setError('Please select a list')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
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
        <Label htmlFor="title" className="text-sm font-medium">
          Title *
        </Label>
        <Input
          id="title"
          placeholder="Task title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Task description"
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="list" className="text-sm font-medium">
            List *
          </Label>
          <Select
            value={formData.listId}
            onValueChange={(value) =>
              setFormData({ ...formData, listId: value })
            }
          >
            <SelectTrigger id="list" disabled={isLoading}>
              <SelectValue placeholder="Select list" />
            </SelectTrigger>
            <SelectContent>
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-medium">
            Priority
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) =>
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger id="priority" disabled={isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-medium">
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            value={
              formData.dueDate
                ? new Date(formData.dueDate).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                dueDate: e.target.value
                  ? new Date(e.target.value).getTime()
                  : undefined,
              })
            }
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger id="status" disabled={isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todo">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Additional notes"
          value={formData.notes || ''}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          disabled={isLoading}
          rows={2}
        />
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
          {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
