import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ApiError,
  handleApiError,
  getUserFriendlyErrorMessage,
  logError,
  getFieldErrors,
} from '@/lib/error-handler'

describe('ApiError Class', () => {
  it('正常系: ApiErrorインスタンスが正しく作成される', () => {
    const error = new ApiError('テストエラー', 'TEST_ERROR', 400)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('テストエラー')
    expect(error.code).toBe('TEST_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.name).toBe('ApiError')
  })

  it('正常系: 詳細情報付きのApiErrorが作成される', () => {
    const details = [
      { field: 'email', message: 'メールアドレスが不正です' },
      { field: 'password', message: 'パスワードが短すぎます' },
    ]
    const error = new ApiError('バリデーションエラー', 'VALIDATION_ERROR', 422, details)

    expect(error.details).toEqual(details)
  })

  it('正常系: isApiErrorでApiErrorと判定される', () => {
    const error = new ApiError('テストエラー', 'TEST_ERROR', 400)

    expect(ApiError.isApiError(error)).toBe(true)
  })

  it('正常系: isApiErrorで通常のErrorと区別される', () => {
    const error = new Error('通常のエラー')

    expect(ApiError.isApiError(error)).toBe(false)
  })

  it('正常系: isValidationErrorでバリデーションエラーと判定される', () => {
    const error = new ApiError('バリデーションエラー', 'VALIDATION_ERROR', 422)

    expect(error.isValidationError()).toBe(true)
  })

  it('正常系: isAuthErrorで認証エラーと判定される', () => {
    const error = new ApiError('認証エラー', 'UNAUTHORIZED', 401)

    expect(error.isAuthError()).toBe(true)
  })

  it('正常系: isForbiddenErrorで権限エラーと判定される', () => {
    const error = new ApiError('権限エラー', 'ACCESS_DENIED', 403)

    expect(error.isForbiddenError()).toBe(true)
  })
})

describe('handleApiError Function', () => {
  it('正常系: APIエラーレスポンスをパースしてApiErrorを返す', async () => {
    const mockResponse = {
      status: 422,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラー',
          details: [{ field: 'email', message: 'メールアドレスが不正です' }],
        },
      }),
    } as Response

    const error = await handleApiError(mockResponse)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('バリデーションエラー')
    expect(error.statusCode).toBe(422)
    expect(error.details).toEqual([{ field: 'email', message: 'メールアドレスが不正です' }])
  })

  it('正常系: JSONパースに失敗した場合はデフォルトエラーを返す', async () => {
    const mockResponse = {
      status: 500,
      json: async () => {
        throw new Error('JSON parse error')
      },
    } as Response

    const error = await handleApiError(mockResponse)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('SERVER_ERROR')
    expect(error.message).toBe('サーバーエラーが発生しました')
  })
})

describe('getUserFriendlyErrorMessage Function', () => {
  it('正常系: ApiErrorからユーザーフレンドリーなメッセージを取得', () => {
    const error = new ApiError('バリデーションエラー', 'VALIDATION_ERROR', 422)

    expect(getUserFriendlyErrorMessage(error)).toBe('バリデーションエラー')
  })

  it('正常系: ネットワークエラーのメッセージを取得', () => {
    const error = new TypeError('Failed to fetch')

    expect(getUserFriendlyErrorMessage(error)).toBe(
      'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    )
  })

  it('正常系: 通常のErrorのメッセージを取得', () => {
    const error = new Error('テストエラー')

    expect(getUserFriendlyErrorMessage(error)).toBe('テストエラー')
  })

  it('正常系: 不明なエラーのメッセージを取得', () => {
    const error = 'unknown error'

    expect(getUserFriendlyErrorMessage(error)).toBe('予期しないエラーが発生しました')
  })
})

describe('logError Function', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('正常系: エラーがコンソールに出力される（開発環境）', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('テストエラー')

    logError(error)

    expect(consoleSpy).toHaveBeenCalledWith('[Error]', error)

    process.env.NODE_ENV = originalEnv
  })

  it('正常系: コンテキスト付きでエラーが出力される', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('テストエラー')
    const context = { userId: 123, action: 'create' }

    logError(error, context)

    expect(consoleSpy).toHaveBeenCalledWith('[Error]', error)
    expect(consoleSpy).toHaveBeenCalledWith('[Context]', context)

    process.env.NODE_ENV = originalEnv
  })
})

describe('getFieldErrors Function', () => {
  it('正常系: バリデーションエラーからフィールドエラーマップを作成', () => {
    const details = [
      { field: 'email', message: 'メールアドレスが不正です' },
      { field: 'password', message: 'パスワードが短すぎます' },
    ]
    const error = new ApiError('バリデーションエラー', 'VALIDATION_ERROR', 422, details)

    const fieldErrors = getFieldErrors(error)

    expect(fieldErrors).toEqual({
      email: 'メールアドレスが不正です',
      password: 'パスワードが短すぎます',
    })
  })

  it('正常系: バリデーションエラーでない場合は空オブジェクトを返す', () => {
    const error = new ApiError('サーバーエラー', 'SERVER_ERROR', 500)

    const fieldErrors = getFieldErrors(error)

    expect(fieldErrors).toEqual({})
  })

  it('正常系: ApiErrorでない場合は空オブジェクトを返す', () => {
    const error = new Error('通常のエラー')

    const fieldErrors = getFieldErrors(error)

    expect(fieldErrors).toEqual({})
  })

  it('正常系: detailsがない場合は空オブジェクトを返す', () => {
    const error = new ApiError('バリデーションエラー', 'VALIDATION_ERROR', 422)

    const fieldErrors = getFieldErrors(error)

    expect(fieldErrors).toEqual({})
  })
})
