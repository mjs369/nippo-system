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
 * ログイン処理を実行
 * @param page Playwrightのページオブジェクト
 * @param email メールアドレス
 * @param password パスワード
 */
export async function login(page: Page, email: string, password: string) {
  // ログイン画面に遷移
  await page.goto('/login');

  // メールアドレスとパスワードを入力
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // ログインボタンをクリック
  await page.click('button[type="submit"]');

  // 日報一覧画面への遷移を待つ
  await page.waitForURL('/daily-reports');
}

/**
 * ログアウト処理を実行
 * @param page Playwrightのページオブジェクト
 */
export async function logout(page: Page) {
  // ログアウトボタンをクリック
  await page.click('button:has-text("ログアウト")');

  // ログイン画面への遷移を待つ
  await page.waitForURL('/login');
}
