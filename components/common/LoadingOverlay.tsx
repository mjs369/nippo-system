import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface LoadingOverlayProps {
  /**
   * ローディング中かどうか
   */
  loading: boolean
  /**
   * ローディング中に表示するメッセージ
   */
  message?: string
  /**
   * 背景をぼかすかどうか
   */
  blur?: boolean
  /**
   * 全画面表示にするかどうか
   */
  fullScreen?: boolean
  /**
   * 子要素（ローディング中は表示されない）
   */
  children?: React.ReactNode
  /**
   * オーバーレイのカスタムクラス名
   */
  className?: string
}

/**
 * ローディングオーバーレイコンポーネント
 *
 * データ取得中や処理中に画面全体または特定の領域をカバーして
 * ローディング状態を表示します。
 *
 * @example
 * ```tsx
 * // 全画面ローディング
 * <LoadingOverlay loading={isLoading} fullScreen />
 *
 * // エリア内ローディング
 * <LoadingOverlay loading={isLoading}>
 *   <YourContent />
 * </LoadingOverlay>
 * ```
 */
export function LoadingOverlay({
  loading,
  message = "読み込み中...",
  blur = true,
  fullScreen = false,
  children,
  className,
}: LoadingOverlayProps) {
  if (!loading) {
    return <>{children}</>
  }

  const overlayClasses = cn(
    "flex items-center justify-center",
    fullScreen
      ? "fixed inset-0 z-50 bg-background/80"
      : "absolute inset-0 z-10 bg-background/80",
    blur && "backdrop-blur-sm",
    className
  )

  const overlay = (
    <div className={overlayClasses}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )

  if (fullScreen) {
    return overlay
  }

  return (
    <div className="relative">
      {children}
      {overlay}
    </div>
  )
}

/**
 * ページ全体のローディング表示
 *
 * @example
 * ```tsx
 * <PageLoading message="データを読み込んでいます..." />
 * ```
 */
export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  )
}
