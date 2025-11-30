/**
 * Select component
 */

import React, { useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}

function SelectTrigger({
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { value } = React.useContext(SelectContext)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className={`inline-flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-0 w-full ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {isOpen && (
        <div
          className="fixed inset-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function SelectValue({
  placeholder = 'Select...',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span {...props}>{value || placeholder}</span>
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

function SelectContent({
  className = '',
  children,
  ...props
}: SelectContentProps) {
  return (
    <div
      className={`absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

function SelectItem({
  value,
  children,
  className = '',
  ...props
}: SelectItemProps) {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <button
      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-purple-100 text-purple-900 font-medium' : 'text-gray-900'
      } ${className}`}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
