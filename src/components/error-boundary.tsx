import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              An unexpected error occurred. Please try again.
            </p>
            {this.state.error && (
              <div className="mb-4 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
