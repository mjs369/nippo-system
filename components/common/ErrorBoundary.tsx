'use client'

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
}

interface ErrorBoundaryFallbackProps {
  error: Error
  resetError: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * デフォルトのエラー表示コンポーネント
 */
function DefaultErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-2xl">
        <AlertTitle className="text-lg font-semibold">予期しないエラーが発生しました</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">申し訳ございません。予期しないエラーが発生しました。</p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-4 rounded-md bg-destructive/10 p-4">
              <summary className="cursor-pointer font-medium">エラー詳細</summary>
              <pre className="mt-2 overflow-auto text-xs">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
          <Button onClick={resetError} variant="outline">
            再試行
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * エラーバウンダリーコンポーネント
 *
 * 子コンポーネントで発生したエラーをキャッチして表示します。
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログをコンソールに出力
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 本番環境では、エラー追跡サービス（Sentry等）に送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // sendErrorToService(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}
