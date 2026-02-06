# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) が営業日報システムのリポジトリで作業する際のガイダンスを提供します。

## 基本ルール

- 返答は常に日本語で行うこと
- 技術的な正確性と品質を最優先すること
- 不明な点があれば、推測ではなくユーザーに確認すること
- ユーザーは技術者ではなく学習中のため、技術やツールに関することであれば初回は必ずそれが何をする行為なのかを説明すること

---

## 1. プロジェクト概要

### 1.1 システム概要

営業日報システムは、営業担当者が日々の営業活動（訪問記録、課題、計画）を記録し、上長がコメントを通じてフィードバックを行うWebアプリケーションです。

### 1.2 主要機能

- 日報管理（作成、編集、削除、一覧、検索）
- 訪問記録管理（顧客訪問の記録）
- Problem管理（課題・相談事項）
- Plan管理（翌日の予定）
- コメント機能（上長からのフィードバック）
- 顧客マスタ管理
- 権限管理（一般営業、上長、管理者）

### 1.3 技術スタック

| カテゴリ             | 技術                     | 備考                                       |
| -------------------- | ------------------------ | ------------------------------------------ |
| **言語**             | TypeScript               | 型安全性を重視                             |
| **フレームワーク**   | Next.js 14+ (App Router) | React Server Components対応                |
| **UIコンポーネント** | shadcn/ui + Tailwind CSS | カスタマイズ可能なコンポーネントライブラリ |
| **APIスキーマ定義**  | OpenAPI (Zodによる検証)  | 型安全なAPI定義とバリデーション            |
| **DBスキーマ定義**   | Prisma.js                | 型安全なORMとマイグレーション管理          |
| **データベース**     | MySQL 8.0                | リレーショナルデータベース                 |
| **認証**             | JWT (JSON Web Token)     | Bearer認証                                 |
| **テスト**           | Vitest                   | 高速なユニットテストフレームワーク         |
| **E2Eテスト**        | Playwright               | ブラウザ自動化テスト                       |
| **デプロイ**         | Google Cloud Run         | コンテナベースのサーバーレス実行環境       |
| **CI/CD**            | GitHub Actions           | 自動テスト・デプロイパイプライン           |

#### 主要ライブラリ

**フロントエンド**

- React 18+ (Server Components対応)
- React Hook Form (フォーム管理)
- Zod (スキーマバリデーション)
- @tanstack/react-query (サーバーステート管理)
- date-fns (日付操作)

**バックエンド**

- Next.js API Routes (サーバーサイドAPI)
- Prisma Client (データベースアクセス)
- bcrypt (パスワードハッシュ化)
- jsonwebtoken (JWT生成・検証)

---

## 2. ドキュメント参照

このプロジェクトには以下の詳細仕様書があります。実装前に必ず参照してください。

### 2.1 API仕様書

📄 **ファイル**: `doc/API_SCHEME.md`

- すべてのAPIエンドポイントの仕様
- リクエスト/レスポンスフォーマット
- 認証・認可の仕様
- エラーハンドリング
- バリデーションルール

### 2.2 画面設計書

📄 **ファイル**: `doc/SCREEN_DESIGN.md`

- 全画面のレイアウトとUI仕様
- 画面遷移図
- 入力項目とバリデーション
- 権限による表示制御
- ユーザビリティ要件

### 2.3 テスト仕様書

📄 **ファイル**: `doc/TEST_DEFINITION.md`

- テスト方針と戦略
- 単体テスト、結合テスト、システムテストの仕様
- テストケース一覧
- 非機能テスト（性能、セキュリティ）
- テストデータ

---

## 3. データベース設計

### 3.1 主要テーブル

#### Sales（営業マスタ）

```prisma
model Sales {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(100)
  email       String   @unique @db.VarChar(255)
  password    String   @db.VarChar(255)
  department  String?  @db.VarChar(100)
  position    String?  @db.VarChar(50)
  managerId   Int?     @map("manager_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  manager     Sales?        @relation("ManagerSubordinates", fields: [managerId], references: [id])
  subordinates Sales[]      @relation("ManagerSubordinates")
  dailyReports DailyReport[]
  comments    Comment[]

  @@map("sales")
}
```

#### Customer（顧客マスタ）

```prisma
model Customer {
  id             Int      @id @default(autoincrement())
  name           String   @db.VarChar(200)
  contactPerson  String?  @db.VarChar(100) @map("contact_person")
  phone          String?  @db.VarChar(20)
  address        String?  @db.VarChar(255)
  industry       String?  @db.VarChar(100)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  visitRecords   VisitRecord[]

  @@map("customers")
}
```

