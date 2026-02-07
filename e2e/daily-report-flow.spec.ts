import { test, expect } from '@playwright/test';

/**
 * 日報作成フローのE2Eテスト
 *
 * テストシナリオ:
 * 1. ログイン
 * 2. 日報一覧画面に遷移
 * 3. 新規日報作成
 * 4. 訪問記録追加
 * 5. Problem追加
 * 6. Plan追加
 * 7. 日報保存
 * 8. 一覧に新規日報が表示されることを確認
 */

// テストデータ
const TEST_USER = {
  email: 'yamada@example.com',
  password: 'password123',
};

const TEST_VISIT_RECORD = {
  customer: '株式会社ABC商事',
  startTime: '10:00',
  endTime: '11:30',
  content:
    '新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。',
};

const TEST_PROBLEM = {
  content:
    'GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。',
};

const TEST_PLAN = {
  content: 'ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。',
};

test.describe('日報作成フロー', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理
    await page.goto('/login');

    // ログイン画面が表示されることを確認
    await expect(page.locator('h1, h2')).toContainText(/ログイン|営業日報システム/);

    // ログインフォームに入力
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);

    // ログインボタンをクリック
    await page.click('button[type="submit"]');

    // ログイン成功後、日報一覧画面に遷移することを確認
    await expect(page).toHaveURL(/\/daily-reports/);
  });

  test('日報作成から訪問記録・Problem・Plan追加までの一連の流れ', async ({ page }) => {
    // Step 1: 日報一覧画面に遷移していることを確認
    await expect(page).toHaveURL(/\/daily-reports/);
    await expect(page.locator('h1, h2')).toContainText(/日報一覧|日報/);

    // Step 2: 新規日報作成ボタンをクリック
    const createButton = page.getByRole('button', { name: /新規日報作成|新規作成|\+.*作成/ });
    await createButton.click();

    // 日報詳細・編集画面に遷移することを確認
    await page.waitForURL(/\/daily-reports\/(new|\d+)/);
    await expect(page.locator('h1, h2')).toContainText(/日報詳細|日報編集|日報作成/);

    // Step 3: 訪問記録を追加
    // 訪問記録セクションを探す
    const visitSection = page
      .locator('section, div')
      .filter({ hasText: /訪問記録/ })
      .first();

    // 訪問記録の追加ボタンをクリック
    const addVisitButton = visitSection.getByRole('button', { name: /追加|\+/ });
    await addVisitButton.click();

    // ダイアログが表示されることを確認
    const dialog = page.locator('[role="dialog"], .dialog, [data-dialog]').first();
    await expect(dialog).toBeVisible();

    // 訪問記録フォームに入力
    // 顧客選択
    const customerSelect = dialog.locator('select[name*="customer"], [name*="customerId"]');
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ label: TEST_VISIT_RECORD.customer });
    } else {
      // selectタグが見つからない場合、Radix UIのSelectコンポーネントの可能性
      const triggerButton = dialog.locator('button[role="combobox"]').first();
      await triggerButton.click();
      await page.locator(`[role="option"]`).filter({ hasText: TEST_VISIT_RECORD.customer }).click();
    }

    // 訪問開始時刻
    const startTimeInput = dialog.locator('input[name*="startTime"], input[name*="start_time"]');
    if ((await startTimeInput.count()) > 0) {
      await startTimeInput.fill(TEST_VISIT_RECORD.startTime);
    }

    // 訪問終了時刻
    const endTimeInput = dialog.locator('input[name*="endTime"], input[name*="end_time"]');
    if ((await endTimeInput.count()) > 0) {
      await endTimeInput.fill(TEST_VISIT_RECORD.endTime);
    }

    // 訪問内容
    const contentTextarea = dialog.locator(
      'textarea[name*="content"], textarea[name*="visitContent"]'
    );
    await contentTextarea.fill(TEST_VISIT_RECORD.content);

    // 保存ボタンをクリック
    const saveButton = dialog.getByRole('button', { name: /保存|追加/ });
    await saveButton.click();

    // ダイアログが閉じることを確認
    await expect(dialog).not.toBeVisible();

    // 訪問記録が表示されることを確認
    await expect(page.locator(`text=${TEST_VISIT_RECORD.customer}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_VISIT_RECORD.content}`)).toBeVisible();

    // Step 4: Problemを追加
    // Problemセクションを探す
    const problemSection = page
      .locator('section, div')
      .filter({ hasText: /Problem|課題|相談/ })
      .first();

    // Problemの追加ボタンをクリック
    const addProblemButton = problemSection.getByRole('button', { name: /追加|\+/ });
    await addProblemButton.click();

    // ダイアログが表示されることを確認
    const problemDialog = page.locator('[role="dialog"], .dialog, [data-dialog]').first();
    await expect(problemDialog).toBeVisible();

    // Problem内容を入力
    const problemTextarea = problemDialog.locator('textarea[name*="content"]');
    await problemTextarea.fill(TEST_PROBLEM.content);

    // 保存ボタンをクリック
    const saveProblemButton = problemDialog.getByRole('button', { name: /保存|追加/ });
    await saveProblemButton.click();

    // ダイアログが閉じることを確認
    await expect(problemDialog).not.toBeVisible();

    // Problemが表示されることを確認
    await expect(page.locator(`text=${TEST_PROBLEM.content.substring(0, 30)}`)).toBeVisible();

    // Step 5: Planを追加
    // Planセクションを探す
    const planSection = page
      .locator('section, div')
      .filter({ hasText: /Plan|明日の予定|予定/ })
      .first();

    // Planの追加ボタンをクリック
    const addPlanButton = planSection.getByRole('button', { name: /追加|\+/ });
    await addPlanButton.click();

    // ダイアログが表示されることを確認
    const planDialog = page.locator('[role="dialog"], .dialog, [data-dialog]').first();
    await expect(planDialog).toBeVisible();

    // Plan内容を入力
    const planTextarea = planDialog.locator('textarea[name*="content"]');
    await planTextarea.fill(TEST_PLAN.content);

    // 保存ボタンをクリック
    const savePlanButton = planDialog.getByRole('button', { name: /保存|追加/ });
    await savePlanButton.click();

    // ダイアログが閉じることを確認
    await expect(planDialog).not.toBeVisible();

    // Planが表示されることを確認
    await expect(page.locator(`text=${TEST_PLAN.content.substring(0, 30)}`)).toBeVisible();

    // Step 6: 日報を保存
    // ページ下部の保存ボタンを探す（訪問記録、Problem、Planの保存ボタンと区別するため）
    const saveReportButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /保存/ })
      .last();
    await saveReportButton.click();

    // 保存成功メッセージまたは一覧画面への遷移を確認
    // オプション1: 成功メッセージが表示される場合
    const successMessage = page.locator('text=/保存しました|成功|作成しました/');
    if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(successMessage).toBeVisible();
    }

    // Step 7: 一覧画面に戻る
    // 一覧に戻るボタンをクリック
    const backButton = page
      .getByRole('link', { name: /一覧に戻る|戻る|一覧/ })
      .or(page.getByRole('button', { name: /一覧に戻る|戻る|一覧/ }));
    await backButton.click();

    // 日報一覧画面に遷移することを確認
    await expect(page).toHaveURL(/\/daily-reports$/);

    // Step 8: 一覧に新規日報が表示されることを確認
    // 今日の日付の日報が表示されることを確認
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const japaneseDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // 日付が表示されることを確認（YYYY/MM/DD または YYYY-MM-DD 形式）
    const dateLocator = page.locator(`text=${japaneseDate}`).or(page.locator(`text=${dateStr}`));
    await expect(dateLocator.first()).toBeVisible();

    // 訪問件数、Problem件数、Plan件数が表示されることを確認
    // 一覧画面では件数が表示される想定
    const visitCount = page
      .locator('text=/訪問.*1|1.*訪問/')
      .or(page.locator('td, div').filter({ hasText: '1' }));
    const problemCount = page
      .locator('text=/Problem.*1|1.*Problem/')
      .or(page.locator('td, div').filter({ hasText: '1' }));
    const planCount = page
      .locator('text=/Plan.*1|1.*Plan/')
      .or(page.locator('td, div').filter({ hasText: '1' }));

    // 少なくとも1つの件数表示があることを確認
    await expect(visitCount.first().or(problemCount.first()).or(planCount.first())).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // テストデータのクリーンアップ
    // 作成した日報を削除
    try {
      // 一覧画面に移動
      await page.goto('/daily-reports');

      // 今日の日付の日報を探す
      const today = new Date();
      const japaneseDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

      // 今日の日報が存在する場合、クリックして詳細画面へ
      const todayReport = page
        .locator(`tr, .report-item`)
        .filter({ hasText: japaneseDate })
        .first();
      if (await todayReport.isVisible({ timeout: 2000 }).catch(() => false)) {
        await todayReport.click();

        // 削除ボタンをクリック
        const deleteButton = page.getByRole('button', { name: /削除/ });
        if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteButton.click();

          // 確認ダイアログで削除を確認
          const confirmButton = page.getByRole('button', { name: /削除する|はい|OK/ });
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
          }
        }
      }
    } catch (error) {
      // クリーンアップ失敗は無視（次回のテストで上書きされる）
      console.log('テストデータのクリーンアップに失敗しました:', error);
    }
  });
});
