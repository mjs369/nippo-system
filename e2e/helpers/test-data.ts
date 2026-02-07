import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * テスト用の日報データを作成
 * @param salesEmail 営業担当者のメールアドレス
 * @param reportDate 報告日
 * @returns 作成された日報のID
 */
export async function createTestDailyReport(
  salesEmail: string,
  reportDate: string
): Promise<number> {
  // 営業担当者を取得
  const sales = await prisma.sales.findUnique({
    where: { email: salesEmail },
  });

  if (!sales) {
    throw new Error(`営業担当者が見つかりません: ${salesEmail}`);
  }

  // 既存の日報を削除（重複防止）
  await prisma.dailyReport.deleteMany({
    where: {
      salesId: sales.id,
      reportDate: new Date(reportDate),
    },
  });

  // 日報を作成
  const dailyReport = await prisma.dailyReport.create({
    data: {
      salesId: sales.id,
      reportDate: new Date(reportDate),
    },
  });

  return dailyReport.id;
}

/**
 * テスト用のProblemデータを作成
 * @param dailyReportId 日報ID
 * @param content Problem内容
 * @returns 作成されたProblemのID
 */
export async function createTestProblem(dailyReportId: number, content: string): Promise<number> {
  const problem = await prisma.problem.create({
    data: {
      dailyReportId,
      content,
    },
  });

  return problem.id;
}

/**
 * テスト用のPlanデータを作成
 * @param dailyReportId 日報ID
 * @param content Plan内容
 * @returns 作成されたPlanのID
 */
export async function createTestPlan(dailyReportId: number, content: string): Promise<number> {
  const plan = await prisma.plan.create({
    data: {
      dailyReportId,
      content,
    },
  });

  return plan.id;
}

/**
 * 日報データを取得
 * @param dailyReportId 日報ID
 */
export function getDailyReport(dailyReportId: number) {
  return prisma.dailyReport.findUnique({
    where: { id: dailyReportId },
    include: {
      problems: {
        include: {
          comments: true,
        },
      },
      plans: {
        include: {
          comments: true,
        },
      },
    },
  });
}

/**
 * Prisma接続を閉じる
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