#### DailyReport（日報）

```prisma
model DailyReport {
  id           Int      @id @default(autoincrement())
  salesId      Int      @map("sales_id")
  reportDate   DateTime @db.Date @map("report_date")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  sales        Sales          @relation(fields: [salesId], references: [id])
  visitRecords VisitRecord[]
  problems     Problem[]
  plans        Plan[]

  @@unique([salesId, reportDate])
  @@map("daily_reports")
}
```

#### VisitRecord（訪問記録）

```prisma
model VisitRecord {
  id              Int      @id @default(autoincrement())
  dailyReportId   Int      @map("daily_report_id")
  customerId      Int      @map("customer_id")
  visitContent    String   @db.Text @map("visit_content")
  visitStartTime  String?  @db.VarChar(8) @map("visit_start_time")
  visitEndTime    String?  @db.VarChar(8) @map("visit_end_time")
  createdAt       DateTime @default(now()) @map("created_at")

  dailyReport     DailyReport @relation(fields: [dailyReportId], references: [id], onDelete: Cascade)
  customer        Customer    @relation(fields: [customerId], references: [id])

  @@map("visit_records")
}
```

#### Problem（課題・相談）

```prisma
model Problem {
  id            Int      @id @default(autoincrement())
  dailyReportId Int      @map("daily_report_id")
  content       String   @db.Text
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id], onDelete: Cascade)
  comments      Comment[]

  @@map("problems")
}
```

#### Plan（明日の予定）

```prisma
model Plan {
  id            Int      @id @default(autoincrement())
  dailyReportId Int      @map("daily_report_id")
  content       String   @db.Text
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  dailyReport   DailyReport @relation(fields: [dailyReportId], references: [id], onDelete: Cascade)
  comments      Comment[]

  @@map("plans")
}
```

#### Comment（コメント）

```prisma
enum CommentTargetType {
  PROBLEM
  PLAN
}

model Comment {
  id          Int               @id @default(autoincrement())
  targetType  CommentTargetType @map("target_type")
  targetId    Int               @map("target_id")
  commenterId Int               @map("commenter_id")
  content     String            @db.Text
  createdAt   DateTime          @default(now()) @map("created_at")

  commenter   Sales    @relation(fields: [commenterId], references: [id])
  problem     Problem? @relation(fields: [targetId], references: [id], onDelete: Cascade)
  plan        Plan?    @relation(fields: [targetId], references: [id], onDelete: Cascade)

  @@map("comments")
}
```

### 3.2 データベース制約

- 日報は `(salesId, reportDate)` の組み合わせでユニーク
- 訪問記録、Problem、Planは日報削除時にカスケード削除
- 顧客は訪問記録が存在する場合は削除不可（アプリケーション層で制御）

---

## 4. 実装ガイドライン

### 4.1 API実装のルール

#### 認証・認可

```typescript
// すべての保護されたエンドポイントで認証チェック
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);
  if (!user) {
    return Response.json(
      { error: { code: 'INVALID_TOKEN', message: 'トークンが無効です' } },
      { status: 401 }
    );
  }

  // 処理続行
}
```

#### エラーレスポンス

すべてのエラーは `doc/API_SCHEME.md` のフォーマットに従うこと:

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [
      {
        "field": "フィールド名",
        "message": "詳細メッセージ"
      }
    ]
  }
}
```

#### バリデーション

Zodスキーマでバリデーションを実装:

```typescript
import { z } from 'zod';

const visitRecordSchema = z
  .object({
    customer_id: z.number().int().positive('顧客を選択してください'),
    visit_content: z
      .string()
      .min(1, '訪問内容を入力してください')
      .max(1000, '訪問内容は1000文字以内で入力してください'),
    visit_start_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    visit_end_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.visit_start_time && data.visit_end_time) {
        return data.visit_end_time > data.visit_start_time;
      }
      return true;
    },
    {
      message: '訪問終了時刻は開始時刻より後に設定してください',
      path: ['visit_end_time'],
    }
  );
```

### 4.2 フロントエンド実装のルール

#### コンポーネント設計

- **ページコンポーネント**: `app/` ディレクトリ（Next.js App Router）
- **再利用可能なUIコンポーネント**: `components/ui/`
- **機能コンポーネント**: `components/features/`
- **レイアウトコンポーネント**: `components/layouts/`

#### 状態管理

- サーバーステート: React Query (TanStack Query)
- クライアントステート: React Context または Zustand

#### フォーム実装

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const visitRecordSchema = z.object({
  customerId: z.number().min(1, '顧客を選択してください'),
  visitContent: z.string().min(1, '訪問内容を入力してください').max(1000),
  visitStartTime: z.string().optional(),
  visitEndTime: z.string().optional(),
});

type VisitRecordForm = z.infer<typeof visitRecordSchema>;

export function VisitRecordDialog() {
  const { register, handleSubmit, formState: { errors } } = useForm<VisitRecordForm>({
    resolver: zodResolver(visitRecordSchema),
  });

  const onSubmit = async (data: VisitRecordForm) => {
    // API呼び出し
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
    </form>
  );
}
```

