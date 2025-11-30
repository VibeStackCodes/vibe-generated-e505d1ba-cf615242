/**
 * ExportButton component - exports tasks data
 */

import { useState } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download } from 'lucide-react'

type ExportFormat = 'json' | 'csv'

export function ExportButton() {
  const { tasks, lists, tags, settings } = useTaskStore()
  const [format, setFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      let content = ''
      let filename = ''
      let mimeType = ''

      if (format === 'json') {
        content = JSON.stringify(
          {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            tasks,
            lists,
            tags,
            settings,
          },
          null,
          2
        )
        filename = `tasknexus-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      } else {
        // CSV format
        const headers = [
          'ID',
          'Title',
          'Description',
          'Status',
          'Priority',
          'Due Date',
          'List',
          'Tags',
          'Created At',
          'Updated At',
        ]

        const rows = tasks.map((task) => {
          const list = lists.find((l) => l.id === task.listId)
          const tagNames = task.tags
            .map((tagId) => tags.find((t) => t.id === tagId)?.name)
            .filter(Boolean)
            .join(';')

          return [
            task.id,
            `"${task.title.replace(/"/g, '""')}"`,
            `"${(task.description || '').replace(/"/g, '""')}"`,
            task.status,
            task.priority,
            task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
            `"${(list?.name || '').replace(/"/g, '""')}"`,
            tagNames,
            new Date(task.createdAt).toISOString(),
            new Date(task.updatedAt).toISOString(),
          ]
        })

        content = [headers.join(','), ...rows.map((row) => row.join(','))].join(
          '\n'
        )
        filename = `tasknexus-export-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(value: any) => setFormat(value)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="csv">CSV</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExport}
        disabled={isExporting || (tasks.length === 0 && lists.length === 0)}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>
    </div>
  )
}
