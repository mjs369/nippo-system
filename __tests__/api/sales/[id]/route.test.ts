/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GET } from '@/app/api/sales/[id]/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sales: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/sales/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 営業担当者詳細取得成功', async () => {
    // モックユーザー
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 営業担当者詳細のモック
    const mockSales = {
      id: 1,
      name: '山田 太郎',
      email: 'yamada@example.com',
      department: '営業第一部',
      position: '課長',
      managerId: 5,
      createdAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-20T15:30:00Z'),
      manager: {
        name: '佐藤 花子',
      },
      subordinates: [
        {
          id: 2,
          name: '鈴木 一郎',
          department: '営業第一部',
          position: '一般',
        },
        {
          id: 3,
          name: '田中 花子',
          department: '営業第一部',
          position: '一般',
        },
      ],
    };
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockSales as never);

    const request = new Request('http://localhost/api/sales/1', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('name', '山田 太郎');
    expect(data).toHaveProperty('email', 'yamada@example.com');
    expect(data).toHaveProperty('manager_name', '佐藤 花子');
    expect(data).toHaveProperty('subordinates');
    expect(Array.isArray(data.subordinates)).toBe(true);
    expect(data.subordinates).toHaveLength(2);
    expect(data.subordinates[0]).toHaveProperty('id', 2);
    expect(data.subordinates[0]).toHaveProperty('name', '鈴木 一郎');
  });

  it('正常系: 部下がいない営業担当者', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockSales = {
      id: 2,
      name: '鈴木 一郎',
      email: 'suzuki@example.com',
      department: '営業第一部',
      position: '一般',
      managerId: 1,
      createdAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-20T15:30:00Z'),
      manager: {
        name: '山田 太郎',
      },
      subordinates: [],
    };
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockSales as never);

    const request = new Request('http://localhost/api/sales/2', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subordinates).toHaveLength(0);
  });

  it('正常系: 上長がnullの営業担当者（最上位）', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockSales = {
      id: 7,
      name: '渡辺 部長',
      email: 'watanabe@example.com',
      department: '営業部',
      position: '部長',
      managerId: null,
      createdAt: new Date('2025-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-20T15:30:00Z'),
      manager: null,
      subordinates: [
        {
          id: 1,
          name: '山田 太郎',
          department: '営業第一部',
          position: '課長',
        },
      ],
    };
    vi.mocked(prisma.sales.findUnique).mockResolvedValue(mockSales as never);

    const request = new Request('http://localhost/api/sales/7', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: '7' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('manager_name', null);
    expect(data.subordinates).toHaveLength(1);
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/sales/1', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 営業担当者が存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.sales.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/sales/999', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: IDが不正', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/sales/invalid', {
      method: 'GET',
    });

    const response = await GET(request as never, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_PARAMETER');
  });
});
