/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PUT, DELETE } from '@/app/api/comments/[id]/route';
import * as apiHelpers from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

// Prismaのモック
vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('PUT /api/comments/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: コメント更新成功', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockExistingComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5,
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
    };

    const mockUpdatedComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5,
      content: '5%までの値引きであれば承認します。明日の午後、詳細を相談しましょう。',
      createdAt: new Date('2026-02-01T20:30:00Z'),
      commenter: {
        id: 5,
        name: '佐藤 課長',
        position: '課長',
      },
    };

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as never);
    vi.mocked(prisma.comment.update).mockResolvedValue(mockUpdatedComment as never);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '5%までの値引きであれば承認します。明日の午後、詳細を相談しましょう。',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(401);
    expect(data.content).toBe(
      '5%までの値引きであれば承認します。明日の午後、詳細を相談しましょう。'
    );
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: コメントが見つからない', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/comments/999', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, {
      params: { id: '999' },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 他人のコメントを更新', async () => {
    const mockUser = {
      id: 6,
      name: '田中 次郎',
      email: 'tanaka@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockExistingComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5, // 別のユーザー
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
    };

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as never);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'テストコメント',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });

  it('異常系: コメント内容未入力', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockExistingComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5,
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
    };

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as never);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '',
      }),
    });

    const response = await PUT(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/comments/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: コメント削除成功', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockExistingComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5,
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
    };

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as never);
    vi.mocked(prisma.comment.delete).mockResolvedValue(mockExistingComment as never);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, {
      params: { id: '401' },
    });

    expect(response.status).toBe(204);
  });

  it('異常系: 認証トークンなし', async () => {
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(null);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('異常系: コメントが見つからない', async () => {
    const mockUser = {
      id: 5,
      name: '佐藤 課長',
      email: 'sato-k@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

    const request = new Request('http://localhost/api/comments/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, {
      params: { id: '999' },
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('異常系: 他人のコメントを削除', async () => {
    const mockUser = {
      id: 6,
      name: '田中 次郎',
      email: 'tanaka@example.com',
      position: '課長',
    };
    vi.spyOn(apiHelpers, 'getAuthenticatedUser').mockResolvedValue(mockUser as never);

    const mockExistingComment = {
      id: 401,
      targetType: 'PROBLEM' as const,
      targetId: 201,
      commenterId: 5, // 別のユーザー
      content: '5%までの値引きであれば承認します',
      createdAt: new Date('2026-02-01T20:30:00Z'),
    };

    vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockExistingComment as never);

    const request = new Request('http://localhost/api/comments/401', {
      method: 'DELETE',
    });

    const response = await DELETE(request as unknown as NextRequest, {
      params: { id: '401' },
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('ACCESS_DENIED');
  });
});
