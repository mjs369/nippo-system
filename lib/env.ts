/**
 * 環境変数のバリデーションとユーティリティ
 *
 * このファイルは環境変数が正しく設定されているかを検証し、
 * 型安全にアクセスするためのユーティリティを提供します。
 */

import { config } from 'dotenv';
import { z } from 'zod';

// .envファイルをロード（Next.jsの外で実行する場合のため）
if (process.env.NODE_ENV !== 'production') {
  config();
}

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  // データベース
  DATABASE_URL: z.string().min(1, 'DATABASE_URLが設定されていません'),

  // JWT認証
  JWT_SECRET: z.string().min(32, 'JWT_SECRETは32文字以上の強力な文字列を設定してください'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRETは32文字以上の強力な文字列を設定してください'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Next.js
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URLは有効なURLである必要があります'),

  // 環境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // オプション設定
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  RATE_LIMIT_MAX: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

/**
 * 環境変数の型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数をバリデーションして取得
 *
 * @throws {Error} 環境変数が不正な場合
 * @returns {Env} バリデーション済みの環境変数
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `環境変数の検証に失敗しました:\n${errorMessages}\n\n.env.exampleを参考に.envファイルを設定してください。`
      );
    }
    throw error;
  }
}

/**
 * 環境変数を取得（型安全）
 *
 * アプリケーション起動時に一度だけバリデーションを実行し、
 * 以降は検証済みの値を使用します。
 */
let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (!validatedEnv) {
    validatedEnv = validateEnv();
  }
  return validatedEnv;
}

/**
 * 環境が開発環境かどうかを判定
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * 環境が本番環境かどうかを判定
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * 環境がテスト環境かどうかを判定
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

/**
 * JWT設定を取得
 */
export function getJwtConfig() {
  const env = getEnv();
  return {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
}

/**
 * データベース接続URLを取得
 */
export function getDatabaseUrl(): string {
  return getEnv().DATABASE_URL;
}
