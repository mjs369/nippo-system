import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/auth/refresh/route';
import { generateRefreshToken, verifyAccessToken, type JWTPayload } from '@/lib/auth';

import type { NextRequest } from 'next/server';

describe('POST /api/auth/refresh', () => {
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

  it('正常系: 有効なリフレッシュトークンで新しいアクセストークンを取得できる', async () => {
    // テスト用のペイロード
    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    // 有効なリフレッシュトークンを生成
    const refreshToken = generateRefreshToken(payload);

    // リクエストを作成
    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    // APIを呼び出す
    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('token_type', 'Bearer');
    expect(data).toHaveProperty('expires_in', 3600);

    // 新しいアクセストークンが有効であることを確認
    const decoded = verifyAccessToken(data.access_token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.name).toBe(payload.name);
  });

  it('異常系: リフレッシュトークン未入力', async () => {
    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
        details: Array<{ field: string; message: string }>;
      };
    };

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(data.error.details[0].field).toBe('refresh_token');
    expect(data.error.details[0].message).toBe('リフレッシュトークンを入力してください');
  });

  it('異常系: 無効なリフレッシュトークン', async () => {
    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: 'invalid-token',
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('INVALID_TOKEN');
    expect(data.error.message).toBe('リフレッシュトークンが無効です');
  });

  it('異常系: 期限切れのリフレッシュトークン', async () => {
    // 即座に期限切れになるトークンを生成
    const originalExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN;
    process.env.JWT_REFRESH_EXPIRES_IN = '1ms'; // 1ミリ秒で期限切れ

    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    const refreshToken = generateRefreshToken(payload);

    // トークンの期限切れを待つ
    await new Promise((resolve) => setTimeout(resolve, 10));

    process.env.JWT_REFRESH_EXPIRES_IN = originalExpiresIn;

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('TOKEN_EXPIRED');
    expect(data.error.message).toBe('リフレッシュトークンの有効期限が切れています');
  });

  it('正常系: トークンの有効期限が正しく返される', async () => {
    // 2時間の有効期限を設定
    process.env.JWT_EXPIRES_IN = '2h';

    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    const refreshToken = generateRefreshToken(payload);

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      expires_in: number;
    };

    expect(response.status).toBe(200);
    expect(data.expires_in).toBe(7200); // 2時間 = 7200秒
  });

  it('正常系: デフォルトの有効期限（1時間）が返される', async () => {
    // 環境変数を削除してデフォルト値を使用
    delete process.env.JWT_EXPIRES_IN;

    const payload: JWTPayload = {
      userId: 1,
      email: 'test@example.com',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: 2,
    };

    const refreshToken = generateRefreshToken(payload);

    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      expires_in: number;
    };

    expect(response.status).toBe(200);
    expect(data.expires_in).toBe(3600); // 1時間 = 3600秒
  });

  it('異常系: JSONパースエラー', async () => {
    const request = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
      };
    };

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
