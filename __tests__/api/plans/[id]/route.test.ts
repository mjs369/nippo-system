/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PUT, DELETE } from '@/app/api/plans/[id]/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    plan: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('PUT /api/plans/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: Plan更新成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    // 既存のPlanを取得
    const mockPlan = {
      id: 1,
      dailyReportId: 1,
      content: '旧内容',
      dailyReport: { id: 1, salesId: 1, reportDate: new Date('2026-02-01') },
    };
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan as never);

    // Plan更新のモック
    const mockUpdatedPlan = {
      id: 1,
      dailyReportId: 1,
      content: '新しい内容',
      createdAt: new Date('2026-02-01T18:30:00Z'),
      updatedAt: new Date('2026-02-01T19:00:00Z'),
      comments: [],
    };
    vi.mocked(prisma.plan.update).mockResolvedValue(mockUpdatedPlan as never);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '新しい内容' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id', 1);
    expect(data).toHaveProperty('content', '新しい内容');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: Planが存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.plan.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/plans/999', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await PUT(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 編集権限なし（他人の日報のPlan）', async () => {
    const mockUser = { id: 2, name: '鈴木 一郎', email: 'suzuki@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockPlan = {
      id: 1,
      dailyReportId: 1,
      content: '旧内容',
      dailyReport: { id: 1, salesId: 1, reportDate: new Date('2026-02-01') }, // salesId=1（別ユーザー）
    };
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan as never);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'テスト' }),
    });

    const response = await PUT(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });
});

describe('DELETE /api/plans/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: Plan削除成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockPlan = {
      id: 1,
      dailyReportId: 1,
      content: 'テスト',
      dailyReport: { id: 1, salesId: 1, reportDate: new Date('2026-02-01') },
    };
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan as never);
    vi.mocked(prisma.plan.delete).mockResolvedValue(mockPlan as never);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '1' } });

    expect(response.status).toBe(204);
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: Planが存在しない', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.plan.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/plans/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 削除権限なし（他人の日報のPlan）', async () => {
    const mockUser = { id: 2, name: '鈴木 一郎', email: 'suzuki@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockPlan = {
      id: 1,
      dailyReportId: 1,
      content: 'テスト',
      dailyReport: { id: 1, salesId: 1, reportDate: new Date('2026-02-01') },
    };
    vi.mocked(prisma.plan.findUnique).mockResolvedValue(mockPlan as never);

    const request = new Request('http://localhost/api/plans/1', {
      method: 'DELETE',
    });

    const response = await DELETE(request as never, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });
});
