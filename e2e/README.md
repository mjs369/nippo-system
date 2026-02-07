# E2Eテスト

このディレクトリには、Playwrightを使用した日報システムのE2Eテストが含まれています。

## 前提条件

- Node.js 20.x 以上
- データベースが起動していること
- テスト用のシードデータが投入されていること

## セットアップ

```bash
# 依存関係のインストール
npm install

# Playwrightのブラウザをインストール（初回のみ）
npx playwright install

# データベースのマイグレーション
npm run prisma:migrate

# テストデータの投入
npm run prisma:seed
```

## テストの実行

### すべてのE2Eテストを実行

```bash
npm run test:e2e
```

### UIモードで実行（インタラクティブ）

```bash
npm run test:e2e:ui
```

### 特定のテストファイルのみ実行

```bash
npx playwright test e2e/daily-report-flow.spec.ts
```

### ヘッドフルモード（ブラウザを表示）で実行

```bash
npx playwright test --headed
```

### デバッグモード

```bash
npx playwright test --debug
```

## テスト構成

### daily-report-flow.spec.ts

日報作成から訪問記録・Problem・Planの追加までの一連のフローをテストします。

**テストシナリオ:**

1. ログイン
2. 日報一覧画面に遷移
3. 新規日報作成
4. 訪問記録追加
5. Problem追加
6. Plan追加
7. 日報保存
8. 一覧に新規日報が表示されることを確認

## ヘルパー関数

### auth.ts

ログイン・ログアウトのヘルパー関数を提供します。

### cleanup.ts

テストデータのクリーンアップ用ヘルパー関数を提供します。

## テストデータ

テストでは以下のデータを使用します:

- **ユーザー**: yamada@example.com (password: password123)
- **顧客**: 株式会社ABC商事
- **訪問記録**: 新商品のプレゼンテーション
- **Problem**: GHI工業との価格交渉について
- **Plan**: ABC商事へ見積書提出

## 注意事項

- テスト実行前に、開発サーバーが起動していることを確認してください
- テストは並列実行されないように設定されています（データベースの競合を避けるため）
- テスト終了後、作成したデータは自動的にクリーンアップされます
- テストが失敗した場合、スクリーンショットが `test-results/` ディレクトリに保存されます

## トラブルシューティング

### テストがタイムアウトする場合

```bash
# タイムアウト時間を延長
npx playwright test --timeout=60000
```

### ブラウザが起動しない場合

```bash
# ブラウザを再インストール
npx playwright install --force
```

### データベース接続エラー

```bash
# データベースの接続を確認
npm run db:test

# マイグレーションをリセット
npm run prisma:reset
```
