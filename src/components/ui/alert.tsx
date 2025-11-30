/**
 * Alert component
 */

import React from 'react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'border-gray-200 bg-white text-gray-900',
      destructive: 'border-red-200 bg-red-50 text-red-900',
    }

    return (
      <div
        className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Alert.displayName = 'Alert'

export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className = '', ...props }, ref) => (
  <p className={`text-sm [&_p]:leading-relaxed ${className}`} ref={ref} {...props} />
))

AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription }
