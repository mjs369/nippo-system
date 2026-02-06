/**
 * JWT（JSON Web Token）ユーティリティ
 *
 * JWTの生成、検証、デコードを行うユーティリティ関数を提供します。
 */

import { sign, verify, decode, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getJwtConfig } from './env';

/**
 * JWTペイロードの型定義
 */
export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  position?: string | null;
  department?: string | null;
}

/**
 * JWTペイロードの拡張版（検証後）
 */
export interface JwtPayloadWithTimestamps extends JwtPayload {
  iat: number; // Issued At
  exp: number; // Expiration Time
}

/**
 * アクセストークンを生成
 *
 * @param payload JWTに含めるペイロード
 * @returns 生成されたJWTトークン
 */
export function generateAccessToken(payload: JwtPayload): string {
  const config = getJwtConfig();

  return sign(payload, config.secret, {
    expiresIn: config.expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * リフレッシュトークンを生成
 *
 * @param payload JWTに含めるペイロード
 * @returns 生成されたリフレッシュトークン
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const config = getJwtConfig();

  return sign(payload, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * アクセストークンを検証
 *
 * @param token 検証するJWTトークン
 * @returns デコードされたペイロード
 * @throws {Error} トークンが無効な場合
 */
export function verifyAccessToken(token: string): JwtPayloadWithTimestamps {
  try {
    const config = getJwtConfig();
    const decoded = verify(token, config.secret, {
      algorithms: ['HS256'],
    });

    return decoded as JwtPayloadWithTimestamps;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('トークンの有効期限が切れています');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('トークンが無効です');
    }
    throw error;
  }
}

/**
 * リフレッシュトークンを検証
 *
 * @param token 検証するリフレッシュトークン
 * @returns デコードされたペイロード
 * @throws {Error} トークンが無効な場合
 */
export function verifyRefreshToken(token: string): JwtPayloadWithTimestamps {
  try {
    const config = getJwtConfig();
    const decoded = verify(token, config.refreshSecret, {
      algorithms: ['HS256'],
    });

    return decoded as JwtPayloadWithTimestamps;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('リフレッシュトークンの有効期限が切れています');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('リフレッシュトークンが無効です');
    }
    throw error;
  }
}

/**
 * トークンをデコード（検証なし）
 *
 * 注意: このメソッドは検証を行わないため、
 * トークンの内容を確認する目的でのみ使用してください。
 * 認証には必ず verify メソッドを使用してください。
 *
 * @param token デコードするJWTトークン
 * @returns デコードされたペイロード（検証なし）
 */
export function decodeToken(token: string): JwtPayloadWithTimestamps | null {
  const decoded = decode(token);
  return decoded as JwtPayloadWithTimestamps | null;
}

/**
 * トークンの有効期限を確認
 *
 * @param token 確認するJWTトークン
 * @returns 有効期限が切れている場合はtrue
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * トークンの残り有効時間を取得（秒）
 *
 * @param token 確認するJWTトークン
 * @returns 残り有効時間（秒）、有効期限切れの場合は0
 */
export function getTokenRemainingTime(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = decoded.exp - currentTime;
  return remaining > 0 ? remaining : 0;
}
