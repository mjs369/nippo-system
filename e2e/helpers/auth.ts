import type { Page } from '@playwright/test';

/**
 * テスト用の認証情報
 */
export const TEST_USERS = {
  // 上長（課長）アカウント
  manager: {
    email: 'sato-k@example.com',
    password: 'password123',
    name: '佐藤 課長',
  },
  // 一般営業アカウント
  sales: {
    email: 'yamada@example.com',
    password: 'password123',
    name: '山田 太郎',
  },
};

/**
 * ログインヘルパー関数
 * @param page Playwrightのページオブジェクト
 * @param email メールアドレス
 * @param password パスワード
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
 * @param page Playwrightのページオブジェクト
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
