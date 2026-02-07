# 営業日報システム

営業担当者が日々の営業活動（訪問記録、課題、計画）を記録し、上長がコメントを通じてフィードバックを行うWebアプリケーションです。

## 🎯 プロジェクト概要

営業日報システムは、営業活動の可視化と効率的なコミュニケーションを実現するためのシステムです。営業担当者は日々の顧客訪問記録、課題（Problem）、翌日の予定（Plan）を記録し、上長はリアルタイムでフィードバックを提供できます。

### 主要機能

- **日報管理**
  - 日報の作成・編集・削除
  - 日報一覧の検索・フィルタリング
  - 日付、営業担当者、顧客による絞り込み

- **訪問記録管理**
  - 顧客訪問の詳細記録
  - 訪問時間の記録
  - 複数件の訪問記録登録

- **Problem管理**
  - 課題・相談事項の記録
  - 上長からのコメント・アドバイス
  - コメント履歴の管理

- **Plan管理**
  - 翌日の予定の記録
  - 上長からのフィードバック
  - 計画の進捗確認

- **顧客マスタ管理**
  - 顧客情報の登録・編集
  - 訪問履歴の確認
  - 業種別管理

- **権限管理**
  - 一般営業：自分の日報のみ編集可能
  - 上長（課長以上）：部下の日報閲覧・コメント可能
  - 管理者：全データの管理権限

### 想定ユーザー

- **一般営業担当者**: 日報の作成・編集
- **上長（課長・部長）**: 部下の日報確認とフィードバック
- **管理者**: システム全体の管理

