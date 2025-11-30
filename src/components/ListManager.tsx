/**
 * ListManager component - sidebar component for managing lists
 */

import { useState } from 'react'
import type { TaskList } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ListForm } from '@/components/ListForm'
import { Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react'

interface ListManagerProps {
  lists: TaskList[]
  selectedListId: string | null
  onSelectList: (listId: string | null) => void
  onAddList: (list: TaskList) => Promise<void>
  onUpdateList: (list: TaskList) => Promise<void>
  onDeleteList: (listId: string) => Promise<void>
}

export function ListManager({
  lists,
  selectedListId,
  onSelectList,
  onAddList,
  onUpdateList,
  onDeleteList,
}: ListManagerProps) {
  const [showListModal, setShowListModal] = useState(false)
  const [selectedList, setSelectedList] = useState<TaskList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleAddList = async (list: TaskList) => {
    try {
      setIsSubmitting(true)
      await onAddList(list)
      setShowListModal(false)
      setSelectedList(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateList = async (list: TaskList) => {
    try {
      setIsSubmitting(true)
      await onUpdateList(list)
      setShowListModal(false)
      setSelectedList(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (confirm('Are you sure you want to delete this list? All tasks in this list will be deleted.')) {
      try {
        await onDeleteList(listId)
        setOpenMenu(null)
        if (selectedListId === listId) {
          onSelectList(null)
        }
      } catch (err) {
        console.error('Failed to delete list:', err)
      }
    }
  }

  const handleEditList = (list: TaskList) => {
    setSelectedList(list)
    setShowListModal(true)
    setOpenMenu(null)
  }

  const activeList = lists.filter((l) => !l.archived)

  return (
    <>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Lists
          </h2>
          <button
            onClick={() => {
              setSelectedList(null)
              setShowListModal(true)
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onSelectList(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
              selectedListId === null
                ? 'bg-purple-100 text-purple-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>All Tasks</span>
          </button>

          {activeList.map((list) => (
            <div
              key={list.id}
              className="relative group"
            >
              <button
                onClick={() => onSelectList(list.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedListId === list.id
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {list.color && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                )}
                <span className="flex-1 truncate">{list.name}</span>
              </button>

              {/* Action menu */}
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === list.id ? null : list.id)
                  }
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenu === list.id && (
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => handleEditList(list)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List Form Modal */}
      <Dialog open={showListModal} onOpenChange={setShowListModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedList ? 'Edit List' : 'New List'}
            </DialogTitle>
          </DialogHeader>
          <ListForm
            list={selectedList || undefined}
            onSubmit={selectedList ? handleUpdateList : handleAddList}
            onCancel={() => setShowListModal(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
