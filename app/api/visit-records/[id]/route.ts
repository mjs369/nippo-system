import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { visitRecordSchema } from '@/lib/validators/visit-record';

import type { NextRequest } from 'next/server';

/**
 * PUT /api/visit-records/:id
 * 訪問記録を更新する
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const visitRecordId = parseInt(params.id, 10);

    if (isNaN(visitRecordId)) {
      return createErrorResponse('INVALID_PARAMETER', '訪問記録IDが不正です', 400);
    }

    // 訪問記録の取得と権限チェック
    const visitRecord = await prisma.visitRecord.findUnique({
      where: { id: visitRecordId },
      include: {
        dailyReport: {
          select: {
            salesId: true,
          },
        },
      },
    });

    if (!visitRecord) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定された訪問記録が見つかりません', 404);
    }

    // 本人の日報かチェック
    if (visitRecord.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'この訪問記録を編集する権限がありません', 403);
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

    // 訪問記録更新
    const updatedVisitRecord = await prisma.visitRecord.update({
      where: { id: visitRecordId },
      data: {
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
      id: updatedVisitRecord.id,
      daily_report_id: updatedVisitRecord.dailyReportId,
      customer_id: updatedVisitRecord.customerId,
      customer_name: updatedVisitRecord.customer.name,
      visit_content: updatedVisitRecord.visitContent,
      visit_start_time: updatedVisitRecord.visitStartTime,
      visit_end_time: updatedVisitRecord.visitEndTime,
      created_at: updatedVisitRecord.createdAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update visit record error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * DELETE /api/visit-records/:id
 * 訪問記録を削除する
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const visitRecordId = parseInt(params.id, 10);

    if (isNaN(visitRecordId)) {
      return createErrorResponse('INVALID_PARAMETER', '訪問記録IDが不正です', 400);
    }

    // 訪問記録の取得と権限チェック
    const visitRecord = await prisma.visitRecord.findUnique({
      where: { id: visitRecordId },
      include: {
        dailyReport: {
          select: {
            salesId: true,
          },
        },
      },
    });

    if (!visitRecord) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定された訪問記録が見つかりません', 404);
    }

    // 本人の日報かチェック
    if (visitRecord.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'この訪問記録を削除する権限がありません', 403);
    }

    // 訪問記録削除
    await prisma.visitRecord.delete({
      where: { id: visitRecordId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete visit record error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