## 📊 ステータス

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Test Coverage](https://img.shields.io/badge/coverage-80%25-yellowgreen)
![License](https://img.shields.io/badge/license-Private-red)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## 📋 ドキュメント

- [開発ガイドライン](./CLAUDE.md)
- [画面設計書](./doc/SCREEN_DESIGN.md)
- [API仕様書](./doc/API_SCHEME.md)
- [テスト仕様書](./doc/TEST_DEFINITION.md)
- [デプロイ手順書（初心者向け）](./doc/DEPLOYMENT_GUIDE.md) ⭐ **New!**
- [デプロイ手順書（エンジニア向け）](./doc/DEPLOYMENT.md)
- [ER図](./doc/ER_DIAGRAM.md)

## 🚀 技術スタック

| カテゴリ             | 技術                     |
| -------------------- | ------------------------ |
| **言語**             | TypeScript               |
| **フレームワーク**   | Next.js 14 (App Router)  |
| **UIコンポーネント** | shadcn/ui + Tailwind CSS |
| **APIスキーマ定義**  | OpenAPI (Zodによる検証)  |
| **DBスキーマ定義**   | Prisma.js                |
| **データベース**     | MySQL 8.0                |
| **認証**             | JWT (JSON Web Token)     |
| **テスト**           | Vitest, Playwright       |
| **デプロイ**         | Google Cloud Run         |
| **コード品質**       | ESLint, Prettier, Husky  |

## ⚙️ システム要件

### 本番環境

- **CPU**: 2コア以上
- **メモリ**: 4GB以上
- **ストレージ**: 50GB以上
- **データベース**: MySQL 8.0以上
- **Node.js**: 20.x以上

### 開発環境

- **OS**: macOS, Linux, Windows（WSL2推奨）
- **Node.js**: 20.x以上（LTS推奨）
- **パッケージマネージャー**: npm 10.x以上
- **Docker**: 24.x以上
- **Docker Compose**: 2.x以上
- **IDE**: VS Code推奨（拡張機能: ESLint, Prettier, Prisma）

## 📦 セットアップ

### 前提条件

- Node.js 20.x 以上
- npm または yarn
- MySQL 8.0
- Docker & Docker Compose（推奨）

### インストール手順

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd nippo
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   ```

3. **環境変数の設定**

   `.env` ファイルを作成:

   ```bash
   cp .env.example .env
   ```

   以下の環境変数を設定:

   ```bash
   # データベース接続（開発環境: Docker MySQL）
   DATABASE_URL="mysql://root:root@localhost:3306/nippo"

   # JWT認証（本番環境では必ず強力なランダム文字列に変更）
   # 生成方法: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   JWT_SECRET="your-secret-key-here-please-change-in-production"
   JWT_REFRESH_SECRET="your-refresh-secret-key-here-please-change-in-production"
   JWT_EXPIRES_IN="1h"
   JWT_REFRESH_EXPIRES_IN="30d"

   # Next.js
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"

   # 環境
   NODE_ENV="development"
   ```

   **環境変数のバリデーション**:

   ```bash
   # 環境変数が正しく設定されているか確認
   npm run env:validate
   ```

4. **Docker Composeでデータベースを起動**

   ```bash
   # MySQLコンテナを起動
   docker compose up -d

   # データベース接続テスト
   npm run db:test
   ```

5. **データベースのセットアップ**

   ```bash
   # Prismaクライアントの生成
   npm run prisma:generate

   # マイグレーションの実行
   npm run prisma:migrate

   # (オプション) Prisma Studioでデータ確認
   npm run prisma:studio
   ```

6. **Huskyの初期化**

   ```bash
   npm run prepare
   ```

7. **開発サーバーの起動**

   ```bash
   npm run dev
   ```

   ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 🛠️ 開発

### 利用可能なコマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# ESLint実行
npm run lint

# ESLint自動修正
npm run lint:fix

# 型チェック
npm run type-check

# コードフォーマット
npm run format

# フォーマットチェック
npm run format:check

# テスト実行（Vitest）
npm run test

# テスト（watch モード）
npm run test:watch

# テストUI（ブラウザで確認）
npm run test:ui

# カバレッジ付きテスト
npm run test:coverage

# E2Eテスト（Playwright）
npm run test:e2e

# E2EテストUI
npm run test:e2e:ui

# Prismaクライアント生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# Prisma Studio起動
npm run prisma:studio

# データベース接続テスト
npm run db:test

# 環境変数のバリデーション
npm run env:validate
```

### ディレクトリ構造

```
nippo/
├── app/                    # Next.js App Router (ページ、APIルート)
│   ├── api/               # APIエンドポイント
│   ├── (auth)/            # 認証関連ページ
│   └── (dashboard)/       # ダッシュボード関連ページ
├── components/            # Reactコンポーネント
│   ├── ui/               # 再利用可能なUIコンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── lib/                  # ユーティリティ関数
│   ├── auth.ts          # 認証ロジック
│   ├── db.ts            # Prismaクライアント
│   └── validations/     # Zodスキーマ
├── prisma/              # Prismaスキーマとマイグレーション
│   ├── schema.prisma    # データベーススキーマ
│   └── migrations/      # マイグレーションファイル
├── public/              # 静的ファイル
├── __tests__/           # テストファイル
├── e2e/                 # E2Eテスト
└── types/               # TypeScript型定義
```

### コーディング規約

詳細は [CLAUDE.md](./CLAUDE.md) を参照してください。

#### TypeScript

- `any` 型の使用は原則禁止
- すべての関数に適切な型定義を行う
- Nullable型は明示的に扱う

#### React/Next.js

- 関数コンポーネントのみ使用
- カスタムフックは `use` で始める
- 1ファイル1コンポーネント

#### コミットメッセージ

```
<type>: <subject>

<body>

<footer>
```

**Type**:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、設定変更

### テスト

#### 単体テスト（Vitest）

```bash
# すべてのテスト実行
npm run test

# 特定のテストファイル実行
npm run test -- daily-reports.test.ts

# watchモード
npm run test:watch

# テストUI（ブラウザで確認）
npm run test:ui

# カバレッジ
npm run test:coverage
```

#### E2Eテスト（Playwright）

```bash
# Playwrightのインストール
npx playwright install

# E2Eテスト実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui
```

### Git Hooks

コミット前に自動的に以下が実行されます:

- ESLintによるコードチェック
- Prettierによるフォーマット
- コミットメッセージの形式チェック

## 🔒 セキュリティ

- すべての通信はHTTPS経由
- パスワードはbcryptでハッシュ化
- JWTによる認証・認可
- SQLインジェクション対策（Prisma ORM使用）
- XSS対策（入力値のサニタイズ）
- CSRF対策
- レート制限

## 🚢 デプロイ

### Google Cloud Runへのデプロイ

#### 前提条件

- Google Cloud Platform（GCP）アカウント
- Google Cloud CLIのインストール
- Cloud SQL（MySQL）インスタンスの作成

詳細なデプロイ手順は **[デプロイ手順書（DEPLOYMENT.md）](./doc/DEPLOYMENT.md)** を参照してください。

#### クイックスタート

```bash
# 1. GCPプロジェクトの設定
gcloud config set project YOUR_PROJECT_ID

# 2. 必要なAPIを有効化
gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com

# 3. Cloud SQLインスタンスを作成
gcloud sql instances create nippo-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-northeast1

# 4. Cloud Runにデプロイ
gcloud run deploy nippo-app \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated
```

#### ローカル環境でのDocker実行

```bash
# MySQLコンテナを起動
docker-compose up -d mysql

# マイグレーション実行
npm run prisma:migrate

# アプリケーションコンテナをビルド＆起動
docker-compose up -d app

# http://localhost:3000 でアクセス
```

#### CI/CDパイプライン

Cloud Buildトリガーを設定することで、GitHubへのプッシュで自動デプロイが可能です。詳細は[デプロイ手順書](./doc/DEPLOYMENT.md)を参照してください。

### その他のデプロイ先

- **Vercel**: Next.jsに最適化されたホスティング
- **AWS ECS**: Dockerコンテナベースのデプロイ
- **Azure App Service**: Microsoftクラウドでのホスティング

詳細は各プラットフォームのドキュメントを参照してください。

## 🗄️ データベース設計

### 主要テーブル

- **sales**: 営業マスタ（ユーザー情報）
- **customers**: 顧客マスタ
- **daily_reports**: 日報
- **visit_records**: 訪問記録
- **problems**: 課題・相談
- **plans**: 翌日の予定
- **comments**: コメント（Problem/Planに対するフィードバック）

### リレーション

```
sales (営業) 1 --- N daily_reports (日報)
                      |
                      +--- N visit_records (訪問記録) --- 1 customers (顧客)
                      |
                      +--- N problems (課題) --- N comments (コメント)
                      |
                      +--- N plans (予定) --- N comments (コメント)
```

詳細なスキーマは [prisma/schema.prisma](./prisma/schema.prisma) および [ER図](./doc/ER_DIAGRAM.md) を参照してください。

## 💡 ベストプラクティス

### コード品質

- コミット前に必ずテストを実行
- `npm run lint`でコードをチェック
- `npm run type-check`で型エラーを確認
- `npm run format`でコードを整形

### テスト

- **単体テスト**: API実装後に必ずテストを追加（カバレッジ80%以上）
- **E2Eテスト**: 主要な業務フローをカバー
- **境界値テスト**: 入力値の境界条件をテスト
- **エラーハンドリング**: 異常系のテストも必ず実装

### パフォーマンス

- **データベースクエリの最適化**
  - N+1問題に注意（Prismaの`include`を適切に使用）
  - 必要なフィールドのみを取得（`select`を使用）
  - 適切なインデックスを設定

- **フロントエンド最適化**
  - React Server Componentsを活用
  - 動的インポートで初期ロード時間を短縮
  - 画像の最適化（Next.jsの`Image`コンポーネント使用）

### セキュリティ

- **環境変数の管理**
  - `.env`ファイルをGitにコミットしない
  - 本番環境では必ず強力なシークレットキーを使用
  - 定期的にシークレットローテーション

- **認証・認可**
  - JWTトークンの有効期限を適切に設定
  - リフレッシュトークンの安全な保管
  - APIエンドポイントに適切な権限チェックを実装

## ❓ FAQ

### Q: 初回セットアップ時にエラーが出る

A: 以下を確認してください：

- Node.js 20.x以上がインストールされているか
- `.env`ファイルが正しく作成されているか
- MySQLコンテナが起動しているか（`docker compose ps`）
- `npm install`が正常に完了しているか

### Q: テストが失敗する

A: 以下を試してください：

```bash
# キャッシュをクリア
rm -rf node_modules .next
npm install
npm run test -- --clearCache
```

### Q: データベース接続エラー

A: 以下を確認してください：

- MySQLコンテナが起動しているか
- `.env`の`DATABASE_URL`が正しいか
- ファイアウォールがポート3306をブロックしていないか

### Q: Git Hooksが動作しない

A: Huskyを再インストールしてください：

```bash
npm run prepare
```

### Q: 本番環境でパフォーマンスが悪い

A: 以下を確認してください：

- データベースクエリの最適化（Prisma Studio でクエリを確認）
- N+1問題の有無
- Cloud SQLのインスタンスタイプが適切か
- Cloud Runのメモリ設定が十分か

### Q: TypeScriptの型エラーが解決しない

A: 以下を試してください：

```bash
# Prismaクライアントを再生成
npm run prisma:generate

# 型チェック
npm run type-check
```

## 🔧 トラブルシューティング

### データベース接続エラー

```bash
# MySQLコンテナが起動しているか確認
docker compose ps

# ログを確認
docker compose logs mysql

# コンテナを再起動
docker compose restart mysql
```

### Prismaマイグレーションエラー

```bash
# マイグレーションをリセット（開発環境のみ）
npm run prisma:migrate:reset

# Prismaクライアントを再生成
npm run prisma:generate

# マイグレーションを再実行
npm run prisma:migrate
```

### ポート競合エラー

```bash
# 既に3000番ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートで起動
PORT=3001 npm run dev
```

### テスト失敗

```bash
# node_modulesとキャッシュをクリア
rm -rf node_modules .next
npm install

# Vitestキャッシュをクリア
npm run test -- --clearCache

# Playwrightを再インストール
npx playwright install --with-deps
```

### JWT認証エラー

- `.env`ファイルの`JWT_SECRET`が正しく設定されているか確認
- トークンの有効期限が切れていないか確認（デフォルト1時間）
- ブラウザのローカルストレージをクリアして再ログイン

### Git Hooksエラー

```bash
# Huskyを再インストール
npm run prepare

# Husky v9への移行（deprecation警告が出る場合）
# .husky/pre-commitと.husky/commit-msgから以下の行を削除:
# #!/usr/bin/env sh
# . "$(dirname -- "$0")/_/husky.sh"
```

## 📝 ライセンス

Private

## 🤝 コントリビューション

### 開発の流れ

1. **Issueの作成**
   - 新機能やバグ修正の前にIssueを作成
   - テンプレートに従って詳細を記載

2. **ブランチの作成**

   ```bash
   git checkout -b feature/issue-XX-feature-name
   # または
   git checkout -b fix/issue-XX-bug-description
   ```

3. **開発とテスト**
   - コーディング規約に従って実装
   - 単体テストとE2Eテストを追加
   - `npm run lint`と`npm run type-check`でチェック

4. **コミット**
   - コミットメッセージは規約に従う
   - 小さな単位でコミット

5. **プルリクエスト**
   - PRテンプレートに従って記載
   - スクリーンショット（UI変更の場合）
   - テスト結果を添付

6. **レビュー**
   - 最低1人の承認が必要
   - CIが通過していることを確認

### コードレビューのポイント

- コードの可読性と保守性
- テストの網羅性
- セキュリティの考慮
- パフォーマンスへの影響
- ドキュメントの更新

## 🔗 関連リンク

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

### ツール

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Zod](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)

### デプロイ

- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Cloud SQL](https://cloud.google.com/sql/docs)
- [Vercel](https://vercel.com/docs)

## 📜 更新履歴

### v1.0.0 (2026-02-07)

- ✅ 認証API実装（ログイン、トークンリフレッシュ）
- ✅ 日報管理API実装（CRUD、検索、フィルタリング）
- ✅ 訪問記録API実装
- ✅ Problem/Plan API実装
- ✅ コメント機能実装
- ✅ 顧客マスタAPI実装
- ✅ 営業マスタAPI実装
- ✅ 単体テスト実装（210テスト）
- ✅ E2Eテスト実装（日報フロー、コメントフロー）
- ✅ ドキュメント整備
- ✅ Dockerコンテナ化（Dockerfile, docker-compose.yml）
- ✅ Google Cloud Run デプロイ設定
- ✅ デプロイ手順書作成
- ✅ CI/CD設定（Cloud Build）

### 今後の予定

- [ ] フロントエンド画面実装
- [ ] パフォーマンス最適化
- [ ] 本番環境デプロイ
- [ ] モニタリング・ログ集約
- [ ] ユーザー向けマニュアル作成

## 📧 お問い合わせ

プロジェクト管理者: [your-email@example.com](mailto:your-email@example.com)

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています：

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Prisma](https://www.prisma.io/) - 次世代ORM
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネントライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク

---

⭐ このプロジェクトが役に立った場合は、スターをつけてください！
