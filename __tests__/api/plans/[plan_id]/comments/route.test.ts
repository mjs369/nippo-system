/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/plans/[plan_id]/comments/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      create: vi.fn(),
    },
  },
}));

describe('POST /api/plans/:plan_id/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: Planへのコメント追加成功', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockPlan = {
      id: 101,
      dailyReportId: 100,
      content: 'ABC商事へ見積書提出',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(apiHelpers, 'canCommentOnPlan').mockResolvedValue({
      canComment: true,
      plan: mockPlan as never,
    });

    const mockComment = {
      id: 402,
      targetType: 'PLAN' as const,
      targetId: 101,
      commenterId: 5,
      content: '見積書の提出、頑張ってください',
      createdAt: new Date('2026-02-01T20:35:00Z'),
      commenter: {
        id: 5,
        name: '佐藤 課長',
        position: '課長',
      },
    };

    vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as never);

    const request = new Request('http://localhost/api/plans/101/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '見積書の提出、頑張ってください',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { plan_id: '101' },
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(402);
    expect(data.target_type).toBe('PLAN');
    expect(data.target_id).toBe(101);
    expect(data.commenter_id).toBe(5);
    expect(data.commenter_name).toBe('佐藤 課長');
    expect(data.content).toBe('見積書の提出、頑張ってください');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/plans/101/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { plan_id: '101' },
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: コメント内容未入力', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/plans/101/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { plan_id: '101' },
    });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: コメント権限なし（部下の日報でない）', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.spyOn(apiHelpers, 'canCommentOnPlan').mockResolvedValue({
      canComment: false,
      plan: null,
    });

    const request = new Request('http://localhost/api/plans/101/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { plan_id: '101' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 不正なPlan ID', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/plans/invalid/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { plan_id: 'invalid' },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_PARAMETER');
  });
});
