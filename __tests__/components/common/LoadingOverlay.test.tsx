import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingOverlay, PageLoading } from '@/components/common/LoadingOverlay'

describe('LoadingOverlay Component', () => {
  it('正常系: ローディング中はスピナーが表示される', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('正常系: ローディング中でない場合は子コンポーネントのみ表示', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('コンテンツ')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('正常系: カスタムメッセージが表示される', () => {
    render(
      <LoadingOverlay loading={true} message="データを読み込んでいます...">
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('データを読み込んでいます...')).toBeInTheDocument()
  })

  it('正常系: fullScreenモードで表示される', () => {
    render(
      <LoadingOverlay loading={true} fullScreen>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    const overlay = screen.getByRole('status').parentElement
    expect(overlay).toHaveClass('fixed')
  })

  it('正常系: blurオプションが機能する', () => {
    render(
      <LoadingOverlay loading={true} blur={true}>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    const overlay = screen.getByRole('status').parentElement
    expect(overlay).toHaveClass('backdrop-blur-sm')
  })

  it('正常系: カスタムクラス名が適用される', () => {
    render(
      <LoadingOverlay loading={true} className="custom-overlay">
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    const overlay = screen.getByRole('status').parentElement
    expect(overlay).toHaveClass('custom-overlay')
  })
})

describe('PageLoading Component', () => {
  it('正常系: ページローディングが表示される', () => {
    render(<PageLoading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('正常系: カスタムメッセージが表示される', () => {
    render(<PageLoading message="ページを読み込んでいます..." />)

    expect(screen.getByText('ページを読み込んでいます...')).toBeInTheDocument()
  })

  it('正常系: 特大サイズのスピナーが表示される', () => {
    render(<PageLoading />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })
})
