/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PUT, DELETE } from '@/app/api/visit-records/[id]/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    visitRecord: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('PUT /api/visit-records/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 訪問記録更新成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '訪問内容',
      visitStartTime: '10:00:00',
      visitEndTime: '11:00:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      dailyReport: {
        salesId: 1,
      },
    };

    const mockCustomer = {
      id: 10,
      name: '株式会社ABC商事',
      contactPerson: '山田 一郎',
      phone: '03-1234-5678',
      address: '東京都千代田区丸の内1-1-1',
      industry: '卸売業',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdatedVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '更新された訪問内容',
      visitStartTime: '10:00:00',
      visitEndTime: '12:00:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      customer: {
        name: '株式会社ABC商事',
      },
    };

    vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(mockVisitRecord as never);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as never);
    vi.mocked(prisma.visitRecord.update).mockResolvedValue(mockUpdatedVisitRecord as never);

    const request = new Request('http://localhost/api/visit-records/200', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 10,
        visit_content: '更新された訪問内容',
        visit_start_time: '10:00:00',
        visit_end_time: '12:00:00',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, { params: { id: '200' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(200);
    expect(data.visit_content).toBe('更新された訪問内容');
  });

  it('異常系: 他人の訪問記録を更新', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '訪問内容',
      visitStartTime: '10:00:00',
      visitEndTime: '11:00:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      dailyReport: {
        salesId: 2, // 異なるユーザーID
      },
    };

    vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(mockVisitRecord as never);

    const request = new Request('http://localhost/api/visit-records/200', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 10,
        visit_content: '訪問内容',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, { params: { id: '200' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });
});

describe('DELETE /api/visit-records/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 訪問記録削除成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '訪問内容',
      visitStartTime: '10:00:00',
      visitEndTime: '11:00:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      dailyReport: {
        salesId: 1,
      },
    };

    vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(mockVisitRecord as never);
    vi.mocked(prisma.visitRecord.delete).mockResolvedValue(mockVisitRecord as never);

    const request = new Request('http://localhost/api/visit-records/200', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, { params: { id: '200' } });

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it('異常系: 他人の訪問記録を削除', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '訪問内容',
      visitStartTime: '10:00:00',
      visitEndTime: '11:00:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      dailyReport: {
        salesId: 2, // 異なるユーザーID
      },
    };

    vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(mockVisitRecord as never);

    const request = new Request('http://localhost/api/visit-records/200', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, { params: { id: '200' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/visit-records/200', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, { params: { id: '200' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
