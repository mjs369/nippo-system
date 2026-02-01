import { NextRequest } from 'next/server';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { POST } from '@/app/api/auth/login/route';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('POST /api/auth/login', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: '山田 太郎',
    department: '営業第一部',
    position: '課長',
  };

  let testUserId: number;

  beforeAll(async () => {
    // テストユーザーを作成
    const hashedPassword = await hashPassword(testUser.password);
    const user = await prisma.sales.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        department: testUser.department,
        position: testUser.position,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // テストデータをクリーンアップ
    await prisma.sales.delete({
      where: { id: testUserId },
    });
  });

  it('正常系: 正しいメール・パスワードでログイン成功', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('refresh_token');
    expect(data).toHaveProperty('token_type', 'Bearer');
    expect(data).toHaveProperty('expires_in');
    expect(data).toHaveProperty('user');
    expect(data.user).toEqual({
      id: testUserId,
      name: testUser.name,
      email: testUser.email,
      department: testUser.department,
      position: testUser.position,
      manager_id: null,
    });
  });

  it('異常系: 存在しないメールアドレスで401エラー', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
    expect(data.error.message).toBe('メールアドレスまたはパスワードが正しくありません');
  });

  it('異常系: 不正なパスワードで401エラー', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'wrongpassword',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
    expect(data.error.message).toBe('メールアドレスまたはパスワードが正しくありません');
  });

  it('異常系: メールアドレス未入力で422エラー', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(data.error.details[0].field).toBe('email');
    expect(data.error.details[0].message).toBe('メールアドレスを入力してください');
  });

  it('異常系: パスワード未入力で422エラー', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(data.error.details[0].field).toBe('password');
    expect(data.error.details[0].message).toBe('パスワードを入力してください');
  });

  it('異常系: メールアドレス形式不正で422エラー', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toBeDefined();
    expect(data.error.details[0].field).toBe('email');
    expect(data.error.details[0].message).toBe('メールアドレスの形式が正しくありません');
  });

  it('JWTトークンが正しく生成されることを確認', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);

    // JWTトークンの形式チェック（ヘッダー.ペイロード.シグネチャ）
    expect(data.access_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    expect(data.refresh_token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

    // トークンタイプの確認
    expect(data.token_type).toBe('Bearer');

    // 有効期限の確認
    expect(data.expires_in).toBeGreaterThan(0);
  });
});
