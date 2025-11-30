/**
 * IndexedDB storage layer for TaskNexus
 * Provides offline-first, local-first data persistence
 */

import type {
  Task,
  TaskList,
  Tag,
  AppSettings,
  SyncDelta,
} from '@/types'

const DB_NAME = 'tasknexus-db'
const DB_VERSION = 1

// Store names
const STORES = {
  TASKS: 'tasks',
  LISTS: 'lists',
  TAGS: 'tags',
  SETTINGS: 'settings',
  SYNC_DELTAS: 'sync-deltas',
} as const

/**
 * Initialize IndexedDB and create object stores
 */
function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create Tasks store
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' })
        tasksStore.createIndex('listId', 'listId', { unique: false })
        tasksStore.createIndex('status', 'status', { unique: false })
        tasksStore.createIndex('dueDate', 'dueDate', { unique: false })
        tasksStore.createIndex('priority', 'priority', { unique: false })
        tasksStore.createIndex('createdAt', 'createdAt', { unique: false })
        tasksStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // Create Lists store
      if (!db.objectStoreNames.contains(STORES.LISTS)) {
        const listsStore = db.createObjectStore(STORES.LISTS, { keyPath: 'id' })
        listsStore.createIndex('archived', 'archived', { unique: false })
        listsStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Create Tags store
      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        const tagsStore = db.createObjectStore(STORES.TAGS, { keyPath: 'id' })
        tagsStore.createIndex('name', 'name', { unique: false })
        tagsStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Create Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' })
      }

      // Create Sync Deltas store for cloud synchronization
      if (!db.objectStoreNames.contains(STORES.SYNC_DELTAS)) {
        const syncStore = db.createObjectStore(STORES.SYNC_DELTAS, {
          keyPath: 'id',
        })
        syncStore.createIndex('synced', 'synced', { unique: false })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

let dbInstance: IDBDatabase | null = null

/**
 * Get or initialize the database
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }
  dbInstance = await initializeDB()
  return dbInstance
}

/**
 * Task operations
 */
export const taskDB = {
  async create(task: Task): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readwrite')
        .objectStore(STORES.TASKS)
        .add(task)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async update(task: Task): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readwrite')
        .objectStore(STORES.TASKS)
        .put(task)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async delete(taskId: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readwrite')
        .objectStore(STORES.TASKS)
        .delete(taskId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async getById(taskId: string): Promise<Task | null> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readonly')
        .objectStore(STORES.TASKS)
        .get(taskId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  },

  async getAll(): Promise<Task[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readonly')
        .objectStore(STORES.TASKS)
        .getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  async getByListId(listId: string): Promise<Task[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readonly')
        .objectStore(STORES.TASKS)
        .index('listId')
        .getAll(listId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  async getByStatus(status: string): Promise<Task[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TASKS, 'readonly')
        .objectStore(STORES.TASKS)
        .index('status')
        .getAll(status)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },
}

/**
 * List operations
 */
export const listDB = {
  async create(list: TaskList): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readwrite')
        .objectStore(STORES.LISTS)
        .add(list)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async update(list: TaskList): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readwrite')
        .objectStore(STORES.LISTS)
        .put(list)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async delete(listId: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readwrite')
        .objectStore(STORES.LISTS)
        .delete(listId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async getById(listId: string): Promise<TaskList | null> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readonly')
        .objectStore(STORES.LISTS)
        .get(listId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  },

  async getAll(): Promise<TaskList[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readonly')
        .objectStore(STORES.LISTS)
        .getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  async getActive(): Promise<TaskList[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.LISTS, 'readonly')
        .objectStore(STORES.LISTS)
        .index('archived')
        .getAll(false)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },
}

/**
 * Tag operations
 */
export const tagDB = {
  async create(tag: Tag): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TAGS, 'readwrite')
        .objectStore(STORES.TAGS)
        .add(tag)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async update(tag: Tag): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TAGS, 'readwrite')
        .objectStore(STORES.TAGS)
        .put(tag)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async delete(tagId: string): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TAGS, 'readwrite')
        .objectStore(STORES.TAGS)
        .delete(tagId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async getById(tagId: string): Promise<Tag | null> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TAGS, 'readonly')
        .objectStore(STORES.TAGS)
        .get(tagId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  },

  async getAll(): Promise<Tag[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.TAGS, 'readonly')
        .objectStore(STORES.TAGS)
        .getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },
}

/**
 * Settings operations
 */
export const settingsDB = {
  async set(settings: AppSettings): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SETTINGS, 'readwrite')
        .objectStore(STORES.SETTINGS)
        .put(settings)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async get(): Promise<AppSettings | null> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SETTINGS, 'readonly')
        .objectStore(STORES.SETTINGS)
        .get('app-settings')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  },
}

/**
 * Sync operations
 */
export const syncDB = {
  async createDelta(delta: SyncDelta): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SYNC_DELTAS, 'readwrite')
        .objectStore(STORES.SYNC_DELTAS)
        .add(delta)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async updateDelta(delta: SyncDelta): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SYNC_DELTAS, 'readwrite')
        .objectStore(STORES.SYNC_DELTAS)
        .put(delta)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },

  async getUnsyncedDeltas(): Promise<SyncDelta[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SYNC_DELTAS, 'readonly')
        .objectStore(STORES.SYNC_DELTAS)
        .index('synced')
        .getAll(false)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  async getAllDeltas(): Promise<SyncDelta[]> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SYNC_DELTAS, 'readonly')
        .objectStore(STORES.SYNC_DELTAS)
        .getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  },

  async clearSyncDeltas(): Promise<void> {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const request = db
        .transaction(STORES.SYNC_DELTAS, 'readwrite')
        .objectStore(STORES.SYNC_DELTAS)
        .clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  },
}

/**
 * Utility function to export all data
 */
export async function exportAllData() {
  const tasks = await taskDB.getAll()
  const lists = await listDB.getAll()
  const tags = await tagDB.getAll()
  const settings = await settingsDB.get()

  return {
    tasks,
    lists,
    tags,
    settings,
  }
}

/**
 * Utility function to clear all data
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const transaction = db.transaction(
    [STORES.TASKS, STORES.LISTS, STORES.TAGS, STORES.SETTINGS],
    'readwrite'
  )

  return new Promise((resolve, reject) => {
    transaction.objectStore(STORES.TASKS).clear()
    transaction.objectStore(STORES.LISTS).clear()
    transaction.objectStore(STORES.TAGS).clear()
    transaction.objectStore(STORES.SETTINGS).clear()

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
  })
}
