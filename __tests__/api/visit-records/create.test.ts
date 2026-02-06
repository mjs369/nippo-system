/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/daily-reports/[id]/visit-records/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
    visitRecord: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/daily-reports/:id/visit-records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: 訪問記録追加成功', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 100,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport as never,
    });

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

    const mockVisitRecord = {
      id: 200,
      dailyReportId: 100,
      customerId: 10,
      visitContent: '新商品のプレゼンテーションを実施',
      visitStartTime: '10:00:00',
      visitEndTime: '11:30:00',
      createdAt: new Date('2026-02-01T09:30:00Z'),
      customer: {
        name: '株式会社ABC商事',
      },
    };

    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as never);
    vi.mocked(prisma.visitRecord.create).mockResolvedValue(mockVisitRecord as never);

    const request = new Request('http://localhost/api/daily-reports/100/visit-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 10,
        visit_content: '新商品のプレゼンテーションを実施',
        visit_start_time: '10:00:00',
        visit_end_time: '11:30:00',
      }),
    });

    const response = await POST(request as unknown as NextRequest, { params: { id: '100' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(200);
    expect(data.customer_id).toBe(10);
    expect(data.customer_name).toBe('株式会社ABC商事');
    expect(data.visit_content).toBe('新商品のプレゼンテーションを実施');
  });

  it('異常系: 顧客ID未選択', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 100,
      salesId: 1,
      reportDate: new Date('2026-02-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: true,
      dailyReport: mockDailyReport as never,
    });

    const request = new Request('http://localhost/api/daily-reports/100/visit-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visit_content: '訪問内容',
      }),
    });

    const response = await POST(request as unknown as NextRequest, { params: { id: '100' } });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: 他人の日報に訪問記録を追加', async () => {
    const mockUser = { id: 1, name: '山田 太郎', email: 'yamada@example.com', position: '一般' };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockDailyReport = {
      id: 100,
      salesId: 2, // 異なるユーザーID
      reportDate: new Date('2026-02-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(apiHelpers, 'canEditDailyReport').mockResolvedValue({
      canEdit: false,
      dailyReport: mockDailyReport as never,
    });

    const request = new Request('http://localhost/api/daily-reports/100/visit-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 10,
        visit_content: '訪問内容',
      }),
    });

    const response = await POST(request as unknown as NextRequest, { params: { id: '100' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/daily-reports/100/visit-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: 10,
        visit_content: '訪問内容',
      }),
    });

    const response = await POST(request as unknown as NextRequest, { params: { id: '100' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
