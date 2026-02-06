import { hash, compare } from 'bcrypt';
import { sign, verify, TokenExpiredError, JsonWebTokenError, type SignOptions } from 'jsonwebtoken';

/**
 * JWTペイロードの型定義
 */
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  department?: string | null;
  position?: string | null;
  managerId?: number | null;
}

/**
 * デコードされたJWTトークンの型定義
 */
export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
}

/**
 * パスワードをハッシュ化する
 * @param password プレーンテキストのパスワード
 * @returns ハッシュ化されたパスワード
 */
export function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return hash(password, saltRounds);
}

/**
 * パスワードを検証する
 * @param password プレーンテキストのパスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードが一致する場合はtrue
 */
export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * アクセストークンを生成する
 * @param payload JWTペイロード
 * @returns JWTトークン
 */
export function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return sign(payload, secret, {
    expiresIn: expiresIn as string | number,
    issuer: 'nippo-system',
    audience: 'nippo-api',
  } as SignOptions);
}

/**
 * リフレッシュトークンを生成する
 * @param payload JWTペイロード
 * @returns JWTリフレッシュトークン
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  return sign(payload, secret, {
    expiresIn: expiresIn as string | number,
    issuer: 'nippo-system',
    audience: 'nippo-api',
  } as SignOptions);
}

/**
 * アクセストークンを検証する
 * @param token JWTトークン
 * @returns デコードされたペイロード
 */
export function verifyAccessToken(token: string): DecodedToken {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    const decoded = verify(token, secret, {
      issuer: 'nippo-system',
      audience: 'nippo-api',
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * リフレッシュトークンを検証する
 * @param token JWTリフレッシュトークン
 * @returns デコードされたペイロード
 */
export function verifyRefreshToken(token: string): DecodedToken {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  try {
    const decoded = verify(token, secret, {
      issuer: 'nippo-system',
      audience: 'nippo-api',
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    if (error instanceof JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    }
    throw error;
  }
}

/**
 * Authorizationヘッダーからトークンを抽出する
 * @param authorizationHeader Authorizationヘッダーの値
 * @returns トークン文字列、または null
 */
export function extractTokenFromHeader(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
