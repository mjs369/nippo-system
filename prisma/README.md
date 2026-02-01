# Prisma スキーマドキュメント

このディレクトリには、営業日報システムのデータベーススキーマとマイグレーションファイルが含まれています。

## 📁 ファイル構成

```
prisma/
├── schema.prisma      # データベーススキーマ定義
├── seed.ts           # シードデータ（初期データ投入用）
├── migrations/       # マイグレーションファイル
└── README.md         # このファイル
```

## 🗂️ データベーススキーマ概要

### テーブル一覧

| テーブル名                 | 説明                     | 主要なリレーション            |
| -------------------------- | ------------------------ | ----------------------------- |
| **営業マスタ** (Sales)     | 営業担当者の情報         | 日報、コメント、上長-部下関係 |
| **顧客マスタ** (Customer)  | 顧客情報                 | 訪問記録                      |
| **日報** (DailyReport)     | 日報の基本情報           | 訪問記録、Problem、Plan       |
| **訪問記録** (VisitRecord) | 顧客訪問の詳細           | 日報、顧客                    |
| **Problem**                | 課題・相談事項           | 日報、コメント                |
| **Plan**                   | 明日の予定               | 日報、コメント                |
| **コメント** (Comment)     | 上長からのフィードバック | 営業、Problem/Plan            |

### 主要なリレーション

```
営業マスタ 1 ──┬─── * 日報
             ├─── * コメント
             └─── * 営業マスタ (上長-部下)

顧客マスタ 1 ───── * 訪問記録

日報 1 ──┬─── * 訪問記録
        ├─── * Problem
        └─── * Plan

Problem 1 ───── * コメント
Plan 1 ───── * コメント
```

### カスケード削除

以下の削除は自動的にカスケードされます:

- **日報削除** → 訪問記録、Problem、Plan も削除
- **Problem削除** → Problemへのコメント も削除
- **Plan削除** → Planへのコメント も削除
- **営業削除** → その営業の日報、コメント も削除

## 🚀 セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルにデータベース接続情報を設定:

```env
DATABASE_URL="mysql://user:password@localhost:3306/nippo"
```

### 2. Prismaクライアントの生成

```bash
npm run prisma:generate
```

### 3. マイグレーションの実行

```bash
# 初回または新しいマイグレーションを適用
npm run prisma:migrate

# マイグレーション名を指定する場合
npx prisma migrate dev --name init
```

### 4. シードデータの投入

```bash
npm run prisma:seed
```

これにより、以下のテストデータが作成されます:

- 営業マスタ: 7件（部長1、課長2、一般営業4）
- 顧客マスタ: 5件
- サンプル日報: 1件（訪問記録3件、Problem2件、Plan2件、コメント1件）

**ログイン情報:**

- メールアドレス: `yamada@example.com`
- パスワード: `password123`

### 5. データベースのリセット（注意）

```bash
# すべてのデータを削除して、マイグレーションとシードを再実行
npm run prisma:reset
```

⚠️ **警告**: このコマンドはすべてのデータを削除します。本番環境では絶対に実行しないでください。

## 🔍 Prisma Studioでデータ確認

GUIでデータベースの内容を確認・編集できます:

```bash
npm run prisma:studio
```

ブラウザで [http://localhost:5555](http://localhost:5555) が開きます。

## 📝 スキーマの変更方法

### 1. schema.prismaを編集

例: 新しいフィールドを追加

```prisma
model Customer {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(200)
  // 新しいフィールドを追加
  website       String?  @db.VarChar(255)
  // ...
}
```

### 2. マイグレーションファイルを作成

```bash
npx prisma migrate dev --name add_customer_website
```

### 3. Prismaクライアントを再生成

```bash
npm run prisma:generate
```

## 💡 よく使うPrismaコマンド

```bash
# スキーマを検証
npx prisma validate

# データベースとスキーマの差分を確認
npx prisma migrate status

# スキーマからデータベースを作成（開発用）
npx prisma db push

# データベースからスキーマを生成（既存DBがある場合）
npx prisma db pull

# マイグレーションをロールバック
npx prisma migrate resolve --rolled-back <migration_name>
```

## 🔐 セキュリティ考慮事項

### パスワードのハッシュ化

営業マスタの `password` フィールドは、必ずbcryptでハッシュ化してから保存してください:

```typescript
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(plainPassword, 10);

await prisma.sales.create({
  data: {
    email: 'user@example.com',
    password: hashedPassword, // ハッシュ化されたパスワード
    // ...
  },
});
```

### SQLインジェクション対策

Prismaは自動的にパラメータ化クエリを使用するため、SQLインジェクションから保護されています。

```typescript
// ✅ 安全（Prismaが自動的にエスケープ）
const user = await prisma.sales.findUnique({
  where: { email: userInput },
});

// ❌ 使用禁止: 生のSQLは避ける
// await prisma.$executeRawUnsafe(`SELECT * FROM sales WHERE email = '${userInput}'`);
```

## 📊 データベース設計の詳細

### ユニーク制約

- **営業マスタ**: `email` フィールドは一意
- **日報**: 同じ営業が同じ日付に複数の日報を作成できない (`salesId`, `reportDate` の組み合わせが一意)

### インデックス

- **コメント**: `targetType` と `targetId` の複合インデックス（検索パフォーマンス向上）

### Enum型

**CommentTargetType**:

- `PROBLEM`: Problemへのコメント
- `PLAN`: Planへのコメント

## 🐛 トラブルシューティング

### マイグレーションが失敗する

```bash
# マイグレーションの状態を確認
npx prisma migrate status

# マイグレーションを手動でロールバック
npx prisma migrate resolve --rolled-back <migration_name>

# データベースをリセットして再試行
npm run prisma:reset
```

### Prismaクライアントが見つからない

```bash
# Prismaクライアントを再生成
npm run prisma:generate
```

### データベース接続エラー

- `.env.local` ファイルの `DATABASE_URL` を確認
- MySQLサーバーが起動しているか確認
- データベースが存在するか確認

```bash
# MySQLに接続してデータベースを確認
mysql -u user -p
mysql> SHOW DATABASES;
mysql> USE nippo;
```

## 📚 参考リンク

- [Prisma公式ドキュメント](https://www.prisma.io/docs)
- [Prismaスキーマリファレンス](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prismaクライアント API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## ER図

詳細なER図は [ER_DIAGRAM.md](../doc/ER_DIAGRAM.md) を参照してください。
