import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

describe('Alert Component', () => {
  it('正常系: デフォルトアラートが正しく表示される', () => {
    render(
      <Alert>
        <AlertTitle>テストタイトル</AlertTitle>
        <AlertDescription>テスト説明文</AlertDescription>
      </Alert>
    )

    expect(screen.getByText('テストタイトル')).toBeInTheDocument()
    expect(screen.getByText('テスト説明文')).toBeInTheDocument()
  })

  it('正常系: エラーアラート(destructive)が正しく表示される', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription>エラーが発生しました</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('エラー')).toBeInTheDocument()
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
  })

  it('正常系: 成功アラート(success)が正しく表示される', () => {
    render(
      <Alert variant="success">
        <AlertTitle>成功</AlertTitle>
        <AlertDescription>操作が成功しました</AlertDescription>
      </Alert>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('成功')).toBeInTheDocument()
    expect(screen.getByText('操作が成功しました')).toBeInTheDocument()
  })

  it('正常系: AlertTitleのみでも表示される', () => {
    render(
      <Alert>
        <AlertTitle>タイトルのみ</AlertTitle>
      </Alert>
    )

    expect(screen.getByText('タイトルのみ')).toBeInTheDocument()
  })

  it('正常系: AlertDescriptionのみでも表示される', () => {
    render(
      <Alert>
        <AlertDescription>説明文のみ</AlertDescription>
      </Alert>
    )

    expect(screen.getByText('説明文のみ')).toBeInTheDocument()
  })

  it('正常系: カスタムクラス名が適用される', () => {
    render(
      <Alert className="custom-class">
        <AlertTitle>カスタムクラステスト</AlertTitle>
      </Alert>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })
})
