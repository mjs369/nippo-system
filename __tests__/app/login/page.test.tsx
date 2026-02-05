import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';

// next/navigationのモック
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// グローバルfetchのモック
global.fetch = vi.fn();

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    // localStorageとsessionStorageのモック
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.getItem = vi.fn();
  });

  it('正常系: メールアドレスとパスワードを入力してログインできる', async () => {
    const mockResponse = {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      user: {
        id: 1,
        name: '山田 太郎',
        email: 'yamada@example.com',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<LoginPage />);

    // フォームに入力
    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // APIが呼ばれることを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'yamada@example.com',
          password: 'password123',
        }),
      });
    });

    // トークンがsessionStorageに保存されることを確認
    await waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        'test_access_token'
      );
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'test_refresh_token'
      );
    });

    // 日報一覧画面に遷移することを確認
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/daily-reports');
    });
  });

  it('正常系: ログイン状態を保持するチェックボックスをONにするとlocalStorageに保存される', async () => {
    const mockResponse = {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      user: {
        id: 1,
        name: '山田 太郎',
        email: 'yamada@example.com',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const rememberMeCheckbox = screen.getByLabelText('ログイン状態を保持する');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(rememberMeCheckbox);
    fireEvent.click(loginButton);

    // トークンがlocalStorageに保存されることを確認
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        'test_access_token'
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'test_refresh_token'
      );
    });
  });

  it('異常系: メールアドレス未入力でバリデーションエラーが表示される', async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // バリデーションエラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
    });

    // APIが呼ばれないことを確認
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('異常系: パスワード未入力でバリデーションエラーが表示される', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.click(loginButton);

    // バリデーションエラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
    });

    // APIが呼ばれないことを確認
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('異常系: 不正なメールアドレス形式でバリデーションエラーが表示される', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // バリデーションエラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスの形式が正しくありません')
      ).toBeInTheDocument();
    });

    // APIが呼ばれないことを確認
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('異常系: 認証失敗時(401)にエラーメッセージが表示される', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスまたはパスワードが正しくありません')
      ).toBeInTheDocument();
    });

    // 日報一覧画面に遷移しないことを確認
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('異常系: ネットワークエラー時にエラーメッセージが表示される', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('ネットワークエラーが発生しました。もう一度お試しください。')
      ).toBeInTheDocument();
    });

    // 日報一覧画面に遷移しないことを確認
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ローディング中はボタンが無効化される', async () => {
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                access_token: 'test_access_token',
                refresh_token: 'test_refresh_token',
              }),
            });
          }, 100);
        })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');
    const loginButton = screen.getByRole('button', { name: 'ログイン' });

    fireEvent.change(emailInput, { target: { value: 'yamada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // ローディング中はボタンが無効化される
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });
  });
});
