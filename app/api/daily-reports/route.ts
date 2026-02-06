import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canAccessAllReports,
} from '@/lib/api-helpers';
import { parseReportDate, formatReportDate } from '@/lib/date-helpers';
import { prisma } from '@/lib/prisma';
import { dailyReportSchema } from '@/lib/validators/daily-report';

import type { Prisma } from '@prisma/client';
import type { NextRequest } from 'next/server';

/**
 * GET /api/daily-reports
 * 日報一覧を取得する
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
    const scope = searchParams.get('scope') || 'own';
    const salesId = searchParams.get('sales_id');
    const customerId = searchParams.get('customer_id');
    const reportDateFrom = searchParams.get('report_date_from');
    const reportDateTo = searchParams.get('report_date_to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '10', 10), 100);
    const sort = searchParams.get('sort') || 'report_date';
    const order = searchParams.get('order') || 'desc';

    // WHERE条件の構築
    const where: Prisma.DailyReportWhereInput = {};

    // scope による絞り込みと権限チェック
    if (scope === 'own') {
      where.salesId = user.id;
    } else if (scope === 'subordinates') {
      // 自分が上長の部下の日報
      const subordinates = await prisma.sales.findMany({
        where: { managerId: user.id },
        select: { id: true },
      });
      const subordinateIds = subordinates.map((s) => s.id);
      where.salesId = { in: subordinateIds };
    } else if (scope === 'all') {
      // 全ての日報（部長のみ許可）
      if (!canAccessAllReports(user)) {
        return createErrorResponse(
          'ACCESS_DENIED',
          '全ての日報にアクセスする権限がありません',
          403
        );
      }
      // where条件を追加しない（全件取得）
    }

    // 営業担当者での絞り込み
    if (salesId) {
      where.salesId = parseInt(salesId, 10);
    }

    // 顧客での絞り込み
    if (customerId) {
      where.visitRecords = {
        some: {
          customerId: parseInt(customerId, 10),
        },
      };
    }

    // 報告日での絞り込み
    if (reportDateFrom || reportDateTo) {
      where.reportDate = {};
      if (reportDateFrom) {
        where.reportDate.gte = parseReportDate(reportDateFrom);
      }
      if (reportDateTo) {
        where.reportDate.lte = parseReportDate(reportDateTo);
      }
    }

    // ソート条件の構築
    const orderBy: Prisma.DailyReportOrderByWithRelationInput = {};
    if (sort === 'report_date') {
      orderBy.reportDate = order === 'asc' ? 'asc' : 'desc';
    } else if (sort === 'updated_at') {
      orderBy.updatedAt = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.reportDate = 'desc';
    }

    // 総件数取得
    const totalCount = await prisma.dailyReport.count({ where });

    // ページネーション計算
    const totalPages = Math.ceil(totalCount / perPage);
    const skip = (page - 1) * perPage;

    // 日報一覧取得
    const dailyReports = await prisma.dailyReport.findMany({
      where,
      include: {
        sales: {
          select: {
            name: true,
          },
        },
        visitRecords: {
          select: {
            id: true,
          },
        },
        problems: {
          select: {
            id: true,
            comments: {
              select: {
                id: true,
              },
            },
          },
        },
        plans: {
          select: {
            id: true,
            comments: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // レスポンス整形
    const data = dailyReports.map((report) => {
      const hasComments =
        report.problems.some((p) => p.comments.length > 0) ||
        report.plans.some((p) => p.comments.length > 0);

      return {
        id: report.id,
        sales_id: report.salesId,
        sales_name: report.sales.name,
        report_date: formatReportDate(report.reportDate),
        visit_count: report.visitRecords.length,
        problem_count: report.problems.length,
        plan_count: report.plans.length,
        has_comments: hasComments,
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      };
    });

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
    console.error('Get daily reports error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * POST /api/daily-reports
 * 日報を作成する
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // リクエストボディの取得とバリデーション
    const body: unknown = await request.json();

    // Zodバリデーション
    const validation = dailyReportSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return createValidationErrorResponse(errors);
    }

    const { report_date } = validation.data;

    // 日付パース
    let reportDate: Date;
    try {
      reportDate = parseReportDate(report_date);
    } catch (error) {
      return createValidationErrorResponse([
        { field: 'report_date', message: '報告日の形式が正しくありません' },
      ]);
    }

    // 重複チェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        salesId_reportDate: {
          salesId: user.id,
          reportDate,
        },
      },
    });

    if (existingReport) {
      return createValidationErrorResponse([
        { field: 'report_date', message: 'この日付の日報は既に存在します' },
      ]);
    }

    // 日報作成
    const dailyReport = await prisma.dailyReport.create({
      data: {
        salesId: user.id,
        reportDate,
      },
      include: {
        sales: {
          select: {
            name: true,
          },
        },
      },
    });

    // レスポンス
    return NextResponse.json(
      {
        id: dailyReport.id,
        sales_id: dailyReport.salesId,
        sales_name: dailyReport.sales.name,
        report_date: formatReportDate(dailyReport.reportDate),
        visit_records: [],
        problems: [],
        plans: [],
        created_at: dailyReport.createdAt.toISOString(),
        updated_at: dailyReport.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create daily report error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
