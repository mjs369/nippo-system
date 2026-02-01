import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canAccessDailyReport,
  canEditDailyReport,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

/**
 * GET /api/daily-reports/:id
 * 日報詳細を取得する
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const dailyReportId = parseInt(params.id, 10);

    if (isNaN(dailyReportId)) {
      return createErrorResponse('INVALID_PARAMETER', '日報IDが不正です', 400);
    }

    // アクセス権限チェック
    const { canAccess, dailyReport } = await canAccessDailyReport(user.id, dailyReportId);

    if (!canAccess || !dailyReport) {
      if (!dailyReport) {
        return createErrorResponse('RESOURCE_NOT_FOUND', '指定された日報が見つかりません', 404);
      }
      return createErrorResponse('ACCESS_DENIED', 'この日報にアクセスする権限がありません', 403);
    }

    // 日報詳細取得
    const detailedReport = await prisma.dailyReport.findUnique({
      where: { id: dailyReportId },
      include: {
        sales: {
          select: {
            name: true,
          },
        },
        visitRecords: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        problems: {
          include: {
            comments: {
              include: {
                commenter: {
                  select: {
                    name: true,
                    position: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        plans: {
          include: {
            comments: {
              include: {
                commenter: {
                  select: {
                    name: true,
                    position: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!detailedReport) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定された日報が見つかりません', 404);
    }

    // レスポンス整形
    const response = {
      id: detailedReport.id,
      sales_id: detailedReport.salesId,
      sales_name: detailedReport.sales.name,
      report_date: detailedReport.reportDate.toISOString().split('T')[0],
      visit_records: detailedReport.visitRecords.map((vr) => ({
        id: vr.id,
        customer_id: vr.customerId,
        customer_name: vr.customer.name,
        visit_content: vr.visitContent,
        visit_start_time: vr.visitStartTime,
        visit_end_time: vr.visitEndTime,
        created_at: vr.createdAt.toISOString(),
      })),
      problems: detailedReport.problems.map((p) => ({
        id: p.id,
        content: p.content,
        comments: p.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      plans: detailedReport.plans.map((p) => ({
        id: p.id,
        content: p.content,
        comments: p.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      created_at: detailedReport.createdAt.toISOString(),
      updated_at: detailedReport.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get daily report detail error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * PUT /api/daily-reports/:id
 * 日報を更新する
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const dailyReportId = parseInt(params.id, 10);

    if (isNaN(dailyReportId)) {
      return createErrorResponse('INVALID_PARAMETER', '日報IDが不正です', 400);
    }

    // 編集権限チェック（本人のみ）
    const { canEdit, dailyReport } = await canEditDailyReport(user.id, dailyReportId);

    if (!canEdit || !dailyReport) {
      if (!dailyReport) {
        return createErrorResponse('RESOURCE_NOT_FOUND', '指定された日報が見つかりません', 404);
      }
      return createErrorResponse('ACCESS_DENIED', 'この日報を編集する権限がありません', 403);
    }

    // リクエストボディの取得
    const body = (await request.json()) as { report_date?: string };
    const { report_date } = body;

    // バリデーション
    const errors: Array<{ field: string; message: string }> = [];

    if (!report_date) {
      errors.push({ field: 'report_date', message: '報告日を入力してください' });
    }

    if (errors.length > 0) {
      return createValidationErrorResponse(errors);
    }

    // 日付フォーマットチェック
    if (!report_date) {
      return createValidationErrorResponse([
        { field: 'report_date', message: '報告日を入力してください' },
      ]);
    }

    const reportDate = new Date(report_date);
    if (isNaN(reportDate.getTime())) {
      return createValidationErrorResponse([
        { field: 'report_date', message: '報告日の形式が正しくありません' },
      ]);
    }

    // 重複チェック（自分以外で同じ日付の日報があるか）
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        salesId_reportDate: {
          salesId: user.id,
          reportDate,
        },
      },
    });

    if (existingReport && existingReport.id !== dailyReportId) {
      return createValidationErrorResponse([
        { field: 'report_date', message: 'この日付の日報は既に存在します' },
      ]);
    }

    // 日報更新
    const updatedReport = await prisma.dailyReport.update({
      where: { id: dailyReportId },
      data: {
        reportDate,
      },
      include: {
        sales: {
          select: {
            name: true,
          },
        },
        visitRecords: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        problems: {
          include: {
            comments: {
              include: {
                commenter: {
                  select: {
                    name: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
        plans: {
          include: {
            comments: {
              include: {
                commenter: {
                  select: {
                    name: true,
                    position: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // レスポンス整形
    const response = {
      id: updatedReport.id,
      sales_id: updatedReport.salesId,
      sales_name: updatedReport.sales.name,
      report_date: updatedReport.reportDate.toISOString().split('T')[0],
      visit_records: updatedReport.visitRecords.map((vr) => ({
        id: vr.id,
        customer_id: vr.customerId,
        customer_name: vr.customer.name,
        visit_content: vr.visitContent,
        visit_start_time: vr.visitStartTime,
        visit_end_time: vr.visitEndTime,
        created_at: vr.createdAt.toISOString(),
      })),
      problems: updatedReport.problems.map((p) => ({
        id: p.id,
        content: p.content,
        comments: p.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      plans: updatedReport.plans.map((p) => ({
        id: p.id,
        content: p.content,
        comments: p.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      created_at: updatedReport.createdAt.toISOString(),
      updated_at: updatedReport.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update daily report error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * DELETE /api/daily-reports/:id
 * 日報を削除する（関連データもカスケード削除）
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const dailyReportId = parseInt(params.id, 10);

    if (isNaN(dailyReportId)) {
      return createErrorResponse('INVALID_PARAMETER', '日報IDが不正です', 400);
    }

    // 編集権限チェック（本人のみ）
    const { canEdit, dailyReport } = await canEditDailyReport(user.id, dailyReportId);

    if (!canEdit || !dailyReport) {
      if (!dailyReport) {
        return createErrorResponse('RESOURCE_NOT_FOUND', '指定された日報が見つかりません', 404);
      }
      return createErrorResponse('ACCESS_DENIED', 'この日報を削除する権限がありません', 403);
    }

    // 日報削除（カスケード削除）
    await prisma.dailyReport.delete({
      where: { id: dailyReportId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete daily report error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
