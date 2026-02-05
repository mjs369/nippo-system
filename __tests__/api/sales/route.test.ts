/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GET } from '@/app/api/sales/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sales: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/sales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 営業担当者一覧取得成功', async () => {
    // モックユーザー
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 総件数のモック
    vi.mocked(prisma.sales.count).mockResolvedValue(25);

    // 営業担当者一覧のモック
    const mockSalesList = [
      {
        id: 1,
        name: '山田 太郎',
        email: 'yamada@example.com',
        department: '営業第一部',
        position: '課長',
        managerId: 5,
        manager: { name: '佐藤 花子' },
      },
      {
        id: 2,
        name: '鈴木 一郎',
        email: 'suzuki@example.com',
        department: '営業第一部',
        position: '一般',
        managerId: 1,
        manager: { name: '山田 太郎' },
      },
    ];
    vi.mocked(prisma.sales.findMany).mockResolvedValue(mockSalesList as never);

    const request = new Request('http://localhost/api/sales', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty('id', 1);
    expect(data.data[0]).toHaveProperty('name', '山田 太郎');
    expect(data.data[0]).toHaveProperty('manager_name', '佐藤 花子');
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('total_count', 25);
  });

  it('正常系: 部署でフィルタリング', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.sales.count).mockResolvedValue(10);

    const mockSalesList = [
      {
        id: 1,
        name: '山田 太郎',
        email: 'yamada@example.com',
        department: '営業第一部',
        position: '課長',
        managerId: 5,
        manager: { name: '佐藤 花子' },
      },
    ];
    vi.mocked(prisma.sales.findMany).mockResolvedValue(mockSalesList as never);

    const request = new Request('http://localhost/api/sales?department=営業第一部', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].department).toBe('営業第一部');
  });

  it('正常系: ページネーション', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.sales.count).mockResolvedValue(25);
    vi.mocked(prisma.sales.findMany).mockResolvedValue([] as never);

    const request = new Request('http://localhost/api/sales?page=2&per_page=10', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toHaveProperty('current_page', 2);
    expect(data.pagination).toHaveProperty('per_page', 10);
    expect(data.pagination).toHaveProperty('total_pages', 3);
    expect(data.pagination).toHaveProperty('total_count', 25);
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/sales', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('正常系: 上長がnullの場合', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.sales.count).mockResolvedValue(1);

    const mockSalesList = [
      {
        id: 7,
        name: '渡辺 部長',
        email: 'watanabe@example.com',
        department: '営業部',
        position: '部長',
        managerId: null,
        manager: null,
      },
    ];
    vi.mocked(prisma.sales.findMany).mockResolvedValue(mockSalesList as never);

    const request = new Request('http://localhost/api/sales', {
      method: 'GET',
    });

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0]).toHaveProperty('manager_name', null);
  });
});
