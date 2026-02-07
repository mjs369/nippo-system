# 営業日報システム デプロイ手順書（初心者向け）

> 💡 **このドキュメントについて**
> このガイドは、プログラミング経験が少ない方でもGoogle Cloud Runに営業日報システムをデプロイできるように作成されています。各ステップを順番に実行してください。

## 📋 目次

- [はじめに](#はじめに)
- [事前準備](#事前準備)
- [ステップ1: Google Cloud Platform の準備](#ステップ1-google-cloud-platform-の準備)
- [ステップ2: データベースの作成](#ステップ2-データベースの作成)
- [ステップ3: 機密情報の登録](#ステップ3-機密情報の登録)
- [ステップ4: アプリケーションのデプロイ](#ステップ4-アプリケーションのデプロイ)
- [ステップ5: 動作確認](#ステップ5-動作確認)
- [トラブルシューティング](#トラブルシューティング)

---

## はじめに

### このガイドでできること

✅ 営業日報システムをインターネット上に公開
✅ 誰でもブラウザからアクセスできる状態にする
✅ データベースと連携した本番環境を構築

### 必要な時間

⏱️ **合計: 約60〜90分**

- 事前準備: 15分
- ステップ1: 10分
- ステップ2: 15分
- ステップ3: 10分
- ステップ4: 20分
- ステップ5: 10分

### 用語集

| 用語               | 説明                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| **CLI**            | コマンドライン・インターフェース。黒い画面で文字を打ち込んで操作する方法         |
| **ターミナル**     | コマンドを入力する黒い画面のこと（Macは「ターミナル」、Windowsは「PowerShell」） |
| **GCP**            | Google Cloud Platform。Googleが提供するクラウドサービス                          |
| **Cloud Run**      | Googleのサーバーでアプリケーションを動かすサービス                               |
| **Cloud SQL**      | Googleのデータベースサービス（MySQL）                                            |
| **コマンド**       | ターミナルに入力する命令文                                                       |
| **プロジェクトID** | GCP上でシステムを識別するための名前（半角英数字とハイフン）                      |

---

## 事前準備

### ✅ チェックリスト

作業を始める前に、以下が揃っていることを確認してください。

- [ ] **Googleアカウント**を持っている
- [ ] **クレジットカード**を登録できる（GCPの無料枠を使用しますが、登録は必須です）
- [ ] **パソコン**がある（Mac、Windows、Linuxどれでも可）
- [ ] **インターネット接続**がある

### 1. Google Cloud SDKのインストール

> 💡 **このステップの目的**
> Google Cloudをコマンドラインから操作するためのツールをインストールします。

#### Macの場合

**⏱️ 所要時間: 5分**

1. **ターミナルを開く**
   - アプリケーション → ユーティリティ → ターミナル

2. **以下のコマンドを実行**

   ```bash
   curl https://sdk.cloud.google.com | bash
   ```

   > 📝 **このコマンドは何をする？**
   > Google Cloud SDKをダウンロードしてインストールします。

3. **インストール中の質問には全て「Y」（はい）と答える**

4. **ターミナルを再起動**

   ```bash
   exec -l $SHELL
   ```

5. **✅ インストール確認**

   ```bash
   gcloud --version
   ```

   > ✅ **成功の確認方法**
   > 「Google Cloud SDK 〇〇〇」のようなバージョン情報が表示されればOK

#### Windowsの場合

**⏱️ 所要時間: 5分**

1. **以下のリンクからインストーラーをダウンロード**

   https://cloud.google.com/sdk/docs/install

2. **ダウンロードした `GoogleCloudSDKInstaller.exe` を実行**

3. **インストーラーの指示に従う**
   - すべてデフォルト設定でOK

4. **PowerShellを開く**
   - スタートメニュー → Windows PowerShell

5. **✅ インストール確認**

   ```powershell
   gcloud --version
   ```

   > ✅ **成功の確認方法**
   > 「Google Cloud SDK 〇〇〇」のようなバージョン情報が表示されればOK

### 2. プロジェクトのダウンロード

**⏱️ 所要時間: 3分**

1. **プロジェクトのディレクトリに移動**

   ```bash
   cd /path/to/nippo
   ```

   > 📝 **`/path/to/nippo`は何？**
   > あなたのパソコン内でプロジェクトが保存されている場所のパス（例: `~/Desktop/nippo`）

2. **必要なファイルがあるか確認**

   ```bash
   ls -la
   ```

   > ✅ **成功の確認方法**
   > `Dockerfile`, `docker-compose.yml`, `package.json` などのファイルが表示されればOK

---

## ステップ1: Google Cloud Platform の準備

**⏱️ 所要時間: 10分**

### 1-1. Googleアカウントでログイン

```bash
gcloud auth login
```

> 📝 **このコマンドは何をする？**
> ブラウザが開いて、Googleアカウントでログインします。

> ✅ **成功の確認方法**
> ブラウザで「認証が完了しました」と表示され、ターミナルに「You are now logged in as [your-email@gmail.com]」と表示される

**🚨 エラーが出た場合:**

- ブラウザが開かない → 手動でURLをコピーしてブラウザに貼り付け
- 「アクセスが拒否されました」→ Googleアカウントのセキュリティ設定を確認

### 1-2. GCPプロジェクトの作成

> 💡 **プロジェクトIDについて**
> プロジェクトIDは世界中で一意である必要があります。以下のルールで決めてください：
>
> - 半角英数字とハイフンのみ
> - 6〜30文字
> - 例: `nippo-production-2026` や `my-nippo-system`

**□ 1-2-1. プロジェクトIDを決める**

あなたのプロジェクトIDを決めて、以下のコマンドの `YOUR_PROJECT_ID` を置き換えてください。

```bash
# 例: export PROJECT_ID="nippo-production-2026"
export PROJECT_ID="YOUR_PROJECT_ID"
```

> 📝 **`export` コマンドは何をする？**
> 変数を設定して、後続のコマンドで使えるようにします。

**□ 1-2-2. プロジェクトを作成**

```bash
gcloud projects create $PROJECT_ID --name="営業日報システム"
```

> ✅ **成功の確認方法**
> 「Create in progress for [https://cloudresourcemanager.googleapis.com/v1/projects/YOUR_PROJECT_ID]」と表示される

**🚨 エラーが出た場合:**

- 「already exists」→ 別のプロジェクトIDを試してください
- 「PERMISSION_DENIED」→ GCPアカウントに請求先が設定されているか確認

**□ 1-2-3. プロジェクトを選択**

```bash
gcloud config set project $PROJECT_ID
```

> ✅ **成功の確認方法**
> 「Updated property [core/project]」と表示される

**□ 1-2-4. 請求先アカウントをリンク（重要！）**

> ⚠️ **注意**
> この手順は必須です。無料枠を使用する場合でも、クレジットカード登録が必要です。

1. ブラウザで以下のURLを開く:

   ```
   https://console.cloud.google.com/billing
   ```

2. 「請求先アカウントをリンク」をクリック

3. クレジットカード情報を入力

4. プロジェクトを選択してリンク

> 💰 **料金について**
> GCPには$300の無料クレジットがあります。このシステムは月額数百円〜数千円で運用できます。

### 1-3. 必要なAPIを有効化

> 💡 **このステップの目的**
> Google Cloudの各種サービスを使えるようにします。

```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

> 📝 **各APIの説明**
>
> - `run.googleapis.com`: Cloud Run（アプリを動かす）
> - `sqladmin.googleapis.com`: Cloud SQL（データベース）
> - `secretmanager.googleapis.com`: Secret Manager（パスワード管理）
> - `containerregistry.googleapis.com`: Container Registry（アプリの保管庫）
> - `cloudbuild.googleapis.com`: Cloud Build（自動デプロイ）
> - `artifactregistry.googleapis.com`: Artifact Registry（イメージ保管）

**⏱️ 所要時間: 各API 10〜30秒（合計2〜3分）**

> ✅ **成功の確認方法**
> 各コマンドで「Operation "operations/..." finished successfully.」と表示される

**🚨 エラーが出た場合:**

- 「PERMISSION_DENIED」→ プロジェクトが正しく選択されているか確認: `gcloud config get-value project`
- 時間がかかる場合は待つ（最大5分）

### 1-4. デフォルトリージョンの設定

> 💡 **リージョンとは？**
> サーバーの物理的な場所です。日本に近い「東京リージョン」を使うと速度が速くなります。

```bash
gcloud config set run/region asia-northeast1
gcloud config set compute/region asia-northeast1
gcloud config set compute/zone asia-northeast1-a
```

> ✅ **成功の確認方法**
> 各コマンドで「Updated property」と表示される

**✅ ステップ1完了チェック**

- [ ] Google Cloud SDKをインストールした
- [ ] Googleアカウントでログインした
- [ ] GCPプロジェクトを作成した
- [ ] 請求先アカウントをリンクした
- [ ] 必要なAPIを有効化した
- [ ] リージョンを設定した

---

## ステップ2: データベースの作成

**⏱️ 所要時間: 15分**

> 💡 **このステップの目的**
> 営業日報のデータを保存するデータベース（MySQL）を作成します。

### 2-1. Cloud SQLインスタンスの作成

**□ 2-1-1. インスタンス名を決める**

```bash
export INSTANCE_NAME="nippo-db"
```

> 📝 **インスタンス名のルール**
>
> - 半角英数字とハイフン
> - 最初と最後は文字または数字
> - 例: `nippo-db`, `sales-database`

**□ 2-1-2. ルートパスワードを決める**

> ⚠️ **重要**
> パスワードは後で使うので、メモしておいてください。

```bash
# 強力なパスワードを設定してください（12文字以上推奨）
export ROOT_PASSWORD="YOUR_SECURE_ROOT_PASSWORD"
```

**□ 2-1-3. Cloud SQLインスタンスを作成**

```bash
gcloud sql instances create $INSTANCE_NAME \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-northeast1 \
  --root-password="$ROOT_PASSWORD" \
  --backup \
  --backup-start-time=03:00
```

> 📝 **このコマンドの説明**
>
> - `--database-version=MYSQL_8_0`: MySQLバージョン8.0を使用
> - `--tier=db-f1-micro`: 最小スペック（開発・小規模用）
> - `--region=asia-northeast1`: 東京リージョン
> - `--backup`: 自動バックアップを有効化
> - `--backup-start-time=03:00`: 午前3時にバックアップ

**⏱️ 所要時間: 5〜10分**

> ⏳ **処理中の表示**
> 「Creating Cloud SQL instance...done.」と表示されるまで待ちます。コーヒーを飲んで休憩しましょう☕

> ✅ **成功の確認方法**
> 「Created [https://sqladmin.googleapis.com/sql/v1beta4/projects/.../instances/nippo-db]」と表示される

**🚨 エラーが出た場合:**

- 「already exists」→ 別のインスタンス名を試す
- 「QUOTA_EXCEEDED」→ GCPの無料枠を超えている可能性。料金確認
- タイムアウト → コマンドを再実行

**□ 2-1-4. インスタンスの状態を確認**

```bash
gcloud sql instances describe $INSTANCE_NAME
```

> ✅ **成功の確認方法**
> `state: RUNNABLE` と表示されればOK

### 2-2. データベースとユーザーの作成

**□ 2-2-1. データベースを作成**

```bash
gcloud sql databases create nippo --instance=$INSTANCE_NAME
```

> 📝 **このコマンドは何をする？**
> `nippo`という名前のデータベースを作成します。ここに日報データが保存されます。

> ✅ **成功の確認方法**
> 「Created database [nippo]」と表示される

**□ 2-2-2. データベース用のパスワードを決める**

```bash
# メモしておいてください
export DB_PASSWORD="YOUR_SECURE_DB_PASSWORD"
```

**□ 2-2-3. データベースユーザーを作成**

```bash
gcloud sql users create nippo_user \
  --instance=$INSTANCE_NAME \
  --password="$DB_PASSWORD"
```

> 📝 **このコマンドは何をする？**
> アプリケーションがデータベースにアクセスするための専用ユーザーを作成します。

> ✅ **成功の確認方法**
> 何も表示されないか、「Created user [nippo_user]」と表示される

### 2-3. データベースへの接続確認（オプション）

> 💡 **このステップの目的**
> データベースが正しく作成されたか確認します。スキップしても問題ありません。

**□ 2-3-1. Cloud SQL Proxyをダウンロード**

```bash
# Macの場合
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Windowsの場合
# https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.x64.exe
# をダウンロード
```

**□ 2-3-2. Cloud SQL Proxyを起動**

```bash
./cloud-sql-proxy $PROJECT_ID:asia-northeast1:$INSTANCE_NAME
```

> ✅ **成功の確認方法**
> 「Listening on 127.0.0.1:3306」と表示され、プロセスが実行中になる

> 📝 **注意**
> このターミナルは開いたままにして、新しいターミナルを開いてください。

**✅ ステップ2完了チェック**

- [ ] Cloud SQLインスタンスを作成した
- [ ] データベース「nippo」を作成した
- [ ] データベースユーザー「nippo_user」を作成した
- [ ] ルートパスワードとDBパスワードをメモした

---

## ステップ3: 機密情報の登録

**⏱️ 所要時間: 10分**

> 💡 **このステップの目的**
> パスワードなどの機密情報を安全に保管します。

### 3-1. JWT秘密鍵の作成

> 💡 **JWT秘密鍵とは？**
> ユーザーのログイン状態を管理するための秘密の文字列です。

**□ 3-1-1. ランダムな秘密鍵を生成**

```bash
export JWT_SECRET=$(openssl rand -hex 32)
echo "生成されたJWT秘密鍵: $JWT_SECRET"
```

> 📝 **このコマンドは何をする？**
> 64文字のランダムな文字列を生成します。

> ⚠️ **重要**
> 表示された秘密鍵をメモしておいてください。

**□ 3-1-2. Secret Managerに登録**

```bash
echo -n "$JWT_SECRET" | \
  gcloud secrets create nippo-jwt-secret \
    --data-file=- \
    --replication-policy="automatic"
```

> 📝 **このコマンドは何をする？**
> 生成した秘密鍵をGoogle Cloud Secret Managerに安全に保存します。

> ✅ **成功の確認方法**
> 「Created version [1] of the secret [nippo-jwt-secret]」と表示される

### 3-2. データベース接続情報の登録

**□ 3-2-1. 接続文字列を作成**

```bash
export DATABASE_URL="mysql://nippo_user:$DB_PASSWORD@localhost/nippo?socket=/cloudsql/$PROJECT_ID:asia-northeast1:$INSTANCE_NAME"
echo "データベース接続URL: $DATABASE_URL"
```

> ⚠️ **確認**
> 表示されたURLに `$DB_PASSWORD` の部分が実際のパスワードに置き換わっているか確認してください。

**□ 3-2-2. Secret Managerに登録**

```bash
echo -n "$DATABASE_URL" | \
  gcloud secrets create nippo-database-url \
    --data-file=- \
    --replication-policy="automatic"
```

> ✅ **成功の確認方法**
> 「Created version [1] of the secret [nippo-database-url]」と表示される

### 3-3. アクセス権限の設定

**□ 3-3-1. サービスアカウントのメールアドレスを確認**

```bash
export SERVICE_ACCOUNT="$PROJECT_ID@appspot.gserviceaccount.com"
echo "サービスアカウント: $SERVICE_ACCOUNT"
```

**□ 3-3-2. JWT秘密鍵へのアクセス権限を付与**

```bash
gcloud secrets add-iam-policy-binding nippo-jwt-secret \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

> ✅ **成功の確認方法**
> 「Updated IAM policy for secret [nippo-jwt-secret]」と表示される

**□ 3-3-3. データベースURLへのアクセス権限を付与**

```bash
gcloud secrets add-iam-policy-binding nippo-database-url \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

> ✅ **成功の確認方法**
> 「Updated IAM policy for secret [nippo-database-url]」と表示される

**✅ ステップ3完了チェック**

- [ ] JWT秘密鍵を生成して登録した
- [ ] データベース接続情報を登録した
- [ ] アクセス権限を設定した
- [ ] すべてのパスワードをメモした

---

## ステップ4: アプリケーションのデプロイ

**⏱️ 所要時間: 20分**

> 💡 **このステップの目的**
> 営業日報システムをインターネット上に公開します。

### 4-1. データベースのセットアップ

**□ 4-1-1. Prismaクライアントを生成**

```bash
npm run prisma:generate
```

> 📝 **このコマンドは何をする？**
> データベース操作用のコードを自動生成します。

> ✅ **成功の確認方法**
> 「✔ Generated Prisma Client」と表示される

**□ 4-1-2. データベースマイグレーションを実行**

> ⚠️ **注意**
> Cloud SQL Proxyが起動している状態で実行してください。

別のターミナルで：

```bash
# 環境変数を設定
export DATABASE_URL="mysql://nippo_user:$DB_PASSWORD@127.0.0.1:3306/nippo"

# マイグレーション実行
npm run prisma:migrate deploy
```

> 📝 **このコマンドは何をする？**
> データベースにテーブル（sales、customers、daily_reportsなど）を作成します。

> ✅ **成功の確認方法**
> 「✔ All migrations have been successfully applied」と表示される

**□ 4-1-3. 初期データを投入（オプション）**

```bash
npm run prisma:seed
```

> 📝 **このコマンドは何をする？**
> テスト用のユーザーや顧客データを登録します。

### 4-2. Dockerイメージのビルドとプッシュ

**□ 4-2-1. Artifact Registryリポジトリを作成**

```bash
gcloud artifacts repositories create nippo-repo \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="営業日報システムのDockerイメージ"
```

> 📝 **このコマンドは何をする？**
> アプリケーションのイメージを保存する場所を作成します。

> ✅ **成功の確認方法**
> 「Created repository [nippo-repo]」と表示される

**□ 4-2-2. Docker認証を設定**

```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

> ✅ **成功の確認方法**
> 「Docker configuration file updated」と表示される

**□ 4-2-3. Dockerイメージをビルド**

```bash
docker build -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/nippo-repo/nippo-app:latest .
```

> 📝 **このコマンドは何をする？**
> アプリケーションを動かすためのコンテナイメージを作成します。

**⏱️ 所要時間: 5〜10分**

> ⏳ **処理中**
> 「Step 1/XX」のようなメッセージが表示され、処理が進みます。

> ✅ **成功の確認方法**
> 「Successfully built」と「Successfully tagged」が表示される

**🚨 エラーが出た場合:**

- 「Cannot connect to Docker daemon」→ Docker Desktopが起動しているか確認
- ビルドエラー → `npm run build` をローカルで実行して確認

**□ 4-2-4. イメージをプッシュ**

```bash
docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/nippo-repo/nippo-app:latest
```

> 📝 **このコマンドは何をする？**
> 作成したイメージをGoogleのサーバーにアップロードします。

**⏱️ 所要時間: 3〜5分**

> ✅ **成功の確認方法**
> 「latest: digest: sha256:...」と表示される

### 4-3. Cloud Runへのデプロイ

**□ 4-3-1. デプロイコマンドを実行**

```bash
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
```

> 📝 **このコマンドの説明**
>
> - `--allow-unauthenticated`: 誰でもアクセス可能にする
> - `--memory=512Mi`: メモリ512MB
> - `--cpu=1`: CPU 1コア
> - `--timeout=300`: タイムアウト5分
> - `--set-secrets`: Secret Managerから機密情報を取得

**⏱️ 所要時間: 2〜3分**

> ⏳ **処理中**
> 「Deploying container to Cloud Run service...」と表示されます。

> ✅ **成功の確認方法**
> 「Service [nippo-app] revision [nippo-app-00001] has been deployed」
> 「Service URL: https://nippo-app-xxxxxxxxxx-an.a.run.app」
> と表示される

> 🎉 **重要！**
> 表示されたService URLをメモしてください。これがあなたのアプリケーションのURLです。

**🚨 エラーが出た場合:**

- 「PERMISSION_DENIED」→ APIが有効化されているか確認
- 「RESOURCE_EXHAUSTED」→ 請求先アカウントが設定されているか確認
- 「Cloud SQL connection failed」→ インスタンス名が正しいか確認

**✅ ステップ4完了チェック**

- [ ] Prismaマイグレーションを実行した
- [ ] Dockerイメージをビルドした
- [ ] イメージをプッシュした
- [ ] Cloud Runにデプロイした
- [ ] Service URLをメモした

---

## ステップ5: 動作確認

**⏱️ 所要時間: 10分**

> 💡 **このステップの目的**
> デプロイしたアプリケーションが正しく動作しているか確認します。

### 5-1. ヘルスチェック

**□ 5-1-1. ヘルスチェックエンドポイントにアクセス**

```bash
curl https://nippo-app-xxxxxxxxxx-an.a.run.app/api/health
```

> 📝 **`https://nippo-app-xxxxxxxxxx-an.a.run.app`の部分を、ステップ4で取得したあなたのService URLに置き換えてください。**

> ✅ **成功の確認方法**
> 以下のようなJSONが表示される:
>
> ```json
> {
>   "status": "ok",
>   "timestamp": "2026-02-07T10:00:00.000Z",
>   "service": "nippo-app",
>   "database": "connected"
> }
> ```

**🚨 エラーが出た場合:**

- `"status": "error"` → データベース接続に問題。ステップ3を確認
- `"database": "disconnected"` → Cloud SQLインスタンスが起動しているか確認

### 5-2. ブラウザで確認

**□ 5-2-1. ブラウザでアクセス**

1. ブラウザ（Chrome、Safari、Edgeなど）を開く

2. アドレスバーに以下を入力:
   ```
   https://nippo-app-xxxxxxxxxx-an.a.run.app
   ```
   （あなたのService URLに置き換えてください）

> ✅ **成功の確認方法**
> 営業日報システムのログイン画面が表示される

### 5-3. ログイン確認（初期データを投入した場合）

**□ 5-3-1. テストユーザーでログイン**

初期データを投入した場合、以下のテストユーザーが利用可能です：

| メールアドレス     | パスワード  | 役職     |
| ------------------ | ----------- | -------- |
| yamada@example.com | password123 | 一般営業 |
| sato@example.com   | password123 | 課長     |

1. ログイン画面でメールアドレスとパスワードを入力

2. 「ログイン」ボタンをクリック

> ✅ **成功の確認方法**
> 日報一覧画面が表示される

### 5-4. ログの確認（トラブル時）

**□ 5-4-1. Cloud Runのログを表示**

```bash
gcloud run logs tail nippo-app --region=asia-northeast1
```

> 📝 **このコマンドは何をする？**
> アプリケーションのログをリアルタイムで表示します。エラーが出ている場合、原因がここに表示されます。

> ✅ **正常な場合**
> エラーメッセージがなく、「GET /api/health」などのアクセスログのみが表示される

**✅ ステップ5完了チェック**

- [ ] ヘルスチェックが成功した
- [ ] ブラウザでアプリケーションが表示された
- [ ] ログインが成功した（テストユーザーがある場合）

---

## 🎉 デプロイ完了！

おめでとうございます！営業日報システムのデプロイが完了しました。

### 📝 完了後にすべきこと

**□ 重要な情報をメモ**

以下の情報を安全な場所に保管してください：

```
プロジェクトID: ___________________
Service URL: ___________________
Cloud SQLインスタンス名: ___________________
ルートパスワード: ___________________
DBパスワード: ___________________
JWT秘密鍵: ___________________
```

**□ カスタムドメインの設定（オプション）**

独自ドメイン（例: nippo.your-company.com）を使いたい場合：

```bash
gcloud run domain-mappings create \
  --service=nippo-app \
  --domain=nippo.your-company.com \
  --region=asia-northeast1
```

表示されるDNSレコードをドメインレジストラ（お名前.com、ムームードメインなど）に設定してください。

**□ バックアップの確認**

Cloud SQLの自動バックアップが設定されていることを確認：

```bash
gcloud sql backups list --instance=$INSTANCE_NAME
```

### 📊 運用について

**月額料金の目安**

| サービス  | スペック             | 月額料金（目安） |
| --------- | -------------------- | ---------------- |
| Cloud Run | 512MB, 1CPU, 常時0台 | 数百円〜         |
| Cloud SQL | db-f1-micro          | 約¥2,000         |
| **合計**  |                      | **約¥2,500〜**   |

> 💡 **無料枠について**
> Cloud Runには無料枠があります（月200万リクエストまで）。小規模な利用であれば、ほぼ無料で運用できます。

**料金を確認する方法**

```bash
# ブラウザで請求ページを開く
open https://console.cloud.google.com/billing
```

---

## トラブルシューティング

### 問題1: 「PERMISSION_DENIED」エラー

**症状:**

```
ERROR: (gcloud.xxx) PERMISSION_DENIED: ...
```

**解決方法:**

1. プロジェクトが正しく選択されているか確認:

   ```bash
   gcloud config get-value project
   ```

2. 請求先アカウントがリンクされているか確認:
   - https://console.cloud.google.com/billing を開く
   - プロジェクトが請求先アカウントにリンクされているか確認

3. 必要なAPIが有効化されているか確認:
   ```bash
   gcloud services list --enabled
   ```

### 問題2: アプリケーションにアクセスできない

**症状:**
ブラウザで「このサイトにアクセスできません」と表示される

**解決方法:**

1. Cloud Runサービスが起動しているか確認:

   ```bash
   gcloud run services describe nippo-app --region=asia-northeast1
   ```

2. URLが正しいか確認:

   ```bash
   gcloud run services describe nippo-app --region=asia-northeast1 --format='get(status.url)'
   ```

3. ログを確認:
   ```bash
   gcloud run logs tail nippo-app --region=asia-northeast1
   ```

### 問題3: データベース接続エラー

**症状:**
ヘルスチェックで `"database": "disconnected"` と表示される

**解決方法:**

1. Cloud SQLインスタンスが起動しているか確認:

   ```bash
   gcloud sql instances describe $INSTANCE_NAME
   ```

   → `state: RUNNABLE` になっているか確認

2. Cloud Run に Cloud SQL 接続設定があるか確認:

   ```bash
   gcloud run services describe nippo-app --region=asia-northeast1 --format=yaml | grep cloudsql
   ```

3. DATABASE_URLのシークレットが正しいか確認:
   ```bash
   gcloud secrets versions access latest --secret="nippo-database-url"
   ```

### 問題4: Dockerビルドが失敗する

**症状:**

```
ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully
```

**解決方法:**

1. ローカルでビルドをテスト:

   ```bash
   npm run build
   ```

2. エラーメッセージを確認して修正

3. Dockerイメージを再ビルド:
   ```bash
   docker build --no-cache -t test-build .
   ```

### 問題5: メモリ不足エラー

**症状:**
ログに「Container killed due to memory limit」と表示される

**解決方法:**

メモリを増やして再デプロイ:

```bash
gcloud run services update nippo-app \
  --region=asia-northeast1 \
  --memory=1Gi
```

### それでも解決しない場合

1. **ログを詳しく確認:**

   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nippo-app" \
     --limit=50 \
     --format=json
   ```

2. **GCPコンソールで状態を確認:**

   ```
   https://console.cloud.google.com/run
   ```

3. **サポートに問い合わせ:**
   - GitHub Issues: https://github.com/your-org/nippo/issues
   - GCP サポート: https://cloud.google.com/support

---

## 📚 参考リンク

- [Google Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Cloud SQL ドキュメント](https://cloud.google.com/sql/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [gcloud CLI リファレンス](https://cloud.google.com/sdk/gcloud/reference)

---

## 改訂履歴

| バージョン | 日付       | 作成者 | 変更内容                   |
| ---------- | ---------- | ------ | -------------------------- |
| 2.0        | 2026-02-07 | Claude | 非エンジニア向けに全面改訂 |
| 1.0        | 2026-02-07 | Claude | 初版作成                   |

---

> 💬 **フィードバック**
> この手順書で分かりにくい部分があれば、GitHubのIssueでお知らせください！
