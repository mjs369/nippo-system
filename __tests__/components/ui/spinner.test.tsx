import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from '@/components/ui/spinner'

describe('Spinner Component', () => {
  it('正常系: デフォルトサイズのスピナーが表示される', () => {
    render(<Spinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', '読み込み中')
  })

  it('正常系: 小サイズのスピナーが表示される', () => {
    render(<Spinner size="sm" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('正常系: 大サイズのスピナーが表示される', () => {
    render(<Spinner size="lg" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('正常系: 特大サイズのスピナーが表示される', () => {
    render(<Spinner size="xl" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('正常系: スクリーンリーダー用のテキストが含まれる', () => {
    render(<Spinner />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('正常系: カスタムクラス名が適用される', () => {
    render(<Spinner className="custom-spinner" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('正常系: roleがstatusに設定されている', () => {
    render(<Spinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('role', 'status')
  })
})
