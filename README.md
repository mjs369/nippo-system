# 営業日報システム

営業担当者が日々の営業活動を記録し、上長がフィードバックを行うWebアプリケーションです。

## 📋 ドキュメント

- [開発ガイドライン](./CLAUDE.md)
- [画面設計書](./doc/SCREEN_DESIGN.md)
- [API仕様書](./doc/API_SCHEME.md)
- [テスト仕様書](./doc/TEST_DEFINITION.md)
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

## 📦 セットアップ

### 前提条件

- Node.js 20.x 以上
- npm または yarn
- MySQL 8.0

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

## 📝 ライセンス

Private

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📧 お問い合わせ

プロジェクト管理者: [your-email@example.com](mailto:your-email@example.com)
