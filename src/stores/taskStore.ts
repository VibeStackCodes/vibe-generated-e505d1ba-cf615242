/**
 * Zustand store for task state management
 * Manages all application state including tasks, lists, tags, and filters
 */

import { create } from 'zustand'
import type { Task, TaskList, Tag, AppSettings } from '@/types'
import {
  taskDB,
  listDB,
  tagDB,
  settingsDB,
  exportAllData,
} from '@/lib/storage/db'
import {
  createTask,
  createTaskList,
  createTag,
  createDefaultSettings,
  sortTasks,
  filterTasks,
} from '@/lib/storage/utils'

interface TaskStore {
  // Data
  tasks: Task[]
  lists: TaskList[]
  tags: Tag[]
  settings: AppSettings | null

  // UI State
  selectedListId: string | null
  activeFilters: {
    status?: string
    priority?: string
    tagId?: string
    searchQuery?: string
  }
  sortBy: 'dueDate' | 'priority' | 'createdAt'
  isLoading: boolean
  error: string | null

  // Actions - Tasks
  addTask: (task: Partial<Task>) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  loadTasks: () => Promise<void>

  // Actions - Lists
  addList: (list: Partial<TaskList>) => Promise<void>
  updateList: (list: TaskList) => Promise<void>
  deleteList: (listId: string) => Promise<void>
  loadLists: () => Promise<void>

  // Actions - Tags
  addTag: (tag: Partial<Tag>) => Promise<void>
  updateTag: (tag: Tag) => Promise<void>
  deleteTag: (tagId: string) => Promise<void>
  loadTags: () => Promise<void>

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  loadSettings: () => Promise<void>

  // Actions - UI
  setSelectedListId: (listId: string | null) => void
  setActiveFilters: (
    filters: Partial<{
      status?: string
      priority?: string
      tagId?: string
      searchQuery?: string
    }>
  ) => void
  setSortBy: (sortBy: 'dueDate' | 'priority' | 'createdAt') => void
  clearFilters: () => void

  // Actions - Data
  loadAllData: () => Promise<void>
  exportData: () => Promise<string>

  // Selectors
  getFilteredTasks: () => Task[]
  getTasksByList: (listId: string) => Task[]
  getListById: (listId: string) => TaskList | undefined
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  lists: [],
  tags: [],
  settings: null,
  selectedListId: null,
  activeFilters: {},
  sortBy: 'dueDate',
  isLoading: false,
  error: null,

  // Task actions
  addTask: async (taskData: Partial<Task>) => {
    try {
      set({ error: null })
      const newTask = createTask(taskData)
      await taskDB.create(newTask)
      set((state) => ({
        tasks: [...state.tasks, newTask],
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add task',
      })
      throw error
    }
  },

  updateTask: async (task: Task) => {
    try {
      set({ error: null })
      const updatedTask = {
        ...task,
        updatedAt: Date.now(),
      }
      await taskDB.update(updatedTask)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? updatedTask : t)),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update task',
      })
      throw error
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      set({ error: null })
      await taskDB.delete(taskId)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete task',
      })
      throw error
    }
  },

  loadTasks: async () => {
    try {
      set({ error: null, isLoading: true })
      const tasks = await taskDB.getAll()
      set({ tasks, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load tasks',
        isLoading: false,
      })
    }
  },

  // List actions
  addList: async (listData: Partial<TaskList>) => {
    try {
      set({ error: null })
      const newList = createTaskList(listData)
      await listDB.create(newList)
      set((state) => ({
        lists: [...state.lists, newList],
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add list',
      })
      throw error
    }
  },

  updateList: async (list: TaskList) => {
    try {
      set({ error: null })
      const updatedList = {
        ...list,
        updatedAt: Date.now(),
      }
      await listDB.update(updatedList)
      set((state) => ({
        lists: state.lists.map((l) => (l.id === list.id ? updatedList : l)),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update list',
      })
      throw error
    }
  },

  deleteList: async (listId: string) => {
    try {
      set({ error: null })
      await listDB.delete(listId)
      set((state) => ({
        lists: state.lists.filter((l) => l.id !== listId),
        selectedListId:
          state.selectedListId === listId ? null : state.selectedListId,
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete list',
      })
      throw error
    }
  },

  loadLists: async () => {
    try {
      set({ error: null, isLoading: true })
      const lists = await listDB.getAll()
      set({ lists, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load lists',
        isLoading: false,
      })
    }
  },

  // Tag actions
  addTag: async (tagData: Partial<Tag>) => {
    try {
      set({ error: null })
      const newTag = createTag(tagData)
      await tagDB.create(newTag)
      set((state) => ({
        tags: [...state.tags, newTag],
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add tag',
      })
      throw error
    }
  },

  updateTag: async (tag: Tag) => {
    try {
      set({ error: null })
      await tagDB.update(tag)
      set((state) => ({
        tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update tag',
      })
      throw error
    }
  },

  deleteTag: async (tagId: string) => {
    try {
      set({ error: null })
      await tagDB.delete(tagId)
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== tagId),
        tasks: state.tasks.map((task) => ({
          ...task,
          tags: task.tags.filter((tid) => tid !== tagId),
        })),
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete tag',
      })
      throw error
    }
  },

  loadTags: async () => {
    try {
      set({ error: null, isLoading: true })
      const tags = await tagDB.getAll()
      set({ tags, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load tags',
        isLoading: false,
      })
    }
  },

  // Settings actions
  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      set({ error: null })
      const state = get()
      const currentSettings = state.settings || createDefaultSettings()
      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: Date.now(),
      }
      await settingsDB.set(updatedSettings)
      set({ settings: updatedSettings })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update settings',
      })
      throw error
    }
  },

  loadSettings: async () => {
    try {
      set({ error: null })
      let settings = await settingsDB.get()
      if (!settings) {
        settings = createDefaultSettings()
        await settingsDB.set(settings)
      }
      set({ settings })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load settings',
      })
    }
  },

  // UI actions
  setSelectedListId: (listId: string | null) => {
    set({ selectedListId: listId })
  },

  setActiveFilters: (filters) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...filters,
      },
    }))
  },

  setSortBy: (sortBy: 'dueDate' | 'priority' | 'createdAt') => {
    set({ sortBy })
  },

  clearFilters: () => {
    set({
      activeFilters: {},
      searchQuery: undefined,
    })
  },

  // Data actions
  loadAllData: async () => {
    try {
      set({ error: null, isLoading: true })
      await Promise.all([
        get().loadTasks(),
        get().loadLists(),
        get().loadTags(),
        get().loadSettings(),
      ])
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load data',
        isLoading: false,
      })
    }
  },

  exportData: async () => {
    try {
      const data = await exportAllData()
      return JSON.stringify(
        {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          ...data,
        },
        null,
        2
      )
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to export data',
      })
      throw error
    }
  },

  // Selectors
  getFilteredTasks: () => {
    const state = get()
    let filtered = [...state.tasks]

    if (state.selectedListId) {
      filtered = filtered.filter((t) => t.listId === state.selectedListId)
    }

    filtered = filterTasks(filtered, state.activeFilters)
    return sortTasks(filtered, state.sortBy)
  },

  getTasksByList: (listId: string) => {
    const state = get()
    const tasks = state.tasks.filter((t) => t.listId === listId)
    return sortTasks(tasks, state.sortBy)
  },

  getListById: (listId: string) => {
    return get().lists.find((l) => l.id === listId)
  },
}))
