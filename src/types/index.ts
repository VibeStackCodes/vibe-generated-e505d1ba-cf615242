/**
 * Core types and interfaces for TaskNexus
 * Defines all data models used throughout the application
 */

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'Low' | 'Medium' | 'High'

/**
 * Task status/workflow states
 */
export type TaskStatus = 'Todo' | 'In Progress' | 'Done'

/**
 * Recurring task intervals
 */
export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'custom'

/**
 * Tag/Label for flexible task categorization
 */
export interface Tag {
  id: string
  name: string
  color?: string // Hex color code for UI display
  createdAt: number
}

/**
 * Subtask within a task - represents a checklist item
 */
export interface Subtask {
  id: string
  title: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Reminder notification settings
 */
export interface Reminder {
  id: string
  type: 'browser' | 'push'
  minutesBefore: number
  enabled: boolean
}

/**
 * Recurring task configuration
 */
export interface Recurrence {
  interval: RecurrenceInterval
  frequency: number // How many intervals between repetitions (e.g., every 2 weeks)
  endDate?: number // Timestamp of when recurrence should stop
  daysOfWeek?: number[] // For weekly recurrence (0-6, 0 = Sunday)
  dayOfMonth?: number // For monthly recurrence
}

/**
 * Core Task model for TaskNexus
 */
export interface Task {
  id: string
  title: string // Required field
  description?: string
  dueDate?: number // Timestamp
  priority: TaskPriority
  status: TaskStatus
  listId: string // Reference to parent list/project
  tags: string[] // Array of tag IDs
  subtasks: Subtask[]
  notes?: string // Rich text notes
  attachments?: Attachment[]
  recurrence?: Recurrence
  reminder?: Reminder
  createdAt: number
  updatedAt: number
  completedAt?: number // When task was marked as Done
}

/**
 * Attachment to a task
 */
export interface Attachment {
  id: string
  name: string
  type: string // MIME type
  size: number // Bytes
  url: string // Local blob URL or cloud URL
  uploadedAt: number
}

/**
 * List/Project for organizing tasks
 */
export interface TaskList {
  id: string
  name: string
  color?: string // Hex color code
  archived: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Application settings and preferences
 */
export interface AppSettings {
  id: string // Should be 'app-settings'
  theme: 'light' | 'dark' | 'auto'
  defaultPriority: TaskPriority
  defaultNotifications: boolean
  cloudSyncEnabled: boolean
  cloudSyncUserId?: string
  lastSyncAt?: number
  updatedAt: number
}

/**
 * Export data format
 */
export interface ExportData {
  version: string
  exportedAt: number
  tasks: Task[]
  lists: TaskList[]
  tags: Tag[]
  settings: AppSettings
}

/**
 * Conflict resolution for cloud sync
 */
export interface SyncConflict {
  id: string
  type: 'task' | 'list' | 'tag'
  local: unknown
  remote: unknown
  timestamp: number
}

/**
 * Delta sync entry for cloud synchronization
 */
export interface SyncDelta {
  id: string
  type: 'task' | 'list' | 'tag' | 'delete'
  resourceId: string
  action: 'create' | 'update' | 'delete'
  data?: unknown
  timestamp: number
  synced: boolean
}
