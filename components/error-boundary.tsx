"use client"

import React, { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

const MAX_RETRIES = 3

interface State {
  hasError: boolean
  error?: Error
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      const { retryCount } = this.state
      const canRetry = retryCount < MAX_RETRIES
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <p className="text-sm font-medium text-foreground mb-2">Something went wrong</p>
          <p className="text-xs text-muted-foreground mb-4">
            Refresh the page or try again later.
          </p>
          {canRetry ? (
            <button
              type="button"
              onClick={() =>
                this.setState((s) => ({ hasError: false, retryCount: s.retryCount + 1 }))
              }
              className="text-xs font-medium text-primary hover:underline"
            >
              Try again
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Retry limit reached. Please refresh the page.</p>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
