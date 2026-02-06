import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { planSchema } from '@/lib/validators/plan';

import type { NextRequest } from 'next/server';

/**
 * PUT /api/plans/:id
 * Planを更新する
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const planId = parseInt(params.id, 10);

    if (isNaN(planId)) {
      return createErrorResponse('INVALID_PARAMETER', 'Plan IDが不正です', 400);
    }

    // Plan取得
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        dailyReport: true,
      },
    });

    if (!plan) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたPlanが見つかりません', 404);
    }

    // 編集権限チェック（日報の作成者のみ）
    if (plan.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'このPlanを編集する権限がありません', 403);
    }

    // リクエストボディの取得とバリデーション
    const body: unknown = await request.json();

    // Zodバリデーション
    const validation = planSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return createValidationErrorResponse(errors);
    }

    const { content } = validation.data;

    // Plan更新
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        content,
      },
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
    });

    // レスポンス
    return NextResponse.json(
      {
        id: updatedPlan.id,
        daily_report_id: updatedPlan.dailyReportId,
        content: updatedPlan.content,
        comments: updatedPlan.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: updatedPlan.createdAt.toISOString(),
        updated_at: updatedPlan.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update plan error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * DELETE /api/plans/:id
 * Planを削除する
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const planId = parseInt(params.id, 10);

    if (isNaN(planId)) {
      return createErrorResponse('INVALID_PARAMETER', 'Plan IDが不正です', 400);
    }

    // Plan取得
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        dailyReport: true,
      },
    });

    if (!plan) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたPlanが見つかりません', 404);
    }

    // 編集権限チェック（日報の作成者のみ）
    if (plan.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'このPlanを削除する権限がありません', 403);
    }

    // Plan削除（コメントもカスケード削除される）
    await prisma.plan.delete({
      where: { id: planId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete plan error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
