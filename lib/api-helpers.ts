import { NextResponse } from 'next/server';

import { extractTokenFromHeader, verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import type { NextRequest } from 'next/server';

/**
 * APIエラーレスポンスを生成する
 */
export function createErrorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * バリデーションエラーレスポンスを生成する
 */
export function createValidationErrorResponse(details: Array<{ field: string; message: string }>) {
  return NextResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'バリデーションエラー',
        details,
      },
    },
    { status: 422 }
  );
}

/**
 * リクエストから認証ユーザー情報を取得する
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.sales.findUnique({
      where: { id: decoded.userId },
    });

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * ユーザーが日報にアクセスできるかチェックする
 * - 本人の日報
 * - 自分が上長の部下の日報
 */
export async function canAccessDailyReport(userId: number, dailyReportId: number) {
  const dailyReport = await prisma.dailyReport.findUnique({
    where: { id: dailyReportId },
    include: {
      sales: {
        select: {
          id: true,
          managerId: true,
        },
      },
    },
  });

  if (!dailyReport) {
    return { canAccess: false, dailyReport: null };
  }

  // 本人の日報
  if (dailyReport.salesId === userId) {
    return { canAccess: true, dailyReport };
  }

  // 自分が上長の部下の日報
  if (dailyReport.sales.managerId === userId) {
    return { canAccess: true, dailyReport };
  }

  return { canAccess: false, dailyReport };
}

/**
 * ユーザーが日報を編集できるかチェックする（本人のみ）
 */
export async function canEditDailyReport(userId: number, dailyReportId: number) {
  const dailyReport = await prisma.dailyReport.findUnique({
    where: { id: dailyReportId },
  });

  if (!dailyReport) {
    return { canEdit: false, dailyReport: null };
  }

  return { canEdit: dailyReport.salesId === userId, dailyReport };
}

/**
 * ユーザーが管理者（部長以上）かチェックする
 */
export function isManager(user: { position: string | null }): boolean {
  const managerPositions = ['部長', '課長'];
  return user.position ? managerPositions.includes(user.position) : false;
}

/**
 * ユーザーが全日報にアクセスできるかチェックする（管理者のみ）
 */
export function canAccessAllReports(user: { position: string | null }): boolean {
  // 部長のみ全日報にアクセス可能
  return user.position === '部長';
}

/**
 * ユーザーが特定のProblemにコメントできるかチェックする
 * - 上長（課長以上）のみコメント可能
 * - かつ、自分の部下の日報のProblemにのみコメント可能
 */
export async function canCommentOnProblem(userId: number, problemId: number) {
  // Problemを取得し、日報の作成者情報も含める
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      dailyReport: {
        include: {
          sales: {
            select: {
              managerId: true,
            },
          },
        },
      },
    },
  });

  if (!problem) {
    return { canComment: false, problem: null };
  }

  // 日報の作成者の上長である場合のみコメント可能
  const isSubordinatesReport = problem.dailyReport.sales.managerId === userId;

  return { canComment: isSubordinatesReport, problem };
}

/**
 * ユーザーが特定のPlanにコメントできるかチェックする
 * - 上長（課長以上）のみコメント可能
 * - かつ、自分の部下の日報のPlanにのみコメント可能
 */
export async function canCommentOnPlan(userId: number, planId: number) {
  // Planを取得し、日報の作成者情報も含める
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      dailyReport: {
        include: {
          sales: {
            select: {
              managerId: true,
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return { canComment: false, plan: null };
  }

  // 日報の作成者の上長である場合のみコメント可能
  const isSubordinatesReport = plan.dailyReport.sales.managerId === userId;

  return { canComment: isSubordinatesReport, plan };
}
