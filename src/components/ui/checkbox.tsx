/**
 * Checkbox component
 */

import React from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
          ref={ref}
          {...props}
        />
        <div
          className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            checked
              ? 'border-purple-600 bg-purple-600'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${className}`}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
