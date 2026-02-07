import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/auth/login/route';
import { hashPassword, verifyAccessToken } from '@/lib/auth';
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

describe('POST /api/auth/login', () => {
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

  it('正常系: 正しいメール・パスワードでログイン成功', async () => {
    const testUser = {
      email: 'yamada@example.com',
      password: 'password123',
      name: '山田 太郎',
      department: '営業第一部',
      position: '課長',
    };

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(testUser.password);

    // Prismaのモックレスポンスを設定
    const mockUser = {
      id: 1,
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      department: testUser.department,
      position: testUser.position,
      managerId: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    // リクエストを作成
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    // APIを呼び出す
    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: number;
        name: string;
        email: string;
        department: string;
        position: string;
        manager_id: number;
      };
    };

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('refresh_token');
    expect(data).toHaveProperty('token_type', 'Bearer');
    expect(data).toHaveProperty('expires_in', 3600);
    expect(data).toHaveProperty('user');
    expect(data.user).toEqual({
      id: 1,
      name: testUser.name,
      email: testUser.email,
      department: testUser.department,
      position: testUser.position,
      manager_id: 5,
    });

    // Prismaが正しく呼び出されたことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).toHaveBeenCalledWith({
      where: { email: testUser.email },
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
  });

  it('正常系: 上長がいないユーザーのログイン', async () => {
    const testUser = {
      email: 'watanabe@example.com',
      password: 'password123',
      name: '渡辺 部長',
      department: '営業部',
      position: '部長',
    };

    const hashedPassword = await hashPassword(testUser.password);

    const mockUser = {
      id: 7,
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      department: testUser.department,
      position: testUser.position,
      managerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      user: {
        manager_id: null;
      };
    };

    expect(response.status).toBe(200);
    expect(data.user.manager_id).toBeNull();
  });

  it('異常系: 存在しないメールアドレスで401エラー', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
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
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
    expect(data.error.message).toBe('メールアドレスまたはパスワードが正しくありません');
  });

  it('異常系: 不正なパスワードで401エラー', async () => {
    const hashedPassword = await hashPassword('correctpassword');

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: hashedPassword,
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
      managerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
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
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
    expect(data.error.message).toBe('メールアドレスまたはパスワードが正しくありません');
  });

  it('異常系: メールアドレス未入力で422エラー', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '',
        password: 'password123',
      }),
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
    expect(data.error.details[0].field).toBe('email');
    expect(data.error.details[0].message).toBe('メールアドレスを入力してください');

    // Prismaが呼び出されていないことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).not.toHaveBeenCalled();
  });

  it('異常系: パスワード未入力で422エラー', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '',
      }),
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
    expect(data.error.details[0].field).toBe('password');
    expect(data.error.details[0].message).toBe('パスワードを入力してください');
  });

  it('異常系: メールアドレス形式不正で422エラー', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
      }),
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
    expect(data.error.details[0].field).toBe('email');
    expect(data.error.details[0].message).toBe('メールアドレスの形式が正しくありません');
  });

  it('異常系: 両方未入力で422エラー（複数のバリデーションエラー）', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '',
        password: '',
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        details: Array<{ field: string; message: string }>;
      };
    };

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(data.error.details.length).toBeGreaterThanOrEqual(2);
    // emailとpasswordの両方のエラーが含まれていることを確認
    const fields = data.error.details.map((d) => d.field);
    expect(fields).toContain('email');
    expect(fields).toContain('password');
  });

  it('正常系: JWTトークンが正しく生成されることを確認', async () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
    };

    const hashedPassword = await hashPassword(testUser.password);

    const mockUser = {
      id: 1,
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      department: testUser.department,
      position: testUser.position,
      managerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    };

    expect(response.status).toBe(200);

    // JWTトークンの形式チェック（ヘッダー.ペイロード.シグネチャ）
    expect(data.access_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    expect(data.refresh_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // トークンタイプの確認
    expect(data.token_type).toBe('Bearer');

    // 有効期限の確認
    expect(data.expires_in).toBe(3600);

    // アクセストークンが有効であることを確認
    const decoded = verifyAccessToken(data.access_token);
    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe(testUser.email);
  });

  it('正常系: 有効期限が環境変数から正しく設定される', async () => {
    // 2時間の有効期限を設定
    process.env.JWT_EXPIRES_IN = '2h';

    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'テストユーザー',
      department: 'テスト部署',
      position: '一般',
    };

    const hashedPassword = await hashPassword(testUser.password);

    const mockUser = {
      id: 1,
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      department: testUser.department,
      position: testUser.position,
      managerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockUser);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      expires_in: number;
    };

    expect(response.status).toBe(200);
    expect(data.expires_in).toBe(7200); // 2時間 = 7200秒
  });

  it('異常系: データベースエラー', async () => {
    // Prismaのモックでエラーを投げる
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(prisma.sales.findUnique).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(data.error.message).toBe('サーバー内部エラーが発生しました');
  });

  it('異常系: JSONパースエラー', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
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

    // Prismaが呼び出されていないことを確認
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(prisma.sales.findUnique).not.toHaveBeenCalled();
  });
});
