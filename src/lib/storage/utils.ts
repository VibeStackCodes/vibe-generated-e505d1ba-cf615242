/**
 * Storage utility functions for TaskNexus
 */

import type { Task, TaskList, Tag, AppSettings } from '@/types'

/**
 * Generate a unique ID using crypto.randomUUID
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Create a new task with default values
 */
export function createTask(overrides?: Partial<Task>): Task {
  const now = Date.now()
  return {
    id: generateId(),
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
    listId: '',
    tags: [],
    subtasks: [],
    notes: '',
    attachments: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Create a new task list with default values
 */
export function createTaskList(overrides?: Partial<TaskList>): TaskList {
  const now = Date.now()
  return {
    id: generateId(),
    name: '',
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Create a new tag with default values
 */
export function createTag(overrides?: Partial<Tag>): Tag {
  const now = Date.now()
  return {
    id: generateId(),
    name: '',
    createdAt: now,
    ...overrides,
  }
}

/**
 * Create default app settings
 */
export function createDefaultSettings(): AppSettings {
  const now = Date.now()
  return {
    id: 'app-settings',
    theme: 'auto',
    defaultPriority: 'Medium',
    defaultNotifications: true,
    cloudSyncEnabled: false,
    updatedAt: now,
  }
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(timestamp: number | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'Done') return false
  return task.dueDate < Date.now()
}

/**
 * Check if a task is due soon (within 24 hours)
 */
export function isTaskDueSoon(task: Task): boolean {
  if (!task.dueDate || task.status === 'Done') return false
  const oneDayMs = 24 * 60 * 60 * 1000
  return task.dueDate <= Date.now() + oneDayMs && task.dueDate > Date.now()
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate) return false
  const today = new Date()
  const dueDate = new Date(task.dueDate)
  return (
    today.getFullYear() === dueDate.getFullYear() &&
    today.getMonth() === dueDate.getMonth() &&
    today.getDate() === dueDate.getDate()
  )
}

/**
 * Calculate task completion percentage
 */
export function getTaskCompletionPercentage(task: Task): number {
  if (task.subtasks.length === 0) return task.status === 'Done' ? 100 : 0
  const completed = task.subtasks.filter((st) => st.completed).length
  return Math.round((completed / task.subtasks.length) * 100)
}

/**
 * Sort tasks by various criteria
 */
export function sortTasks(
  tasks: Task[],
  sortBy: 'dueDate' | 'priority' | 'createdAt' = 'dueDate'
): Task[] {
  const priorityOrder: Record<string, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  }

  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate': {
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate - b.dueDate
      }
      case 'priority': {
        return (
          priorityOrder[a.priority] - priorityOrder[b.priority] ||
          (a.dueDate || Number.MAX_VALUE) - (b.dueDate || Number.MAX_VALUE)
        )
      }
      case 'createdAt': {
        return b.createdAt - a.createdAt
      }
      default:
        return 0
    }
  })
}

/**
 * Filter tasks by criteria
 */
export function filterTasks(
  tasks: Task[],
  filters: {
    status?: string
    priority?: string
    listId?: string
    tagId?: string
    searchQuery?: string
  }
): Task[] {
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.listId && task.listId !== filters.listId) return false
    if (filters.tagId && !task.tags.includes(filters.tagId)) return false
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query)
      )
    }
    return true
  })
}

/**
 * Export tasks to JSON
 */
export function exportToJSON(data: {
  tasks: Task[]
  lists: TaskList[]
  tags: Tag[]
  settings: AppSettings | null
}): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      ...data,
    },
    null,
    2
  )
}

/**
 * Export tasks to CSV
 */
export function exportToCSV(tasks: Task[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'List ID',
    'Tags',
    'Created At',
    'Updated At',
  ]

  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    task.status,
    task.priority,
    formatDate(task.dueDate),
    task.listId,
    task.tags.join(';'),
    new Date(task.createdAt).toISOString(),
    new Date(task.updatedAt).toISOString(),
  ])

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
}

/**
 * Calculate statistics for tasks
 */
export function calculateTaskStats(tasks: Task[]) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Done').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    todo: tasks.filter((t) => t.status === 'Todo').length,
    overdue: tasks.filter(isTaskOverdue).length,
    dueSoon: tasks.filter(isTaskDueSoon).length,
    byPriority: {
      high: tasks.filter((t) => t.priority === 'High').length,
      medium: tasks.filter((t) => t.priority === 'Medium').length,
      low: tasks.filter((t) => t.priority === 'Low').length,
    },
  }
}
