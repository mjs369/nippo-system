import type { Page } from '@playwright/test';

/**
 * テストデータクリーンアップヘルパー
 */
export async function cleanupDailyReport(page: Page, reportDate?: string) {
  try {
    // 一覧画面に移動
    await page.goto('/daily-reports');

    // 削除対象の日付を決定（指定がなければ今日）
    const targetDate = reportDate || getTodayJapaneseDate();

    // 対象日報を探す
    const reportRow = page
      .locator(`tr, .report-item, [data-testid="report-row"]`)
      .filter({ hasText: targetDate })
      .first();

    if (!(await reportRow.isVisible({ timeout: 2000 }).catch(() => false))) {
      // 対象日報が存在しない場合は何もしない
      return;
    }

    // 日報をクリックして詳細画面へ
    await reportRow.click();
    await page.waitForURL(/\/daily-reports\/\d+/);

    // 削除ボタンをクリック
    const deleteButton = page.getByRole('button', { name: /削除/ });
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();

      // 確認ダイアログで削除を確認
      const confirmButton = page.getByRole('button', {
        name: /削除する|はい|OK|確認/,
      });
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();

        // 削除成功後、一覧画面に戻ることを確認
        await page.waitForURL(/\/daily-reports$/);
      }
    }
  } catch (error) {
    console.log('日報のクリーンアップに失敗:', error);
  }
}

/**
 * 今日の日付を日本語形式（YYYY/MM/DD）で取得
 */
function getTodayJapaneseDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
