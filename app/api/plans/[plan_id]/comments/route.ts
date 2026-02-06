import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
  canCommentOnPlan,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { commentSchema } from '@/lib/validators/comment';

import type { NextRequest } from 'next/server';

/**
 * POST /api/plans/{plan_id}/comments
 * Planへのコメント追加
 */
export async function POST(request: NextRequest, { params }: { params: { plan_id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // plan_idのパース
    const planId = parseInt(params.plan_id, 10);
    if (isNaN(planId)) {
      return createErrorResponse('INVALID_PARAMETER', '不正なPlan IDです', 400);
    }

    // リクエストボディの取得とバリデーション
    const body = (await request.json()) as unknown;
    const validationResult = commentSchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.errors.map((err) => ({
        field: err.path.join('.') || 'content',
        message: err.message,
      }));
      return createValidationErrorResponse(details);
    }

    const { content } = validationResult.data;

    // 権限チェック: 自分の部下の日報のPlanにのみコメント可能
    const { canComment, plan } = await canCommentOnPlan(user.id, planId);

    if (!canComment || !plan) {
      return createErrorResponse(
        'ACCESS_DENIED',
        'コメントを投稿する権限がありません。上長のみがコメントを投稿できます。',
        403
      );
    }

    // コメントを作成
    const comment = await prisma.comment.create({
      data: {
        targetType: 'PLAN',
        targetId: planId,
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
    return createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバー内部エラーが発生しました', 500);
  }
}
