/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { POST } from '@/app/api/problems/[problem_id]/comments/route';
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

describe('POST /api/problems/:problem_id/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: Problemへのコメント追加成功', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockProblem = {
      id: 201,
      dailyReportId: 100,
      content: 'GHI工業との価格交渉について',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(apiHelpers, 'canCommentOnProblem').mockResolvedValue({
      canComment: true,
      problem: mockProblem as never,
    });

    const mockComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5,
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
      commenter: {
        id: 5,
        name: '佐藤 課長',
        position: '課長',
      },
    };

    vi.mocked(prisma.comment.create).mockResolvedValue(mockComment as never);

    const request = new Request('http://localhost/api/problems/201/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '5%までの値引きであれば承認します',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { problem_id: '201' },
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(401);
    expect(data.target_type).toBe('PROBLEM');
    expect(data.target_id).toBe(201);
    expect(data.commenter_id).toBe(5);
    expect(data.commenter_name).toBe('佐藤 課長');
    expect(data.content).toBe('5%までの値引きであれば承認します');
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/problems/201/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { problem_id: '201' },
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

    const request = new Request('http://localhost/api/problems/201/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { problem_id: '201' },
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

    vi.spyOn(apiHelpers, 'canCommentOnProblem').mockResolvedValue({
      canComment: false,
      problem: null,
    });

    const request = new Request('http://localhost/api/problems/201/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { problem_id: '201' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: 不正なProblem ID', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const request = new Request('http://localhost/api/problems/invalid/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await POST(request as unknown as NextRequest, {
      params: { problem_id: 'invalid' },
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_PARAMETER');
  });
});
