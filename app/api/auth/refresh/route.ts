import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateAccessToken, verifyRefreshToken, type JWTPayload } from '@/lib/auth';

import type { NextRequest } from 'next/server';

/**
 * リフレッシュリクエストのバリデーションスキーマ
 */
const refreshSchema = z.object({
  refresh_token: z
    .string({ required_error: 'リフレッシュトークンを入力してください' })
    .min(1, 'リフレッシュトークンを入力してください'),
});

/**
 * エラーレスポンスを生成する
 */
function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Array<{ field: string; message: string }>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * POST /api/auth/refresh
 * リフレッシュトークンを使用して新しいアクセストークンを取得する
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = (await request.json()) as {
      refresh_token?: string;
    };

    // バリデーション
    const validationResult = refreshSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', 422, details);
    }

    const { refresh_token } = validationResult.data;

    // リフレッシュトークンを検証
    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'TOKEN_EXPIRED') {
          return createErrorResponse(
            'TOKEN_EXPIRED',
            'リフレッシュトークンの有効期限が切れています',
            401
          );
        }
        if (error.message === 'INVALID_TOKEN') {
          return createErrorResponse('INVALID_TOKEN', 'リフレッシュトークンが無効です', 401);
        }
      }
      throw error;
    }

    // 新しいアクセストークン用のペイロードを作成
    const payload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      department: decoded.department,
      position: decoded.position,
      managerId: decoded.managerId,
    };

    // 新しいアクセストークンを生成
    const accessToken = generateAccessToken(payload);

    // トークンの有効期限を取得（秒単位）
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const expiresInSeconds = expiresIn.endsWith('h')
      ? parseInt(expiresIn) * 3600
      : expiresIn.endsWith('d')
        ? parseInt(expiresIn) * 86400
        : 3600; // デフォルト1時間

    // レスポンスを返す
    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Token refresh error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
