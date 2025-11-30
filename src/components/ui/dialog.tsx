/**
 * Dialog/Modal component
 */

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const DialogContext = React.createContext<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>({})

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children?: React.ReactNode
}

function DialogTrigger({
  asChild,
  children,
  onClick,
  ...props
}: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange?.(true)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

function DialogContent({ className = '', children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex-1">{/* Header will go here */}</div>
          <button
            onClick={() => onOpenChange?.(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogHeader({ className = '', ...props }: DialogHeaderProps) {
  return (
    <div className={`space-y-1.5 ${className}`} {...props} />
  )
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function DialogTitle({ className = '', ...props }: DialogTitleProps) {
  return (
    <h2
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogFooter({ className = '', ...props }: DialogFooterProps) {
  return (
    <div
      className={`flex justify-end gap-2 border-t border-gray-200 p-4 ${className}`}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
}
