import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// エラーを投げるコンポーネント
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('テストエラー')
  }
  return <div>正常なコンポーネント</div>
}

describe('ErrorBoundary Component', () => {
  // コンソールエラーを抑制
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('正常系: エラーがない場合は子コンポーネントが表示される', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument()
  })

  it('正常系: エラーが発生した場合はデフォルトのエラー画面が表示される', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('予期しないエラーが発生しました')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
  })

  it('正常系: 再試行ボタンをクリックするとエラーがリセットされる', () => {
    // エラーをスローするかどうかを制御する変数
    let shouldThrowError = true

    // 動的にエラーをスローするコンポーネント
    function DynamicErrorComponent() {
      if (shouldThrowError) {
        throw new Error('テストエラー')
      }
      return <div>正常なコンポーネント</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <DynamicErrorComponent />
      </ErrorBoundary>
    )

    // エラー画面が表示される
    expect(screen.getByText('予期しないエラーが発生しました')).toBeInTheDocument()

    // エラーを解除
    shouldThrowError = false

    // 再試行ボタンをクリック
    const retryButton = screen.getByRole('button', { name: '再試行' })
    fireEvent.click(retryButton)

    // エラーがリセットされて正常なコンポーネントが表示される
    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument()
  })

  it('正常系: カスタムFallbackコンポーネントが表示される', () => {
    function CustomFallback({ error, resetError }: any) {
      return (
        <div>
          <p>カスタムエラー: {error.message}</p>
          <button onClick={resetError}>リセット</button>
        </div>
      )
    }

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('カスタムエラー: テストエラー')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'リセット' })).toBeInTheDocument()
  })

  it('正常系: エラー情報がコンソールに出力される', () => {
    const consoleSpy = vi.spyOn(console, 'error')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
  })
})
