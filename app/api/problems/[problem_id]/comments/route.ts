import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canCommentOnProblem,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { commentSchema } from '@/lib/validators/comment';

import type { NextRequest } from 'next/server';

/**
 * POST /api/problems/{problem_id}/comments
 * Problemへのコメント追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { problem_id: string } }
) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // problem_idのパース
    const problemId = parseInt(params.problem_id, 10);
    if (isNaN(problemId)) {
      return createErrorResponse('INVALID_PARAMETER', '不正なProblem IDです', 400);
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();
    const validationResult = commentSchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join('.') || 'content',
        message: err.message,
      }));
      return createValidationErrorResponse(details);
    }

    const { content } = validationResult.data;

    // 権限チェック: 自分の部下の日報のProblemにのみコメント可能
    const { canComment, problem } = await canCommentOnProblem(user.id, problemId);

    if (!canComment || !problem) {
      return createErrorResponse(
        'ACCESS_DENIED',
        'コメントを投稿する権限がありません。上長のみがコメントを投稿できます。',
        403
      );
    }

    // コメントを作成
    const comment = await prisma.comment.create({
      data: {
        targetType: 'PROBLEM',
        targetId: problemId,
        commenterId: user.id,
        content,
      },
      include: {
        commenter: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
    });

    // レスポンスを返却
    return NextResponse.json(
      {
        id: comment.id,
        target_type: comment.targetType,
        target_id: comment.targetId,
        commenter_id: comment.commenterId,
        commenter_name: comment.commenter.name,
        commenter_position: comment.commenter.position,
        content: comment.content,
        created_at: comment.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('コメント作成エラー:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバー内部エラーが発生しました',
      500
    );
  }
}
