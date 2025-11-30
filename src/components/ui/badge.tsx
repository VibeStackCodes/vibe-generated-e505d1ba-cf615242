/**
 * Badge component
 */

import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-purple-100 text-purple-800',
      secondary: 'bg-gray-100 text-gray-800',
      outline: 'border border-gray-300 text-gray-800',
    }

    return (
      <div
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
