/**
 * TaskCard component - displays a single task with basic info
 */

import type { Task } from '@/types'
import { formatDate, isTaskOverdue, isTaskDueToday } from '@/lib/storage/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface TaskCardProps {
  task: Task
  onTaskClick?: (task: Task) => void
  onStatusChange?: (task: Task, status: 'Todo' | 'In Progress' | 'Done') => void
}

export function TaskCard({
  task,
  onTaskClick,
  onStatusChange,
}: TaskCardProps) {
  const handleStatusChange = (checked: boolean) => {
    if (onStatusChange) {
      onStatusChange(task, checked ? 'Done' : 'Todo')
    }
  }

  const isCompleted = task.status === 'Done'
  const isOverdue = isTaskOverdue(task)
  const isDueToday = isTaskDueToday(task)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-md ${
        isCompleted
          ? 'bg-gray-50 opacity-60'
          : 'bg-white hover:shadow-sm'
      }`}
      onClick={() => onTaskClick?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onTaskClick?.(task)
        }
      }}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleStatusChange}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-medium text-sm ${
              isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {task.title}
          </h3>
        </div>

        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary" className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>

          {task.dueDate && (
            <span
              className={`text-xs font-medium ${
                isOverdue
                  ? 'text-red-600 bg-red-50 px-2 py-1 rounded'
                  : isDueToday
                    ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded'
                    : 'text-gray-600'
              }`}
            >
              {formatDate(task.dueDate)}
            </span>
          )}

          {task.subtasks.length > 0 && (
            <span className="text-xs text-gray-500">
              {task.subtasks.filter((s) => s.completed).length}/{
                task.subtasks.length
              }
            </span>
          )}
        </div>
      </div>

      {task.status === 'In Progress' && (
        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      )}
    </div>
  )
}