#### 権限制御

```typescript
// components/auth/PermissionGuard.tsx
export function PermissionGuard({
  children,
  requiredRole
}: {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'admin'
}) {
  const { user } = useAuth();

  if (requiredRole === 'manager' && user.position !== '課長' && user.position !== '部長') {
    return null;
  }

  if (requiredRole === 'admin' && !user.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 5. テストコード作成時の厳守事項

### 5.1 絶対に守ってください！

#### テストコードの品質

- ✅ **テストは必ず実際の機能を検証すること**
- ❌ **`expect(true).toBe(true)` のような意味のないアサーションは絶対に書かない**
- ✅ **各テストケースは具体的な入力と期待される出力を検証すること**
- ✅ **モックは必要最小限に留め、実際の動作に近い形でテストすること**

#### ハードコーディングの禁止

- ❌ **テストを通すためだけのハードコードは絶対に禁止**
- ❌ **本番コードに `if (testMode)` のような条件分岐を入れない**
- ❌ **テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない**
- ✅ **環境変数や設定ファイルを使用して、テスト環境と本番環境を適切に分離すること**

#### テスト実装の原則

- ✅ **テストが失敗する状態から始めること（Red-Green-Refactor）**
- ✅ **境界値、異常系、エラーケースも必ずテストすること**
- ✅ **カバレッジだけでなく、実際の品質を重視すること**
- ✅ **テストケース名は何をテストしているか明確に記述すること**

#### 実装前の確認

- ✅ **機能の仕様を正しく理解してからテストを書くこと**
- ✅ **不明な点があれば、仮の実装ではなく、ユーザーに確認すること**

### 5.2 テスト例

#### 単体テスト（API）

```typescript
// __tests__/api/daily-reports.test.ts
import { POST } from '@/app/api/daily-reports/route';

