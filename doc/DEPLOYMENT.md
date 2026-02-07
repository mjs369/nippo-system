# 営業日報システム デプロイ手順書

## 目次

1. [概要](#1-概要)
2. [事前準備](#2-事前準備)
3. [ローカル環境でのDocker実行](#3-ローカル環境でのdocker実行)
4. [Google Cloud Platform 初期設定](#4-google-cloud-platform-初期設定)
5. [Cloud SQLデータベースのセットアップ](#5-cloud-sqlデータベースのセットアップ)
6. [Secret Managerでの機密情報管理](#6-secret-managerでの機密情報管理)
7. [Cloud Runへのデプロイ](#7-cloud-runへのデプロイ)
8. [継続的デプロイメント（CI/CD）の設定](#8-継続的デプロイメントcicdの設定)
9. [デプロイ後の確認](#9-デプロイ後の確認)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 概要

このドキュメントは、営業日報システムをGoogle Cloud Run（GCR）にデプロイする手順を説明します。

### 1.1 デプロイ構成

```
┌─────────────────────────────────────────┐
│          Google Cloud Platform          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │       Cloud Run                    │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │  Next.js Application        │  │ │
│  │  │  (Container)                │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
│                  ↓                      │
│  ┌───────────────────────────────────┐ │
│  │       Cloud SQL (MySQL 8.0)       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │       Secret Manager              │ │
│  │  - DATABASE_URL                   │ │
│  │  - JWT_SECRET                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │    Container Registry (GCR)       │ │
│  │  - Dockerイメージ保存             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 1.2 推奨リソース

| リソース  | スペック         | 説明                     |
| --------- | ---------------- | ------------------------ |
| Cloud Run | 1vCPU, 512MB RAM | アプリケーションサーバー |
| Cloud SQL | db-f1-micro      | 開発・検証環境用         |
| Cloud SQL | db-n1-standard-1 | 本番環境用               |

---

## 2. 事前準備

### 2.1 必要なツールのインストール

#### macOS / Linux

```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Docker Desktop
# https://www.docker.com/products/docker-desktop からダウンロード

# Node.js 20
# https://nodejs.org/ からダウンロード、またはnvm使用
```

#### Windows

```powershell
# Google Cloud SDK
# https://cloud.google.com/sdk/docs/install からインストーラーをダウンロード

# Docker Desktop
# https://www.docker.com/products/docker-desktop からダウンロード

# Node.js 20
# https://nodejs.org/ からダウンロード
```

### 2.2 ツールのバージョン確認

```bash
gcloud --version
docker --version
node --version
npm --version
```

### 2.3 プロジェクトのクローン

```bash
git clone https://github.com/your-org/nippo.git
cd nippo
npm install
```

---

## 3. ローカル環境でのDocker実行

デプロイ前に、ローカル環境でDockerコンテナを実行して動作確認します。

### 3.1 環境変数の設定

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集
# エディタで開いて必要な値を設定
vi .env
```

**最小限の設定例（.env）**:

```env
DATABASE_URL="mysql://nippo_user:nippo_password@localhost:3306/nippo"
JWT_SECRET="your-secret-key-please-change-this"
JWT_EXPIRES_IN="1h"
NODE_ENV="development"
```

### 3.2 Dockerコンテナの起動

```bash
# MySQLコンテナのみ起動
docker-compose up -d mysql

# MySQLが起動するまで待機（約30秒）
docker-compose logs -f mysql
# "ready for connections" が表示されたらCtrl+Cで抜ける

# Prismaマイグレーション実行
npm run prisma:migrate

# 初期データ投入（オプション）
npm run prisma:seed

# アプリケーションコンテナをビルド＆起動
docker-compose up -d app

# ログ確認
docker-compose logs -f app
```

### 3.3 動作確認

ブラウザで http://localhost:3000 を開き、アプリケーションが正常に表示されることを確認します。

### 3.4 コンテナの停止

```bash
docker-compose down
```

---

## 4. Google Cloud Platform 初期設定

### 4.1 GCPプロジェクトの作成

```bash
# GCPにログイン
gcloud auth login

# プロジェクトを作成
export PROJECT_ID="nippo-production"
gcloud projects create $PROJECT_ID --name="営業日報システム"

# プロジェクトを選択
gcloud config set project $PROJECT_ID

# 請求先アカウントをリンク（GCPコンソールで設定済みの場合はスキップ）
# https://console.cloud.google.com/billing
```

### 4.2 必要なAPIの有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry API
gcloud services enable artifactregistry.googleapis.com
```

### 4.3 デフォルトリージョンの設定

```bash
# 東京リージョンを使用
gcloud config set run/region asia-northeast1
gcloud config set compute/region asia-northeast1
gcloud config set compute/zone asia-northeast1-a
```

---

## 5. Cloud SQLデータベースのセットアップ

### 5.1 Cloud SQLインスタンスの作成

```bash
# インスタンス名を設定
export INSTANCE_NAME="nippo-db"

# Cloud SQLインスタンスを作成（開発環境用: db-f1-micro）
gcloud sql instances create $INSTANCE_NAME \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-northeast1 \
  --root-password="YOUR_ROOT_PASSWORD" \
  --backup \
  --backup-start-time=03:00

# 本番環境用はより高性能なインスタンスを推奨
# --tier=db-n1-standard-1

# 作成完了まで約5-10分かかります
```

### 5.2 データベースとユーザーの作成

```bash
# データベースを作成
gcloud sql databases create nippo \
  --instance=$INSTANCE_NAME

# ユーザーを作成
gcloud sql users create nippo_user \
  --instance=$INSTANCE_NAME \
  --password="YOUR_DB_PASSWORD"
```

### 5.3 Cloud SQL Proxyの設定（ローカルからの接続確認）

```bash
# Cloud SQL Proxyをダウンロード（macOS/Linux）
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Cloud SQL Proxyを起動
./cloud-sql-proxy $PROJECT_ID:asia-northeast1:$INSTANCE_NAME
```

別のターミナルで接続確認:

```bash
mysql -u nippo_user -p -h 127.0.0.1 --port=3306
# パスワード入力後、MySQLに接続できればOK
```

### 5.4 Prismaマイグレーションの実行

```bash
# DATABASE_URLを設定（Cloud SQL Proxy経由）
export DATABASE_URL="mysql://nippo_user:YOUR_DB_PASSWORD@127.0.0.1:3306/nippo"

# マイグレーション実行
npm run prisma:migrate

# 初期データ投入（必要に応じて）
npm run prisma:seed
```

---

## 6. Secret Managerでの機密情報管理

### 6.1 シークレットの作成

```bash
# JWT_SECRETの作成
echo -n "your-super-secret-jwt-key-$(openssl rand -hex 32)" | \
  gcloud secrets create nippo-jwt-secret \
    --data-file=- \
    --replication-policy="automatic"

# DATABASE_URLの作成
# Unixソケット接続形式
echo -n "mysql://nippo_user:YOUR_DB_PASSWORD@localhost/nippo?socket=/cloudsql/$PROJECT_ID:asia-northeast1:$INSTANCE_NAME" | \
  gcloud secrets create nippo-database-url \
    --data-file=- \
    --replication-policy="automatic"
```

### 6.2 シークレットへのアクセス権限設定

```bash
# Cloud Runのサービスアカウントにシークレットアクセス権限を付与
export SERVICE_ACCOUNT="$PROJECT_ID@appspot.gserviceaccount.com"

gcloud secrets add-iam-policy-binding nippo-jwt-secret \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding nippo-database-url \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 7. Cloud Runへのデプロイ

### 7.1 Dockerイメージのビルド

```bash
# Artifact Registryにリポジトリを作成
gcloud artifacts repositories create nippo-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="営業日報システムのDockerイメージ"

# Docker認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Dockerイメージのビルド
docker build -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/nippo-repo/nippo-app:latest .

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/nippo-repo/nippo-app:latest
```

### 7.2 Cloud Runサービスのデプロイ

```bash
# DATABASE_URLとJWT_SECRETの取得
DB_URL=$(gcloud secrets versions access latest --secret="nippo-database-url")
JWT_SECRET=$(gcloud secrets versions access latest --secret="nippo-jwt-secret")

# Cloud Runにデプロイ
gcloud run deploy nippo-app \
  --image=asia-northeast1-docker.pkg.dev/$PROJECT_ID/nippo-repo/nippo-app:latest \
  --platform=managed \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="NODE_ENV=production,JWT_EXPIRES_IN=1h" \
  --set-secrets="DATABASE_URL=nippo-database-url:latest,JWT_SECRET=nippo-jwt-secret:latest" \
  --add-cloudsql-instances="$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"

# デプロイ完了後、URLが表示されます
# 例: https://nippo-app-xxxxxxxxxx-an.a.run.app
```

### 7.3 カスタムドメインの設定（オプション）

```bash
# カスタムドメインをマッピング
gcloud run domain-mappings create \
  --service=nippo-app \
  --domain=nippo.your-domain.com \
  --region=asia-northeast1

# 表示されるDNSレコードをドメインレジストラに設定してください
```

---

## 8. 継続的デプロイメント（CI/CD）の設定

### 8.1 Cloud Buildトリガーの作成

```bash
# GitHubリポジトリを接続
# GCPコンソール > Cloud Build > トリガー > リポジトリを接続
# https://console.cloud.google.com/cloud-build/triggers

# トリガーを作成
gcloud builds triggers create github \
  --name="nippo-deploy-trigger" \
  --repo-name="nippo" \
  --repo-owner="your-github-org" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_CLOUD_SQL_CONNECTION_NAME=$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"
```

### 8.2 Cloud Build設定ファイルの確認

プロジェクトルートの `cloudbuild.yaml` を確認してください。

```yaml
# 主な設定内容:
# 1. Dockerイメージのビルド
# 2. Artifact Registryへのプッシュ
# 3. Cloud Runへのデプロイ
```

### 8.3 自動デプロイのテスト

```bash
# mainブランチにプッシュすると自動デプロイが実行されます
git add .
git commit -m "feat: 新機能追加"
git push origin main

# Cloud Buildの進行状況を確認
gcloud builds list --limit=5
```

---

## 9. デプロイ後の確認

### 9.1 ヘルスチェック

```bash
# Cloud Runサービスのヘルスチェック
curl https://nippo-app-xxxxxxxxxx-an.a.run.app/api/health
```

期待される応答:

```json
{
  "status": "ok",
  "timestamp": "2026-02-07T10:00:00.000Z"
}
```

### 9.2 データベース接続確認

```bash
# ログを確認
gcloud run logs read nippo-app --limit=50
```

### 9.3 エンドポイントのテスト

```bash
# ログインAPIのテスト
curl -X POST https://your-cloud-run-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 10. トラブルシューティング

### 10.1 よくある問題と解決方法

#### 問題1: Cloud Runがデータベースに接続できない

**症状**:

```
Error: Connection to database failed
```

**解決方法**:

```bash
# 1. Cloud SQLインスタンスが起動しているか確認
gcloud sql instances describe $INSTANCE_NAME

# 2. Cloud RunサービスがCloud SQL接続設定を持っているか確認
gcloud run services describe nippo-app --region=asia-northeast1 --format=yaml | grep cloudsql

# 3. DATABASE_URLのシークレットが正しいか確認
gcloud secrets versions access latest --secret="nippo-database-url"

# 4. サービスアカウントに Cloud SQL Client 権限があるか確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/cloudsql.client"
```

#### 問題2: 403 Forbiddenエラー

**症状**:

```
Error 403: Forbidden
```

**解決方法**:

```bash
# Cloud Runサービスを一般公開する
gcloud run services add-iam-policy-binding nippo-app \
  --region=asia-northeast1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

#### 問題3: メモリ不足エラー

**症状**:

```
Container killed due to memory limit
```

**解決方法**:

```bash
# メモリを増やして再デプロイ
gcloud run services update nippo-app \
  --region=asia-northeast1 \
  --memory=1Gi
```

#### 問題4: Dockerビルドが失敗する

**症状**:

```
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully
```

**解決方法**:

```bash
# ローカルでビルドをテスト
docker build -t test-build .

# エラーの詳細を確認
docker build --no-cache -t test-build . 2>&1 | tee build.log

# next.config.jsの設定を確認
cat next.config.js

# package.jsonのビルドスクリプトを確認
npm run build
```

### 10.2 ログの確認方法

```bash
# Cloud Runのログをリアルタイムで表示
gcloud run logs tail nippo-app --region=asia-northeast1

# 過去1時間のログを表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nippo-app" \
  --limit=100 \
  --freshness=1h

# エラーログのみ表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nippo-app AND severity>=ERROR" \
  --limit=50
```

### 10.3 データベースのバックアップ

```bash
# オンデマンドバックアップの作成
gcloud sql backups create \
  --instance=$INSTANCE_NAME \
  --description="手動バックアップ $(date +%Y%m%d-%H%M%S)"

# バックアップ一覧を確認
gcloud sql backups list --instance=$INSTANCE_NAME

# バックアップから復元
gcloud sql backups restore BACKUP_ID \
  --backup-instance=$INSTANCE_NAME \
  --backup-id=BACKUP_ID
```

### 10.4 リソースの削除（検証環境のクリーンアップ）

```bash
# Cloud Runサービスの削除
gcloud run services delete nippo-app --region=asia-northeast1

# Cloud SQLインスタンスの削除
gcloud sql instances delete $INSTANCE_NAME

# Artifact Registryリポジトリの削除
gcloud artifacts repositories delete nippo-repo --location=asia-northeast1

# シークレットの削除
gcloud secrets delete nippo-jwt-secret
gcloud secrets delete nippo-database-url
```

---

## 11. セキュリティベストプラクティス

### 11.1 環境変数とシークレットの管理

- ❌ `.env`ファイルをGitにコミットしない
- ✅ Secret Managerを使用して機密情報を管理
- ✅ JWT_SECRETは最低32バイトのランダム文字列を使用
- ✅ 本番環境とステージング環境でシークレットを分ける

### 11.2 IAM権限の最小化

```bash
# サービスアカウントに最小限の権限のみ付与
# - Cloud SQL Client
# - Secret Manager Secret Accessor
# - Artifact Registry Reader（デプロイ時）
```

### 11.3 ネットワークセキュリティ

```bash
# Cloud SQLへのアクセスを制限
# - パブリックIPを無効化
# - プライベートIPのみ使用
# - 認可されたネットワークのみ許可

gcloud sql instances patch $INSTANCE_NAME \
  --no-assign-ip \
  --network=projects/$PROJECT_ID/global/networks/default
```

---

## 12. パフォーマンス最適化

### 12.1 Cloud Runの自動スケーリング設定

```bash
# 最大インスタンス数を設定
gcloud run services update nippo-app \
  --region=asia-northeast1 \
  --max-instances=20

# 最小インスタンス数を設定（コールドスタート対策）
gcloud run services update nippo-app \
  --region=asia-northeast1 \
  --min-instances=1
```

### 12.2 Cloud SQLのパフォーマンス改善

```bash
# インスタンスのスペックアップ
gcloud sql instances patch $INSTANCE_NAME \
  --tier=db-n1-standard-2

# 自動ストレージ拡張の有効化
gcloud sql instances patch $INSTANCE_NAME \
  --enable-automatic-increase-storage \
  --storage-auto-increase-limit=100
```

---

## 改訂履歴

| バージョン | 日付       | 作成者 | 変更内容 |
| ---------- | ---------- | ------ | -------- |
| 1.0        | 2026-02-07 | Claude | 初版作成 |
