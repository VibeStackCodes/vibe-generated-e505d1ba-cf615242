/**
 * Button component - reusable button with variants
 */

import React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantClasses = {
      default:
        'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-600',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-600',
      outline:
        'border border-gray-300 text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-600',
      ghost: 'text-gray-900 hover:bg-gray-100 focus-visible:ring-gray-600',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    }

    const sizeClasses = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-6 text-base',
    }

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
