/**
 * Dashboard page - main view of TaskNexus
 * Displays tasks, lists, and provides task management interface
 */

import { useEffect, useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, TaskList } from '@/types'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { ListManager } from '@/components/ListManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Plus, Search, Settings } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExportButton } from '@/components/ExportButton'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function Dashboard() {
  const {
    tasks,
    lists,
    isLoading,
    error,
    selectedListId,
    activeFilters,
    sortBy,
    loadAllData,
    setSelectedListId,
    setActiveFilters,
    setSortBy,
    updateTask,
    addTask,
    addList,
    updateList,
    deleteList,
  } = useTaskStore()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null)

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+n': handleNewTask,
    'cmd+k': () => searchInputRef?.focus(),
    escape: () => setShowTaskModal(false),
  })

  const handleTaskSubmit = async (task: Task) => {
    try {
      setIsSubmitting(true)
      if (task.id && tasks.some(t => t.id === task.id)) {
        // Existing task
        await updateTask(task)
      } else {
        // New task
        await addTask(task)
      }
      setShowTaskModal(false)
      setSelectedTask(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewTask = () => {
    setSelectedTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const filteredTasks = tasks.filter((task) => {
    let matches = true

    if (selectedListId && task.listId !== selectedListId) {
      matches = false
    }

    if (activeFilters.status && task.status !== activeFilters.status) {
      matches = false
    }

    if (activeFilters.priority && task.priority !== activeFilters.priority) {
      matches = false
    }

    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase()
      matches =
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    }

    return matches
  })

  const displayedTasks = filteredTasks.sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const priorityOrder: Record<string, number> = {
          High: 0,
          Medium: 1,
          Low: 2,
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      case 'createdAt':
        return b.createdAt - a.createdAt
      case 'dueDate':
      default:
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate - b.dueDate
    }
  })

  const handleStatusChange = async (task: Task, newStatus: 'Todo' | 'In Progress' | 'Done') => {
    try {
      await updateTask({
        ...task,
        status: newStatus,
        completedAt: newStatus === 'Done' ? Date.now() : undefined,
      })
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-600 mb-2">
            TaskNexus
          </h1>
          <p className="text-sm text-gray-600">Offline-first to-do app</p>
        </div>

        <Button
          onClick={handleNewTask}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>

        <ListManager
          lists={lists}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          onAddList={addList}
          onUpdateList={updateList}
          onDeleteList={deleteList}
        />

        <div className="mt-8 pt-8 border-t">
          <Button
            variant="outline"
            className="w-full text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={setSearchInputRef}
                placeholder="Search tasks..."
                value={activeFilters.searchQuery || ''}
                onChange={(e) =>
                  setActiveFilters({ searchQuery: e.target.value })
                }
                className="pl-10"
              />
            </div>

            {/* Status filter */}
            <Select
              value={activeFilters.status || 'all'}
              onValueChange={(value) =>
                setActiveFilters({ status: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Todo">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority filter */}
            <Select
              value={activeFilters.priority || 'all'}
              onValueChange={(value) =>
                setActiveFilters({ priority: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value: any) => setSortBy(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
              </SelectContent>
            </Select>

            {/* Export button */}
            <ExportButton />
          </div>
        </div>

        {/* Tasks list */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : displayedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4">No tasks yet</p>
              <Button
                onClick={handleNewTask}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create your first task
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 max-w-3xl">
              {displayedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskClick={handleEditTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Edit Task' : 'New Task'}
            </DialogTitle>
          </DialogHeader>
          {lists.length > 0 ? (
            <TaskForm
              task={selectedTask || undefined}
              lists={lists}
              onSubmit={handleTaskSubmit}
              onCancel={() => setShowTaskModal(false)}
              isLoading={isSubmitting}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-600 mb-4">
                Create a list first to add tasks
              </p>
              <Button
                onClick={() => setShowTaskModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
