import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
  type JWTPayload,
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

/**
 * ログインリクエストのバリデーションスキーマ
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
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
 * POST /api/auth/login
 * ユーザー認証を行い、JWTトークンを発行する
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    // バリデーション
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return createErrorResponse('VALIDATION_ERROR', 'バリデーションエラー', 422, details);
    }

    const { email, password } = validationResult.data;

    // ユーザーをメールアドレスで検索
    const user = await prisma.sales.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        department: true,
        position: true,
        managerId: true,
      },
    });

    // ユーザーが存在しない場合
    if (!user) {
      return createErrorResponse(
        'INVALID_CREDENTIALS',
        'メールアドレスまたはパスワードが正しくありません',
        401
      );
    }

    // パスワードを検証
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return createErrorResponse(
        'INVALID_CREDENTIALS',
        'メールアドレスまたはパスワードが正しくありません',
        401
      );
    }

    // JWTペイロードを作成
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      position: user.position,
      managerId: user.managerId,
    };

    // トークン生成
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

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
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          position: user.position,
          manager_id: user.managerId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
