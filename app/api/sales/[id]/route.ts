import { NextResponse } from 'next/server';

import { createErrorResponse, getAuthenticatedUser } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

/**
 * GET /api/sales/:id
 * 営業担当者詳細を取得する
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const salesId = parseInt(params.id, 10);

    if (isNaN(salesId)) {
      return createErrorResponse('INVALID_PARAMETER', '営業担当者IDが不正です', 400);
    }

    // 営業担当者詳細取得
    const sales = await prisma.sales.findUnique({
      where: { id: salesId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            name: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            department: true,
            position: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!sales) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定された営業担当者が見つかりません', 404);
    }

    // レスポンス整形
    const response = {
      id: sales.id,
      name: sales.name,
      email: sales.email,
      department: sales.department,
      position: sales.position,
      manager_id: sales.managerId,
      manager_name: sales.manager?.name || null,
      subordinates: sales.subordinates.map((sub) => ({
        id: sub.id,
        name: sub.name,
        department: sub.department,
        position: sub.position,
      })),
      created_at: sales.createdAt.toISOString(),
      updated_at: sales.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get sales detail error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
