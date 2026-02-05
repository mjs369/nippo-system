import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { problemSchema } from '@/lib/validators/problem';

import type { NextRequest } from 'next/server';

/**
 * PUT /api/problems/:id
 * Problemを更新する
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const problemId = parseInt(params.id, 10);

    if (isNaN(problemId)) {
      return createErrorResponse('INVALID_PARAMETER', 'Problem IDが不正です', 400);
    }

    // Problem取得
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        dailyReport: true,
      },
    });

    if (!problem) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたProblemが見つかりません', 404);
    }

    // 編集権限チェック（日報の作成者のみ）
    if (problem.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'このProblemを編集する権限がありません', 403);
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

    // Problem更新
    const updatedProblem = await prisma.problem.update({
      where: { id: problemId },
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
        id: updatedProblem.id,
        daily_report_id: updatedProblem.dailyReportId,
        content: updatedProblem.content,
        comments: updatedProblem.comments.map((c) => ({
          id: c.id,
          commenter_id: c.commenterId,
          commenter_name: c.commenter.name,
          commenter_position: c.commenter.position,
          content: c.content,
          created_at: c.createdAt.toISOString(),
        })),
        created_at: updatedProblem.createdAt.toISOString(),
        updated_at: updatedProblem.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update problem error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}

/**
 * DELETE /api/problems/:id
 * Problemを削除する
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    const problemId = parseInt(params.id, 10);

    if (isNaN(problemId)) {
      return createErrorResponse('INVALID_PARAMETER', 'Problem IDが不正です', 400);
    }

    // Problem取得
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        dailyReport: true,
      },
    });

    if (!problem) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたProblemが見つかりません', 404);
    }

    // 編集権限チェック（日報の作成者のみ）
    if (problem.dailyReport.salesId !== user.id) {
      return createErrorResponse('ACCESS_DENIED', 'このProblemを削除する権限がありません', 403);
    }

    // Problem削除（コメントもカスケード削除される）
    await prisma.problem.delete({
      where: { id: problemId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete problem error:', error);

    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
