/**
 * エラーハンドリングユーティリティ
 *
 * APIエラーやバリデーションエラーを統一的に処理するためのヘルパー関数
 */

/**
 * APIエラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}

/**
 * APIエラーの詳細情報
 */
export interface ApiErrorDetail {
  field: string
  message: string
}

/**
 * カスタムAPIエラークラス
 */
export class ApiError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: ApiErrorDetail[]

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: ApiErrorDetail[]
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details

    // TypeScriptの型ガードのため
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  /**
   * APIエラーかどうかを判定
   */
  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
  }

  /**
   * バリデーションエラーかどうかを判定
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' && this.statusCode === 422
  }

  /**
   * 認証エラーかどうかを判定
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.code === 'UNAUTHORIZED' || this.code === 'INVALID_TOKEN'
  }

  /**
   * 権限エラーかどうかを判定
   */
  isForbiddenError(): boolean {
    return this.statusCode === 403 || this.code === 'ACCESS_DENIED'
  }
}

/**
 * Fetchエラーをハンドリングして適切なエラーオブジェクトを返す
 */
export async function handleApiError(response: Response): Promise<ApiError> {
  let errorData: ApiErrorResponse | null = null

  try {
    errorData = await response.json()
  } catch {
    // JSONパースに失敗した場合
    return new ApiError(
      'サーバーエラーが発生しました',
      'SERVER_ERROR',
      response.status
    )
  }

  if (errorData?.error) {
    return new ApiError(
      errorData.error.message,
      errorData.error.code,
      response.status,
      errorData.error.details
    )
  }

  return new ApiError(
    'サーバーエラーが発生しました',
    'SERVER_ERROR',
    response.status
  )
}

/**
 * ユーザーフレンドリーなエラーメッセージを取得
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    // APIエラーの場合は、サーバーから返されたメッセージを使用
    return error.message
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '予期しないエラーが発生しました'
}

/**
 * エラーログを記録
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error)
    if (context) {
      console.error('[Context]', context)
    }
  }

  // 本番環境では、エラー追跡サービス（Sentry等）に送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // sendErrorToService(error, context)
  }
}

/**
 * 汎用的なエラーハンドラー
 *
 * @example
 * ```typescript
 * try {
 *   const data = await fetchData()
 * } catch (error) {
 *   handleError(error, { userId: 123 })
 *   throw error
 * }
 * ```
 */
export function handleError(error: unknown, context?: Record<string, unknown>): void {
  logError(error, context)

  // エラー通知をトーストなどで表示する場合はここで実装
  // toast.error(getUserFriendlyErrorMessage(error))
}

/**
 * フィールドエラーマップを作成
 *
 * バリデーションエラーをフォーム表示用に整形
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!ApiError.isApiError(error) || !error.isValidationError() || !error.details) {
    return {}
  }

  const fieldErrors: Record<string, string> = {}
  for (const detail of error.details) {
    fieldErrors[detail.field] = detail.message
  }

  return fieldErrors
}
