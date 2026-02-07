/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { GET, PUT, DELETE } from '@/app/api/daily-reports/[id]/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyReport: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('GET /api/daily-reports/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 日報詳細取得成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canAccessDailyReport').mockResolvedValue({
      canAccess: true,
      dailyReport: mockDailyReport,
    } as never);

    const mockDetailedReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-01T18:30:00Z'),
      sales: { name: '山田 太郎' },
      visitRecords: [],
      problems: [],
      plans: [],
    };
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockDetailedReport as never);

    const request = new Request('http://localhost/api/daily-reports/1');
    const response = await GET(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('report_date', '2026-02-01');
    expect(data).toHaveProperty('sales_name', '山田 太郎');
  });

  it('異常系: 日報が存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);
    vi.spyOn(apiHelpers, 'canAccessDailyReport').mockResolvedValue({
      canAccess: false,
      dailyReport: null,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/999');
    const response = await GET(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: アクセス権限なし', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 2,
      salesId: 2, // 別のユーザーの日報
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canAccessDailyReport').mockResolvedValue({
      canAccess: false,
      dailyReport: mockDailyReport,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/2');
    const response = await GET(request as never, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports/1');
    const response = await GET(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 不正なID形式', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/daily-reports/invalid');
    const response = await GET(request as never, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_PARAMETER');
  });

  it('正常系: 訪問記録・Problem・Planを含む日報詳細取得', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canAccessDailyReport').mockResolvedValue({
      canAccess: true,
      dailyReport: mockDailyReport,
    } as never);

    const mockDetailedReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-01T18:30:00Z'),
      sales: { name: '山田 太郎' },
      visitRecords: [
        {
          id: 1,
          customerId: 10,
          customer: { name: '株式会社ABC商事' },
          visitContent: '訪問しました',
          visitStartTime: '10:00:00',
          visitEndTime: '11:30:00',
          createdAt: new Date('2026-02-01T18:30:00Z'),
        },
      ],
      problems: [
        {
          id: 1,
          content: '課題です',
          comments: [
            {
              id: 1,
              commenterId: 5,
              commenter: { name: '佐藤 課長', position: '課長' },
              content: 'コメントです',
              createdAt: new Date('2026-02-01T20:00:00Z'),
            },
          ],
          createdAt: new Date('2026-02-01T18:30:00Z'),
          updatedAt: new Date('2026-02-01T18:30:00Z'),
        },
      ],
      plans: [
        {
          id: 1,
          content: '明日の予定です',
          comments: [],
          createdAt: new Date('2026-02-01T18:30:00Z'),
          updatedAt: new Date('2026-02-01T18:30:00Z'),
        },
      ],
    };
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockDetailedReport as never);

    const request = new Request('http://localhost/api/daily-reports/1');
    const response = await GET(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.visit_records).toHaveLength(1);
    expect(data.visit_records[0].customer_name).toBe('株式会社ABC商事');
    expect(data.problems).toHaveLength(1);
    expect(data.problems[0].comments).toHaveLength(1);
    expect(data.plans).toHaveLength(1);
  });
});

describe('PUT /api/daily-reports/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 日報更新成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport,
    } as never);

    // 重複チェック: 既存の日報がないことをモック
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

    const mockUpdatedReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-02'),
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-02T10:00:00Z'),
      sales: { name: '山田 太郎' },
      visitRecords: [],
      problems: [],
      plans: [],
    };
    vi.mocked(prisma.dailyReport.update).mockResolvedValue(mockUpdatedReport as never);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-02' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('report_date', '2026-02-02');
  });

  it('異常系: 編集権限なし（他人の日報）', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 2,
      salesId: 2, // 別のユーザーの日報
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: mockDailyReport,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-02' }),
    });

    const response = await PUT(request as never, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 日報が存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: null,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/999', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-02' }),
    });

    const response = await PUT(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 報告日未入力', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: 重複日報への更新', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport,
    } as never);

    // 別の日報が既に同じ日付で存在する
    const existingReport = {
      id: 2, // 異なるID
      salesId: 1,
      reportDate: new Date('2026-02-02'),
    };
    vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(existingReport as never);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-02' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.details[0].message).toBe('この日付の日報は既に存在します');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-02' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});

describe('DELETE /api/daily-reports/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 日報削除成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 1,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport,
    } as never);

    vi.mocked(prisma.dailyReport.delete).mockResolvedValue(mockDailyReport as never);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '1' } });

    expect(response.status).toBe(204);
  });

  it('異常系: 削除権限なし（他人の日報）', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 2,
      salesId: 2, // 別のユーザーの日報
      reportDate: new Date('2026-02-01'),
    };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: mockDailyReport,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/2', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '2' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 日報が存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: null,
    } as never);

    const request = new Request('http://localhost/api/daily-reports/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: 不正なID形式', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/daily-reports/invalid', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_PARAMETER');
  });
});
