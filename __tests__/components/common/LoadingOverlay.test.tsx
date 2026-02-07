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
    // スクリーンリーダー用とメッセージ表示の両方があるため、getAllByTextを使用
    const loadingTexts = screen.getAllByText('読み込み中...')
    expect(loadingTexts.length).toBeGreaterThan(0)
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
    const { container } = render(
      <LoadingOverlay loading={true} fullScreen>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    // fullScreenの場合は最上位のdivがfixedクラスを持つ
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toHaveClass('fixed')
  })

  it('正常系: blurオプションが機能する', () => {
    const { container } = render(
      <LoadingOverlay loading={true} blur={true}>
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    // blur=trueの場合、オーバーレイdivがbackdrop-blur-smクラスを持つ
    const relativeDiv = container.firstChild as HTMLElement
    const overlayDiv = relativeDiv.children[1] as HTMLElement
    expect(overlayDiv).toHaveClass('backdrop-blur-sm')
  })

  it('正常系: カスタムクラス名が適用される', () => {
    const { container } = render(
      <LoadingOverlay loading={true} className="custom-overlay">
        <div>コンテンツ</div>
      </LoadingOverlay>
    )

    // カスタムクラスはオーバーレイdivに適用される
    const relativeDiv = container.firstChild as HTMLElement
    const overlayDiv = relativeDiv.children[1] as HTMLElement
    expect(overlayDiv).toHaveClass('custom-overlay')
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
