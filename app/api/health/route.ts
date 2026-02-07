/**
 * ヘルスチェックエンドポイント
 * Cloud Runがサービスの健全性を確認するために使用
 */

import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'nippo-app',
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'nippo-app',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 503 }
    );
  }
}
