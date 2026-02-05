/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/daily-reports/[id]/plans/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    plan: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/daily-reports/:id/plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: Plan追加成功', async () => {
    // モックユーザー
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 編集権限チェックのモック
    const mockDailyReport = { id: 1, salesId: 1, reportDate: new Date('2026-02-01') };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport as never,
    });

    // Plan作成のモック
    const mockPlan = {
      id: 1,
      dailyReportId: 1,
      content: 'ABC商事へ見積書を提出する予定です。',
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-01T18:30:00Z'),
      comments: [],
    };
    vi.mocked(prisma.plan.create).mockResolvedValue(mockPlan as never);

    const request = new Request('http://localhost/api/daily-reports/1/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'ABC商事へ見積書を提出する予定です。' }),
    });

    const response = await POST(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('daily_report_id', 1);
    expect(data).toHaveProperty('content', 'ABC商事へ見積書を提出する予定です。');
    expect(data).toHaveProperty('comments');
    expect(Array.isArray(data.comments)).toBe(true);
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports/1/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await POST(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: content未入力', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = { id: 1, salesId: 1, reportDate: new Date('2026-02-01') };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport as never,
    });

    const request = new Request('http://localhost/api/daily-reports/1/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: 編集権限なし（他人の日報）', async () => {
    const mockUser = { id: 2, name: '鈴木 一郎', email: 'suzuki@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = { id: 1, salesId: 1, reportDate: new Date('2026-02-01') };
    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: mockDailyReport as never,
    });

    const request = new Request('http://localhost/api/daily-reports/1/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await POST(request as never, { params: { id: '1' } });
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
    });

    const request = new Request('http://localhost/api/daily-reports/999/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await POST(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
