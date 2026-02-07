import { test, expect } from '@playwright/test';

import { login, logout, TEST_USERS } from './helpers/auth';
import { cleanupTestData } from './helpers/cleanup';
import {
  createTestDailyReport,
  createTestProblem,
  createTestPlan,
  getDailyReport,
  disconnectPrisma,
} from './helpers/test-data';

/**
 * コメントフローE2Eテスト
 *
 * テストシナリオ:
 * 1. 上長アカウントでログイン
 * 2. 日報一覧画面で部下の日報を表示
 * 3. 特定の日報をクリック
 * 4. Problemにコメント追加
 * 5. Planにコメント追加
 * 6. 一覧に戻りコメントアイコンが表示されることを確認
 */

test.describe('コメントフローE2Eテスト', () => {
  const testReportDate = '2026-02-15';
  let dailyReportId: number;
  let problemId: number;
  let planId: number;

  // テスト前の準備
  test.beforeAll(async () => {
    // 既存のテストデータをクリーンアップ
    await cleanupTestData(testReportDate);

    // テスト用の日報を作成
    dailyReportId = await createTestDailyReport(TEST_USERS.sales.email, testReportDate as string);

    // Problemを作成
    problemId = await createTestProblem(
      dailyReportId,
      'E2Eテスト用のProblem: GHI工業との価格交渉について相談'
    );

    // Planを作成
    planId = await createTestPlan(dailyReportId, 'E2Eテスト用のPlan: ABC商事へ見積書提出');

    // eslint-disable-next-line no-console
    console.log('テストデータを作成しました:', {
      dailyReportId,
      problemId,
      planId,
    });
  });

  // テスト後のクリーンアップ
  test.afterAll(async () => {
    await cleanupTestData(testReportDate);
    await disconnectPrisma();
  });

  test('上長が部下の日報にコメントを追加できる', async ({ page }) => {
    // 1. 上長アカウントでログイン
    await login(page, TEST_USERS.manager.email, TEST_USERS.manager.password);

    // ログイン成功を確認
    await expect(page).toHaveURL('/daily-reports');

    // 2. 表示対象を「部下の日報」に切り替え
    // ラジオボタンの選択
    await page.click('input[type="radio"][value="subordinates"]');

    // 検索ボタンをクリック（必要に応じて）
    const searchButton = page.locator('button:has-text("検索")');
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    // 部下の日報が表示されることを待つ
    await page.waitForTimeout(1000);

    // 3. 特定の日報をクリック
    // 報告日でフィルタリングして該当日報を探す
    const reportRow = page.locator(`tr:has-text("${testReportDate}")`).first();
    await expect(reportRow).toBeVisible({ timeout: 10000 });

    // 日報の行をクリック
    await reportRow.click();

    // 日報詳細画面への遷移を待つ
    await page.waitForURL(/\/daily-reports\/\d+/);
    await expect(page.locator('h1, h2').filter({ hasText: '日報詳細' })).toBeVisible({
      timeout: 10000,
    });

    // 4. Problemにコメント追加
    // Problemセクションを展開（必要に応じて）
    const problemSection = page.locator('text=Problem').first();
    await problemSection.scrollIntoViewIfNeeded();

    // コメント入力欄を表示するボタンをクリック
    const problemCommentButton = page.locator('button:has-text("コメント")').first();
    if (await problemCommentButton.isVisible()) {
      await problemCommentButton.click();
    }

    // コメント入力欄にテキストを入力
    const problemCommentTextarea = page.locator('textarea[placeholder*="コメント"]').first();
    await problemCommentTextarea.fill('E2Eテスト: 5%までの値引きであれば承認します。');

    // コメント投稿ボタンをクリック
    const problemCommentSubmit = page
      .locator('button:has-text("投稿"), button:has-text("保存")')
      .first();
    await problemCommentSubmit.click();

    // コメントが表示されることを確認
    await expect(page.locator('text=E2Eテスト: 5%までの値引きであれば承認します。')).toBeVisible({
      timeout: 10000,
    });

    // 5. Planにコメント追加
    // Planセクションを展開
    const planSection = page.locator('text=Plan').first();
    await planSection.scrollIntoViewIfNeeded();

    // コメント入力欄を表示するボタンをクリック
    const planCommentButton = page.locator('button:has-text("コメント")').nth(1);
    if (await planCommentButton.isVisible()) {
      await planCommentButton.click();
    }

    // コメント入力欄にテキストを入力
    const planCommentTextarea = page.locator('textarea[placeholder*="コメント"]').nth(1);
    await planCommentTextarea.fill('E2Eテスト: 見積書の内容を事前に確認させてください。');

    // コメント投稿ボタンをクリック
    const planCommentSubmit = page
      .locator('button:has-text("投稿"), button:has-text("保存")')
      .nth(1);
    await planCommentSubmit.click();

    // コメントが表示されることを確認
    await expect(
      page.locator('text=E2Eテスト: 見積書の内容を事前に確認させてください。')
    ).toBeVisible({ timeout: 10000 });

    // 6. 一覧に戻る
    await page.click('button:has-text("一覧に戻る"), a:has-text("一覧に戻る")');

    // 日報一覧画面への遷移を待つ
    await expect(page).toHaveURL('/daily-reports');

    // コメントアイコンが表示されることを確認
    const reportRowWithComment = page.locator(`tr:has-text("${testReportDate}")`).first();
    await expect(reportRowWithComment).toBeVisible();

    // コメントアイコン（💬）が表示されているか確認
    const commentIcon = reportRowWithComment.locator('text=💬, [data-testid="comment-icon"]');
    await expect(commentIcon).toBeVisible({ timeout: 10000 });

    // データベースでコメントが保存されていることを確認
    const updatedReport = await getDailyReport(dailyReportId);
    expect(updatedReport).toBeTruthy();
    expect(updatedReport?.problems[0]?.comments.length).toBeGreaterThan(0);
    expect(updatedReport?.plans[0]?.comments.length).toBeGreaterThan(0);

    // ログアウト
    await logout(page);
  });

  test('一般営業はコメントを投稿できない', async ({ page }) => {
    // 一般営業アカウントでログイン
    await login(page, TEST_USERS.sales.email, TEST_USERS.sales.password);

    // 自分の日報を表示
    const reportRow = page.locator(`tr:has-text("${testReportDate}")`).first();
    await expect(reportRow).toBeVisible({ timeout: 10000 });
    await reportRow.click();

    // 日報詳細画面への遷移を待つ
    await page.waitForURL(/\/daily-reports\/\d+/);

    // コメント入力欄が表示されないことを確認
    const commentTextarea = page.locator('textarea[placeholder*="コメント"]');
    await expect(commentTextarea).not.toBeVisible();

    // または、コメントボタンが表示されないことを確認
    const commentButton = page.locator('button:has-text("コメント追加")');
    await expect(commentButton).not.toBeVisible();

    // ログアウト
    await logout(page);
  });
});
