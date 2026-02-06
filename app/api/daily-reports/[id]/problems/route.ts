import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canEditDailyReport,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { problemSchema } from '@/lib/validators/problem';

import type { NextRequest } from 'next/server';

/**
 * POST /api/daily-reports/:id/problems
 * 日報にProblemを追加する
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
    const validation = problemSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return createValidationErrorResponse(errors);
    }

    const { content } = validation.data;

    // Problem作成
    const problem = await prisma.problem.create({
      data: {
        dailyReportId,
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
        },
      },
    });

    // レスポンス
    return NextResponse.json(
      {
        id: problem.id,
        daily_report_id: problem.dailyReportId,
        content: problem.content,
        comments: problem.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: problem.createdAt.toISOString(),
        updated_at: problem.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create problem error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
