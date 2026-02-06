#!/usr/bin/env tsx

/**
 * データベース接続テストスクリプト
 *
 * 環境変数が正しく設定されているか、
 * データベースに接続できるかをテストします。
 *
 * 使用方法:
 *   npx tsx scripts/test-db-connection.ts
 */

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';

import { validateEnv, getDatabaseUrl } from '../lib/env';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 データベース接続テストを開始します...\n');

  try {
    // 1. 環境変数のバリデーション
    console.log('1️⃣ 環境変数のチェック...');
    const env = validateEnv();
    console.log('   ✅ 環境変数は正しく設定されています');
    console.log(`   📍 NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   📍 DATABASE_URL: ${getDatabaseUrl().replace(/:[^:@]+@/, ':***@')}`); // パスワードをマスク
    console.log('');

    // 2. データベース接続テスト
    console.log('2️⃣ データベース接続のテスト...');
    await prisma.$connect();
    console.log('   ✅ データベースに接続できました');
    console.log('');

    // 3. データベースクエリのテスト
    console.log('3️⃣ データベースクエリのテスト...');

    // テーブル数を取得
    const tables = await prisma.$queryRaw<
      Array<{ table_name: string }>
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`;
    console.log(`   ✅ テーブル数: ${tables.length}件`);

    // 営業マスタの件数を取得
    const salesCount = await prisma.sales.count();
    console.log(`   ✅ 営業マスタ: ${salesCount}件`);

    // 顧客マスタの件数を取得
    const customerCount = await prisma.customer.count();
    console.log(`   ✅ 顧客マスタ: ${customerCount}件`);

    // 日報の件数を取得
    const dailyReportCount = await prisma.dailyReport.count();
    console.log(`   ✅ 日報: ${dailyReportCount}件`);

    console.log('');
    console.log('🎉 すべてのテストが成功しました！');
    console.log('');

    // テーブル一覧を表示
    console.log('📋 データベースのテーブル一覧:');
    tables.forEach((table) => {
      console.log(`   - ${table.table_name}`);
    });
  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(error);
    }
    console.error('');
    console.error('💡 確認事項:');
    console.error('   1. .envファイルが存在し、DATABASE_URLが正しく設定されているか');
    console.error('   2. MySQLサーバーが起動しているか (docker compose ps)');
    console.error('   3. マイグレーションが実行されているか (npx prisma migrate dev)');
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトの実行
void testDatabaseConnection();
