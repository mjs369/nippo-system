import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canEditDailyReport,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { visitRecordSchema } from '@/lib/validators/visit-record';

import type { NextRequest } from 'next/server';

/**
 * POST /api/daily-reports/:id/visit-records
 * 訪問記録を追加する
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // リクエストボディの取得とバリデーション
    const body: unknown = await request.json();

    // Zodバリデーション
    const validation = visitRecordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return createValidationErrorResponse(errors);
    }

    const { customer_id, visit_content, visit_start_time, visit_end_time } = validation.data;

    // 顧客の存在確認
    const customer = await prisma.customer.findUnique({
      where: { id: customer_id },
    });

    if (!customer) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定された顧客が見つかりません', 404);
    }

    // 訪問記録作成
    const visitRecord = await prisma.visitRecord.create({
      data: {
        dailyReportId,
        customerId: customer_id,
        visitContent: visit_content,
        visitStartTime: visit_start_time || null,
        visitEndTime: visit_end_time || null,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // レスポンス整形
    const response = {
      id: visitRecord.id,
      daily_report_id: visitRecord.dailyReportId,
      customer_id: visitRecord.customerId,
      customer_name: visitRecord.customer.name,
      visit_content: visitRecord.visitContent,
      visit_start_time: visitRecord.visitStartTime,
      visit_end_time: visitRecord.visitEndTime,
      created_at: visitRecord.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create visit record error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
