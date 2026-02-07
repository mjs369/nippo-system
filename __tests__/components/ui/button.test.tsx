import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('正常系: ボタンが正しく表示される', () => {
    render(<Button>クリック</Button>)

    const button = screen.getByRole('button', { name: 'クリック' })
    expect(button).toBeInTheDocument()
  })

  it('正常系: ボタンのクリックイベントが発火する', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>クリック</Button>)

    const button = screen.getByRole('button', { name: 'クリック' })
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('正常系: ローディング中のボタンが正しく表示される', () => {
    render(<Button loading>読み込み中</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('読み込み中')).toBeInTheDocument()
  })

  it('正常系: ローディング中はクリックイベントが発火しない', () => {
    const handleClick = vi.fn()
    render(<Button loading onClick={handleClick}>クリック</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('正常系: disabled状態のボタンが正しく表示される', () => {
    render(<Button disabled>無効</Button>)

    const button = screen.getByRole('button', { name: '無効' })
    expect(button).toBeDisabled()
  })

  it('正常系: variant="destructive"のボタンが表示される', () => {
    render(<Button variant="destructive">削除</Button>)

    const button = screen.getByRole('button', { name: '削除' })
    expect(button).toBeInTheDocument()
  })

  it('正常系: variant="outline"のボタンが表示される', () => {
    render(<Button variant="outline">アウトライン</Button>)

    const button = screen.getByRole('button', { name: 'アウトライン' })
    expect(button).toBeInTheDocument()
  })

  it('正常系: size="sm"のボタンが表示される', () => {
    render(<Button size="sm">小さいボタン</Button>)

    const button = screen.getByRole('button', { name: '小さいボタン' })
    expect(button).toBeInTheDocument()
  })

  it('正常系: size="lg"のボタンが表示される', () => {
    render(<Button size="lg">大きいボタン</Button>)

    const button = screen.getByRole('button', { name: '大きいボタン' })
    expect(button).toBeInTheDocument()
  })

  it('正常系: カスタムクラス名が適用される', () => {
    render(<Button className="custom-button">カスタム</Button>)

    const button = screen.getByRole('button', { name: 'カスタム' })
    expect(button).toHaveClass('custom-button')
  })

  it('正常系: ローディング中はloadingとdisabledの両方が有効', () => {
    render(<Button loading disabled>ボタン</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
