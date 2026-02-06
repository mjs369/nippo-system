import { NextResponse } from 'next/server';

import { createErrorResponse, getAuthenticatedUser } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';

/**
 * GET /api/sales
 * 営業担当者一覧を取得する
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const position = searchParams.get('position');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '10', 10), 100);

    // WHERE条件の構築
    const where: Prisma.SalesWhereInput = {};

    if (department) {
      where.department = department;
    }

    if (position) {
      where.position = position;
    }

    // 総件数取得
    const totalCount = await prisma.sales.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / perPage);
    const skip = (page - 1) * perPage;

    // 営業担当者一覧取得
    const salesList = await prisma.sales.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true,
        managerId: true,
        manager: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      skip,
      take: perPage,
    });

    // レスポンス整形
    const data = salesList.map((sales) => ({
      id: sales.id,
      name: sales.name,
      email: sales.email,
      department: sales.department,
      position: sales.position,
      manager_id: sales.managerId,
      manager_name: sales.manager?.name || null,
    }));

    return NextResponse.json(
      {
        data,
        pagination: {
          current_page: page,
          per_page: perPage,
          total_pages: totalPages,
          total_count: totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get sales list error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