describe('POST /api/daily-reports', () => {
  it('正常系: 日報作成成功', async () => {
    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_date: '2026-02-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.report_date).toBe('2026-02-01');
  });

  it('異常系: 報告日未入力', async () => {
    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid_token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('異常系: 認証トークンなし', async () => {
    const request = new Request('http://localhost/api/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_date: '2026-02-01' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});
```

#### E2Eテスト

```typescript
// e2e/daily-report.spec.ts
import { test, expect } from '@playwright/test';

test('日報作成から訪問記録追加までの一連の流れ', async ({ page }) => {
  // ログイン
  await page.goto('/login');
  await page.fill('input[name="email"]', 'yamada@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 日報一覧画面に遷移
  await expect(page).toHaveURL('/daily-reports');

  // 新規日報作成
  await page.click('text=新規日報作成');
  await page.selectOption('select[name="reportDate"]', '2026-02-01');

  // 訪問記録追加
  await page.click('text=+ 追加');
  await page.selectOption('select[name="customerId"]', '10');
  await page.fill('textarea[name="visitContent"]', '新商品のプレゼンテーションを実施');
  await page.click('text=保存');

  // 訪問記録が表示されることを確認
  await expect(page.locator('text=株式会社ABC商事')).toBeVisible();
  await expect(page.locator('text=新商品のプレゼンテーションを実施')).toBeVisible();
});
```

### 5.3 テスト実施基準

詳細は `doc/TEST_DEFINITION.md` を参照してください。

- **単体テスト**: コードカバレッジ80%以上
- **結合テスト**: 全テストケース実施、重大バグ0件
- **システムテスト**: 全テストケース実施、致命的バグ0件

---

## 6. セキュリティ要件

### 6.1 必須セキュリティ対策

#### 認証

- ✅ JWT（JSON Web Token）による認証
- ✅ パスワードのハッシュ化（bcrypt）
- ✅ トークンの有効期限管理（アクセストークン: 1時間、リフレッシュトークン: 30日）

#### 入力検証

- ✅ すべての入力値をバリデーション（Zod使用）
- ✅ SQLインジェクション対策（Prisma ORMを使用）
- ✅ XSS対策（入力値のサニタイズ）

#### HTTPS

- ✅ すべての通信をHTTPS経由で行う
- ✅ 本番環境ではHTTP接続を強制リダイレクト

#### CSRF対策

- ✅ CSRFトークンの実装

#### レート制限

- ✅ APIリクエストのレート制限
  - 一般ユーザー: 1000リクエスト/時間
  - 管理者: 5000リクエスト/時間

### 6.2 データ保護

- ✅ 個人情報の暗号化
- ✅ ログへの個人情報マスキング
- ✅ セッション管理の適切な実装

---

## 7. コーディング規約

### 7.1 TypeScript

- **厳格な型定義**: `any` 型の使用は原則禁止
- **Nullable型**: `undefined` または `null` を明示的に扱う
- **命名規則**:
  - 変数・関数: camelCase
  - コンポーネント: PascalCase
  - 定数: UPPER_SNAKE_CASE
  - プライベート変数: 先頭に `_` をつける

### 7.2 React/Next.js

- **関数コンポーネント**: クラスコンポーネントは使用しない
- **Hooks**: カスタムフックは `use` で始める
- **ファイル構成**: 1ファイル1コンポーネント
- **propsの型定義**: 必ず明示的に定義

### 7.3 コメント

- **必要な場所にのみコメントを書く**: 自明なコードにコメントは不要
- **JSDoc**: 公開APIや複雑な関数には記述
- **TODOコメント**: `// TODO: [担当者] 説明` の形式

### 7.4 フォーマット

- **Prettier**: 自動フォーマット
- **ESLint**: リンティングルール遵守

---

## 8. 開発ワークフロー

### 8.1 ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `bugfix/*`: バグ修正
- `hotfix/*`: 緊急修正

### 8.2 コミットメッセージ

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

**例**:

```
feat: 日報一覧画面に検索機能を追加

- 日付範囲検索を実装
- 営業担当者フィルターを追加
- ページネーションを実装

Closes #123
```

### 8.3 プルリクエスト

- **タイトル**: 変更内容を簡潔に
- **説明**:
  - 変更内容
  - 関連Issue
  - スクリーンショット（UI変更の場合）
  - テスト結果
- **レビュー**: 最低1人の承認が必要

---

## 9. Git Worktreeによる並列開発

### 9.1 概要

このプロジェクトでは、**Git Worktree**を使用して複数のIssueを並列で開発します。これにより、ブランチを切り替えることなく、複数の機能を同時に開発できます。

### 9.2 ディレクトリ構造

```
/Users/masa/Desktop/test/
├── nippo/                          # メインディレクトリ（feature/issue-6-10-daily-reports-api）
├── nippo-issue-11/                 # Issue #11-13用（訪問記録API）
├── nippo-issue-14/                 # Issue #14-16用（Problem API）
├── nippo-issue-17/                 # Issue #17-19用（Plan API）
└── ...                             # 必要に応じて追加
```

**重要**: すべてのworktreeディレクトリは同じGitリポジトリを共有しています。

### 9.3 Worktreeの作成

新しいIssueに取り組む際は、以下のコマンドでworktreeを作成します:

```bash
# 親ディレクトリに移動
cd /Users/masa/Desktop/test/

# Issue #11-13用のworktreeを作成
git worktree add nippo-issue-11 -b feature/issue-11-13-visit-record-api

# Issue #14-16用のworktreeを作成
git worktree add nippo-issue-14 -b feature/issue-14-16-problem-api

# Issue #17-19用のworktreeを作成
git worktree add nippo-issue-17 -b feature/issue-17-19-plan-api
```

### 9.4 Worktreeの確認

作成されたworktreeを確認するには:

```bash
git worktree list
```

出力例:

```
/Users/masa/Desktop/test/nippo           43bb2cc [feature/issue-6-10-daily-reports-api]
/Users/masa/Desktop/test/nippo-issue-11  43bb2cc [feature/issue-11-13-visit-record-api]
/Users/masa/Desktop/test/nippo-issue-14  43bb2cc [feature/issue-14-16-problem-api]
/Users/masa/Desktop/test/nippo-issue-17  43bb2cc [feature/issue-17-19-plan-api]
```

### 9.5 lint-stagedの設定

**重要**: worktreeディレクトリでもlint-stagedが動作するように、`package.json`の設定を以下のように変更済みです:

```json
"lint-staged": {
  "**/*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "**/*.{json,css,md}": [
    "prettier --write"
  ]
}
```

`**/*` の記法により、サブディレクトリのファイルも対象になります。

### 9.6 Huskyの初期化（Deprecated）

**注意**: Husky 9以降では、`husky install`コマンドはdeprecatedです。各worktreeディレクトリで自動的にGit hooksが有効化されます。

もし明示的に実行する必要がある場合:

```bash
cd /Users/masa/Desktop/test/nippo-issue-11
npx husky install
```

### 9.7 Worktreeでの作業フロー

各worktreeディレクトリで独立して作業できます:

```bash
# Issue #11-13のディレクトリに移動
cd /Users/masa/Desktop/test/nippo-issue-11

# 現在のブランチを確認
git branch
# * feature/issue-11-13-visit-record-api

# 通常通り開発
npm run dev
npm test
npm run lint

# コミット
git add .
git commit -m "feat: 訪問記録追加API実装"

# プッシュ
git push origin feature/issue-11-13-visit-record-api
```

### 9.8 サブエージェントによる並列開発

複数のClaude Codeエージェントを使用して並列開発を行う場合:

1. **各エージェント用のターミナルを開く**
   - VS Codeのターミナル分割機能を使用
   - または、複数のVS Codeウィンドウを開く

2. **各エージェントに異なるworktreeを割り当てる**
   - Agent 1: `/Users/masa/Desktop/test/nippo-issue-11` (訪問記録API)
   - Agent 2: `/Users/masa/Desktop/test/nippo-issue-14` (Problem API)
   - Agent 3: `/Users/masa/Desktop/test/nippo-issue-17` (Plan API)

3. **各エージェントが独立して作業**
   - それぞれのディレクトリで`npm run dev`を実行
   - それぞれが独立してコミット・プッシュ
   - コンフリクトを避けるため、異なるファイルを編集

### 9.9 Worktreeの削除

作業完了後、不要になったworktreeを削除:

```bash
# worktreeを削除
git worktree remove nippo-issue-11

# または、ディレクトリを削除してからprune
rm -rf nippo-issue-11
git worktree prune
```

### 9.10 注意事項

1. **同じブランチを複数のworktreeでチェックアウトできない**
   - 各worktreeは異なるブランチを使用する必要がある

2. **共有リソースの競合に注意**
   - データベース接続（ポート番号など）
   - 開発サーバーのポート（Next.jsのデフォルトは3000）
   - 各worktreeで異なるポートを使用: `PORT=3001 npm run dev`

3. **node_modulesは各ディレクトリに個別に存在**
   - 各worktreeで`npm install`を実行する必要がある

4. **Gitの状態は共有される**
   - あるworktreeでフェッチした内容は、他のworktreeでも反映される

5. **PRのマージ順序**
   - 依存関係のあるAPIは順番にマージする
   - 訪問記録・Problem・Plan APIは独立しているため、順不同でマージ可能

### 9.11 推奨される並列開発パターン

**パターン1: 3エージェント並列（推奨）**

```
Agent 1: Issue #11-13 (訪問記録API)  → nippo-issue-11
Agent 2: Issue #14-16 (Problem API)   → nippo-issue-14
Agent 3: Issue #17-19 (Plan API)      → nippo-issue-17
```

これらは互いに依存しないため、安全に並列開発できます。

**パターン2: 5エージェント並列（高速だが要注意）**

```
Agent 1: Issue #11-13 (訪問記録API)
Agent 2: Issue #14-16 (Problem API)
Agent 3: Issue #17-19 (Plan API)
Agent 4: Issue #24-28 (顧客マスタAPI)
Agent 5: Issue #29-30 (営業マスタAPI)
```

**避けるべきパターン**:

- Comment API（Issue #20-23）は、Problem/Plan API完了後に実装
- 同じファイルを複数のエージェントで編集

---

## 10. トラブルシューティング

### 10.1 よくある問題

#### Prismaのマイグレーションエラー

```bash
# マイグレーションをリセット
npx prisma migrate reset

# 新しいマイグレーションを作成
npx prisma migrate dev --name init
```

#### 認証エラー

- トークンの有効期限を確認
- 環境変数 `JWT_SECRET` が設定されているか確認

#### データベース接続エラー

- `.env` ファイルの `DATABASE_URL` を確認
- データベースが起動しているか確認

---

## 11. 参考リンク

### 公式ドキュメント

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)

### プロジェクト固有

#### 画面設計

@doc/SCREEN_DESIGN.md

#### API仕様書

@doc/API_SCHEME.md

#### テスト仕様書

@doc/TEST_DEFINITION.md

---

## 改訂履歴

| バージョン | 日付       | 作成者 | 変更内容                         |
| ---------- | ---------- | ------ | -------------------------------- |
| 1.1        | 2026-02-02 | Claude | Git Worktreeによる並列開発を追加 |
| 1.0        | 2026-02-01 | Claude | 初版作成                         |
