import type { Page } from '@playwright/test';

/**
 * ログインヘルパー関数
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');

  // メールアドレスとパスワードを入力
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // ログイン成功を待つ
  await page.waitForURL(/\/daily-reports/);
}

/**
 * ログアウトヘルパー関数
 */
export async function logout(page: Page) {
  // ログアウトボタンをクリック
  const logoutButton = page.getByRole('button', { name: /ログアウト|Logout/ });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }

  // ログイン画面に遷移することを確認
  await page.waitForURL(/\/login/);
}
