/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST, GET } from '@/app/api/daily-reports/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyReport: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    sales: {
      findMany: vi.fn(),
    },
  },
}));

describe('POST /api/daily-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 日報作成成功', async () => {
    // モックユーザー
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 既存の日報がないことをモック
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

    // 日報作成のモック
    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-01T18:30:00Z'),
      sales: {
        name: '山田 太郎',
      },
    };
    vi.mocked(prisma.dailyReport.create).mockResolvedValue(mockDailyReport as never);

    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-01' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('report_date', '2026-02-01');
    expect(data).toHaveProperty('sales_name', '山田 太郎');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-01' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 報告日未入力', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'report_date',
          message: expect.stringContaining('報告日'),
        }),
      ])
    );
  });

  it('異常系: 重複日報作成', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 既存の日報が存在することをモック
    const existingReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(existingReport as never);

    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-01' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details[0].message).toBe('この日付の日報は既に存在します');
  });
});

describe('GET /api/daily-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 日報一覧取得成功（自分の日報）', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.dailyReport.count).mockResolvedValue(2);

    const mockReports = [
      {
        id: 1,
        salesId: 1,
        reportDate: new Date('2026-02-01'),
        createdAt: new Date('2026-02-01T18:30:00Z'),
        updatedAt: new Date('2026-02-01T18:30:00Z'),
        sales: { name: '山田 太郎' },
        visitRecords: [{ id: 1 }, { id: 2 }],
        problems: [{ id: 1, comments: [] }],
        plans: [{ id: 1, comments: [] }],
      },
      {
        id: 2,
        salesId: 1,
        reportDate: new Date('2026-01-31'),
        createdAt: new Date('2026-01-31T19:00:00Z'),
        updatedAt: new Date('2026-01-31T19:00:00Z'),
        sales: { name: '山田 太郎' },
        visitRecords: [{ id: 3 }],
        problems: [],
        plans: [],
      },
    ];
    vi.mocked(prisma.dailyReport.findMany).mockResolvedValue(mockReports as never);

    const request = new Request('http://localhost/api/daily-reports?scope=own');

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0]).toHaveProperty('report_date', '2026-02-01');
    expect(data.data[0]).toHaveProperty('visit_count', 2);
    expect(data.data[0]).toHaveProperty('problem_count', 1);
    expect(data.pagination).toHaveProperty('total_count', 2);
  });

  it('正常系: scope=allは部長のみ許可', async () => {
    const mockUser = {
      id: 1,
      name: '山田 太郎',
      email: 'yamada@example.com',
      position: '一般',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/daily-reports?scope=all');

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
    expect(data.error.message).toContain('全ての日報にアクセスする権限がありません');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports');

    const response = await GET(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
