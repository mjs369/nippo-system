import { NextResponse } from 'next/server';

import { extractTokenFromHeader, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

/**
 * エラーレスポンスを生成する
 */
function createErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * GET /api/auth/me
 * ログインユーザー情報を取得する
 */
export async function GET(request: NextRequest) {
  try {
    // Authorizationヘッダーからトークンを抽出
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // トークンを検証
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'TOKEN_EXPIRED') {
          return createErrorResponse('TOKEN_EXPIRED', 'トークンの有効期限が切れています', 401);
        }
        if (error.message === 'INVALID_TOKEN') {
          return createErrorResponse('INVALID_TOKEN', 'トークンが無効です', 401);
        }
      }
      throw error;
    }

    // ユーザー情報を取得
    const user = await prisma.sales.findUnique({
      where: { id: decoded.userId },
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return createErrorResponse('RESOURCE_NOT_FOUND', 'ユーザーが見つかりません', 404);
    }

    // レスポンスを返す
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        manager_id: user.managerId,
        manager_name: user.manager?.name ?? null,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get user info error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
