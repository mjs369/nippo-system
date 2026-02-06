import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GET } from '@/app/api/auth/me/route';
import { generateAccessToken, type JWTPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sales: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/auth/me', () => {
  // 環境変数のモック
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-key-for-access-token',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-for-refresh-token',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('正常系: 認証済みユーザーの情報を取得できる', async () => {
    // テスト用のペイロード
    const payload: JWTPayload = {
      userId: 1,
      email: 'yamada@example.com',
      name: '山田 太郎',
      department: '営業第一部',
      position: '課長',
      managerId: 5,
    };

    // アクセストークンを生成
    const accessToken = generateAccessToken(payload);

    // Prismaのモックレスポンスを設定
    const mockUser = {
      id: 1,
      name: '山田 太郎',
      email: 'yamada@example.com',
      department: '営業第一部',
      position: '課長',
      password: 'hashed-password',
      managerId: 5,
      createdAt: new Date('2025-01-15T10:00:00+09:00'),
      updatedAt: new Date('2026-01-20T15:30:00+09:00'),
      manager: {
        name: '佐藤 花子',
      },
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      id: number;
      name: string;
      email: string;
      department: string;
      position: string;
      manager_id: number;
      manager_name: string;
      created_at: string;
      updated_at: string;
    };

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(data.id).toBe(1);
    expect(data.name).toBe('山田 太郎');
    expect(data.email).toBe('yamada@example.com');
    expect(data.department).toBe('営業第一部');
    expect(data.position).toBe('課長');
    expect(data.manager_id).toBe(5);
    expect(data.manager_name).toBe('佐藤 花子');
    expect(data.created_at).toBe('2025-01-15T01:00:00.000Z');
    expect(data.updated_at).toBe('2026-01-20T06:30:00.000Z');

    // Prismaが正しく呼び出されたことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  it('正常系: 上長がいないユーザーの情報を取得できる', async () => {
    // テスト用のペイロード（上長なし）
    const payload: JWTPayload = {
      userId: 7,
      email: 'watanabe@example.com',
      name: '渡辺 部長',
      department: '営業部',
      position: '部長',
      managerId: null,
    };

    // アクセストークンを生成
    const accessToken = generateAccessToken(payload);

    // Prismaのモックレスポンスを設定（上長なし）
    const mockUser = {
      id: 7,
      name: '渡辺 部長',
      email: 'watanabe@example.com',
      department: '営業部',
      position: '部長',
      password: 'hashed-password',
      managerId: null,
      createdAt: new Date('2025-01-01T10:00:00+09:00'),
      updatedAt: new Date('2026-01-01T10:00:00+09:00'),
      manager: null,
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      id: number;
      name: string;
      email: string;
      department: string;
      position: string;
      manager_id: null;
      manager_name: null;
      created_at: string;
      updated_at: string;
    };

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(data.id).toBe(7);
    expect(data.name).toBe('渡辺 部長');
    expect(data.manager_id).toBeNull();
    expect(data.manager_name).toBeNull();
  });

  it('異常系: 認証トークンなし', async () => {
    // Authorizationヘッダーなしでリクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
    expect(data.error.message).toBe('認証が必要です');

    // Prismaが呼び出されていないことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).not.toHaveBeenCalled();
  });

  it('異常系: 無効なトークン形式', async () => {
    // 不正な形式のAuthorizationヘッダー
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'InvalidFormat token',
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
    expect(data.error.message).toBe('認証が必要です');
  });

  it('異常系: 無効なトークン', async () => {
    // 無効なトークン
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('INVALID_TOKEN');
    expect(data.error.message).toBe('トークンが無効です');
  });

  it('異常系: トークンの有効期限切れ', async () => {
    // 即座に期限切れになるトークンを生成
    process.env.JWT_EXPIRES_IN = '1ms';

    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    const accessToken = generateAccessToken(payload);

    // トークンの期限切れを待つ
    await new Promise((resolve) => setTimeout(resolve, 10));

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('TOKEN_EXPIRED');
    expect(data.error.message).toBe('トークンの有効期限が切れています');
  });

  it('異常系: ユーザーが存在しない', async () => {
    // テスト用のペイロード
    const payload: JWTPayload = {
      userId: 999,
      email: 'notfound@example.com',
      name: '存在しないユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: null,
    };

    // アクセストークンを生成
    const accessToken = generateAccessToken(payload);

    // Prismaのモックレスポンスを設定（ユーザーが見つからない）
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(null);

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(data.error.message).toBe('ユーザーが見つかりません');

    // Prismaが正しく呼び出されたことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
    });
  });

  it('異常系: データベースエラー', async () => {
    // テスト用のペイロード
    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    // アクセストークンを生成
    const accessToken = generateAccessToken(payload);

    // Prismaのモックでエラーを投げる
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockRejectedValue(new Error('Database error'));

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // APIを呼び出す
    const response = await GET(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(data.error.message).toBe('サーバー内部エラーが発生しました');
  });
});
