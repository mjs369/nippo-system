import { NextResponse } from 'next/server';

import {
  createErrorResponse,
  createValidationErrorResponse,
  getAuthenticatedUser,
} from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { commentSchema } from '@/lib/validators/comment';

import type { NextRequest } from 'next/server';

/**
 * PUT /api/comments/{id}
 * コメント更新
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // comment_idのパース
    const commentId = parseInt(params.id, 10);
    if (isNaN(commentId)) {
      return createErrorResponse('INVALID_PARAMETER', '不正なコメントIDです', 400);
    }

    // コメントの存在確認と権限チェック
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたコメントが見つかりません', 404);
    }

    // 作成者のみ更新可能
    if (existingComment.commenterId !== user.id) {
      return createErrorResponse(
        'ACCESS_DENIED',
        'このコメントを更新する権限がありません',
        403
      );
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

    // コメントを更新
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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
        id: updatedComment.id,
        target_type: updatedComment.targetType,
        target_id: updatedComment.targetId,
        commenter_id: updatedComment.commenterId,
        commenter_name: updatedComment.commenter.name,
        commenter_position: updatedComment.commenter.position,
        content: updatedComment.content,
        created_at: updatedComment.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('コメント更新エラー:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバー内部エラーが発生しました',
      500
    );
  }
}

/**
 * DELETE /api/comments/{id}
 * コメント削除
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 認証チェック
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('UNAUTHORIZED', '認証が必要です', 401);
    }

    // comment_idのパース
    const commentId = parseInt(params.id, 10);
    if (isNaN(commentId)) {
      return createErrorResponse('INVALID_PARAMETER', '不正なコメントIDです', 400);
    }

    // コメントの存在確認と権限チェック
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return createErrorResponse('RESOURCE_NOT_FOUND', '指定されたコメントが見つかりません', 404);
    }

    // 作成者のみ削除可能
    if (existingComment.commenterId !== user.id) {
      return createErrorResponse(
        'ACCESS_DENIED',
        'このコメントを削除する権限がありません',
        403
      );
    }

    // コメントを削除
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // 204 No Content を返却
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('コメント削除エラー:', error);
    return createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバー内部エラーが発生しました',
      500
    );
  }
}
