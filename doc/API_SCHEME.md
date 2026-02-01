# 営業日報システム API仕様書

## 目次

1. [概要](#1-概要)
2. [認証](#2-認証)
3. [共通仕様](#3-共通仕様)
4. [エンドポイント一覧](#4-エンドポイント一覧)
5. [API詳細](#5-api詳細)
6. [エラーハンドリング](#6-エラーハンドリング)

---

## 1. 概要

### 1.1 ベースURL

```
本番環境: https://api.sales-report.example.com/v1
開発環境: https://api-dev.sales-report.example.com/v1
```

### 1.2 プロトコル

- HTTPS (TLS 1.2以上)

### 1.3 データフォーマット

- リクエスト: JSON
- レスポンス: JSON
- 文字コード: UTF-8
- 日時フォーマット: ISO 8601 (例: `2026-02-01T18:30:00+09:00`)
- 日付フォーマット: YYYY-MM-DD (例: `2026-02-01`)

---

## 2. 認証

### 2.1 認証方式

JWT (JSON Web Token) による Bearer認証を使用

### 2.2 認証フロー

1. `/api/auth/login` でログインし、アクセストークンとリフレッシュトークンを取得
2. 以降のリクエストでは、Authorizationヘッダーにアクセストークンを含める
3. アクセストークンの有効期限切れ時は、リフレッシュトークンで新しいアクセストークンを取得

### 2.3 認証ヘッダー

```
Authorization: Bearer {access_token}
```

### 2.4 トークンの有効期限

- アクセストークン: 1時間
- リフレッシュトークン: 30日

---

## 3. 共通仕様

### 3.1 HTTPメソッド

| メソッド | 用途                     |
| -------- | ------------------------ |
| GET      | リソースの取得           |
| POST     | リソースの作成           |
| PUT      | リソースの更新(完全置換) |
| PATCH    | リソースの部分更新       |
| DELETE   | リソースの削除           |

### 3.2 HTTPステータスコード

| コード                    | 説明                                 |
| ------------------------- | ------------------------------------ |
| 200 OK                    | リクエスト成功                       |
| 201 Created               | リソース作成成功                     |
| 204 No Content            | リクエスト成功(レスポンスボディなし) |
| 400 Bad Request           | リクエストが不正                     |
| 401 Unauthorized          | 認証が必要                           |
| 403 Forbidden             | アクセス権限なし                     |
| 404 Not Found             | リソースが存在しない                 |
| 422 Unprocessable Entity  | バリデーションエラー                 |
| 500 Internal Server Error | サーバーエラー                       |

### 3.3 ページネーション

一覧取得APIでは、以下のクエリパラメータでページネーションを実装

| パラメータ | 型      | デフォルト | 説明                         |
| ---------- | ------- | ---------- | ---------------------------- |
| page       | integer | 1          | ページ番号                   |
| per_page   | integer | 10         | 1ページあたりの件数(最大100) |

レスポンス例:

```json
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 5,
    "total_count": 50
  }
}
```

### 3.4 ソート

一覧取得APIでは、以下のクエリパラメータでソートを実装

| パラメータ | 型     | 説明                   | 例            |
| ---------- | ------ | ---------------------- | ------------- |
| sort       | string | ソート対象のフィールド | `report_date` |
| order      | string | ソート順序 (asc/desc)  | `desc`        |

### 3.5 共通レスポンスフィールド

| フィールド | 型     | 説明                |
| ---------- | ------ | ------------------- |
| created_at | string | 作成日時 (ISO 8601) |
| updated_at | string | 更新日時 (ISO 8601) |

---

## 4. エンドポイント一覧

### 4.1 認証

| メソッド | エンドポイント    | 説明                     |
| -------- | ----------------- | ------------------------ |
| POST     | /api/auth/login   | ログイン                 |
| POST     | /api/auth/logout  | ログアウト               |
| POST     | /api/auth/refresh | トークンリフレッシュ     |
| GET      | /api/auth/me      | ログインユーザー情報取得 |

### 4.2 日報

| メソッド | エンドポイント          | 説明         |
| -------- | ----------------------- | ------------ |
| GET      | /api/daily-reports      | 日報一覧取得 |
| GET      | /api/daily-reports/{id} | 日報詳細取得 |
| POST     | /api/daily-reports      | 日報作成     |
| PUT      | /api/daily-reports/{id} | 日報更新     |
| DELETE   | /api/daily-reports/{id} | 日報削除     |

### 4.3 訪問記録

| メソッド | エンドポイント                                     | 説明         |
| -------- | -------------------------------------------------- | ------------ |
| POST     | /api/daily-reports/{daily_report_id}/visit-records | 訪問記録追加 |
| PUT      | /api/visit-records/{id}                            | 訪問記録更新 |
| DELETE   | /api/visit-records/{id}                            | 訪問記録削除 |

### 4.4 Problem

| メソッド | エンドポイント                                | 説明        |
| -------- | --------------------------------------------- | ----------- |
| POST     | /api/daily-reports/{daily_report_id}/problems | Problem追加 |
| PUT      | /api/problems/{id}                            | Problem更新 |
| DELETE   | /api/problems/{id}                            | Problem削除 |

### 4.5 Plan

| メソッド | エンドポイント                             | 説明     |
| -------- | ------------------------------------------ | -------- |
| POST     | /api/daily-reports/{daily_report_id}/plans | Plan追加 |
| PUT      | /api/plans/{id}                            | Plan更新 |
| DELETE   | /api/plans/{id}                            | Plan削除 |

### 4.6 コメント

| メソッド | エンドポイント                      | 説明                    |
| -------- | ----------------------------------- | ----------------------- |
| POST     | /api/problems/{problem_id}/comments | Problemへのコメント追加 |
| POST     | /api/plans/{plan_id}/comments       | Planへのコメント追加    |
| PUT      | /api/comments/{id}                  | コメント更新            |
| DELETE   | /api/comments/{id}                  | コメント削除            |

### 4.7 顧客マスタ

| メソッド | エンドポイント      | 説明         |
| -------- | ------------------- | ------------ |
| GET      | /api/customers      | 顧客一覧取得 |
| GET      | /api/customers/{id} | 顧客詳細取得 |
| POST     | /api/customers      | 顧客作成     |
| PUT      | /api/customers/{id} | 顧客更新     |
| DELETE   | /api/customers/{id} | 顧客削除     |

### 4.8 営業マスタ

| メソッド | エンドポイント  | 説明               |
| -------- | --------------- | ------------------ |
| GET      | /api/sales      | 営業担当者一覧取得 |
| GET      | /api/sales/{id} | 営業担当者詳細取得 |

---

## 5. API詳細

### 5.1 認証API

#### 5.1.1 ログイン

**エンドポイント**: `POST /api/auth/login`

**リクエスト**

```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス** (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "department": "営業第一部",
    "position": "課長",
    "manager_id": 5
  }
}
```

**エラーレスポンス** (401 Unauthorized)

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

#### 5.1.2 ログアウト

**エンドポイント**: `POST /api/auth/logout`

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

#### 5.1.3 トークンリフレッシュ

**エンドポイント**: `POST /api/auth/refresh`

**リクエスト**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**レスポンス** (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

#### 5.1.4 ログインユーザー情報取得

**エンドポイント**: `GET /api/auth/me`

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "id": 1,
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "department": "営業第一部",
  "position": "課長",
  "manager_id": 5,
  "manager_name": "佐藤 花子",
  "created_at": "2025-01-15T10:00:00+09:00",
  "updated_at": "2026-01-20T15:30:00+09:00"
}
```

---

### 5.2 日報API

#### 5.2.1 日報一覧取得

**エンドポイント**: `GET /api/daily-reports`

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| scope | string | - | 表示対象 (`own`/`subordinates`/`all`) |
| sales_id | integer | - | 営業担当者ID |
| customer_id | integer | - | 顧客ID |
| report_date_from | string | - | 報告日(開始) YYYY-MM-DD |
| report_date_to | string | - | 報告日(終了) YYYY-MM-DD |
| page | integer | - | ページ番号(デフォルト: 1) |
| per_page | integer | - | 1ページあたりの件数(デフォルト: 10) |
| sort | string | - | ソート対象フィールド(デフォルト: `report_date`) |
| order | string | - | ソート順序 (`asc`/`desc`、デフォルト: `desc`) |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "data": [
    {
      "id": 123,
      "sales_id": 1,
      "sales_name": "山田 太郎",
      "report_date": "2026-02-01",
      "visit_count": 3,
      "problem_count": 2,
      "plan_count": 2,
      "has_comments": true,
      "created_at": "2026-02-01T18:30:00+09:00",
      "updated_at": "2026-02-01T20:45:00+09:00"
    },
    {
      "id": 122,
      "sales_id": 1,
      "sales_name": "山田 太郎",
      "report_date": "2026-01-31",
      "visit_count": 2,
      "problem_count": 1,
      "plan_count": 1,
      "has_comments": false,
      "created_at": "2026-01-31T19:00:00+09:00",
      "updated_at": "2026-01-31T19:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 5,
    "total_count": 50
  }
}
```

---

#### 5.2.2 日報詳細取得

**エンドポイント**: `GET /api/daily-reports/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "id": 123,
  "sales_id": 1,
  "sales_name": "山田 太郎",
  "report_date": "2026-02-01",
  "visit_records": [
    {
      "id": 301,
      "customer_id": 10,
      "customer_name": "株式会社ABC商事",
      "visit_content": "新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。",
      "visit_start_time": "10:00:00",
      "visit_end_time": "11:30:00",
      "created_at": "2026-02-01T18:30:00+09:00"
    },
    {
      "id": 302,
      "customer_id": 11,
      "customer_name": "DEF株式会社",
      "visit_content": "定例訪問。前回の案件の進捗確認を実施。",
      "visit_start_time": "13:30:00",
      "visit_end_time": "14:30:00",
      "created_at": "2026-02-01T18:30:00+09:00"
    }
  ],
  "problems": [
    {
      "id": 201,
      "content": "GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。",
      "comments": [
        {
          "id": 401,
          "commenter_id": 5,
          "commenter_name": "佐藤 花子",
          "commenter_position": "部長",
          "content": "5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日、詳細を相談しましょう。",
          "created_at": "2026-02-01T20:30:00+09:00"
        }
      ],
      "created_at": "2026-02-01T18:30:00+09:00",
      "updated_at": "2026-02-01T18:30:00+09:00"
    }
  ],
  "plans": [
    {
      "id": 101,
      "content": "ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。",
      "comments": [],
      "created_at": "2026-02-01T18:30:00+09:00",
      "updated_at": "2026-02-01T18:30:00+09:00"
    }
  ],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T20:45:00+09:00"
}
```

**エラーレスポンス** (404 Not Found)

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された日報が見つかりません"
  }
}
```

**エラーレスポンス** (403 Forbidden)

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "この日報にアクセスする権限がありません"
  }
}
```

---

#### 5.2.3 日報作成

**エンドポイント**: `POST /api/daily-reports`

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "report_date": "2026-02-01"
}
```

**レスポンス** (201 Created)

```json
{
  "id": 123,
  "sales_id": 1,
  "sales_name": "山田 太郎",
  "report_date": "2026-02-01",
  "visit_records": [],
  "problems": [],
  "plans": [],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T18:30:00+09:00"
}
```

**エラーレスポンス** (422 Unprocessable Entity)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラー",
    "details": [
      {
        "field": "report_date",
        "message": "この日付の日報は既に存在します"
      }
    ]
  }
}
```

---

#### 5.2.4 日報更新

**エンドポイント**: `PUT /api/daily-reports/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "report_date": "2026-02-01"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 123,
  "sales_id": 1,
  "sales_name": "山田 太郎",
  "report_date": "2026-02-01",
  "visit_records": [...],
  "problems": [...],
  "plans": [...],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T20:00:00+09:00"
}
```

---

#### 5.2.5 日報削除

**エンドポイント**: `DELETE /api/daily-reports/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

### 5.3 訪問記録API

#### 5.3.1 訪問記録追加

**エンドポイント**: `POST /api/daily-reports/{daily_report_id}/visit-records`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| daily_report_id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "customer_id": 10,
  "visit_content": "新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。",
  "visit_start_time": "10:00:00",
  "visit_end_time": "11:30:00"
}
```

| フィールド       | 型      | 必須 | 最大長 | 説明                    |
| ---------------- | ------- | ---- | ------ | ----------------------- |
| customer_id      | integer | ◯    | -      | 顧客ID                  |
| visit_content    | string  | ◯    | 1000   | 訪問内容                |
| visit_start_time | string  | -    | -      | 訪問開始時刻 (HH:MM:SS) |
| visit_end_time   | string  | -    | -      | 訪問終了時刻 (HH:MM:SS) |

**レスポンス** (201 Created)

```json
{
  "id": 301,
  "daily_report_id": 123,
  "customer_id": 10,
  "customer_name": "株式会社ABC商事",
  "visit_content": "新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。",
  "visit_start_time": "10:00:00",
  "visit_end_time": "11:30:00",
  "created_at": "2026-02-01T18:30:00+09:00"
}
```

**エラーレスポンス** (422 Unprocessable Entity)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラー",
    "details": [
      {
        "field": "customer_id",
        "message": "顧客を選択してください"
      },
      {
        "field": "visit_end_time",
        "message": "訪問終了時刻は開始時刻より後に設定してください"
      }
    ]
  }
}
```

---

#### 5.3.2 訪問記録更新

**エンドポイント**: `PUT /api/visit-records/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 訪問記録ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "customer_id": 10,
  "visit_content": "新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。(修正版)",
  "visit_start_time": "10:00:00",
  "visit_end_time": "11:30:00"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 301,
  "daily_report_id": 123,
  "customer_id": 10,
  "customer_name": "株式会社ABC商事",
  "visit_content": "新商品のプレゼンテーションを実施。先方の反応は良好で、次回は見積書を持参することで合意。(修正版)",
  "visit_start_time": "10:00:00",
  "visit_end_time": "11:30:00",
  "created_at": "2026-02-01T18:30:00+09:00"
}
```

---

#### 5.3.3 訪問記録削除

**エンドポイント**: `DELETE /api/visit-records/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 訪問記録ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

### 5.4 Problem API

#### 5.4.1 Problem追加

**エンドポイント**: `POST /api/daily-reports/{daily_report_id}/problems`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| daily_report_id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。"
}
```

| フィールド | 型     | 必須 | 最大長 | 説明        |
| ---------- | ------ | ---- | ------ | ----------- |
| content    | string | ◯    | 1000   | Problem内容 |

**レスポンス** (201 Created)

```json
{
  "id": 201,
  "daily_report_id": 123,
  "content": "GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。",
  "comments": [],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T18:30:00+09:00"
}
```

---

#### 5.4.2 Problem更新

**エンドポイント**: `PUT /api/problems/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | Problem ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。(修正版)"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 201,
  "daily_report_id": 123,
  "content": "GHI工業との価格交渉について。競合他社より10%高い見積もりとなっているため、値引き交渉の承認をいただきたい。(修正版)",
  "comments": [...],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T19:00:00+09:00"
}
```

---

#### 5.4.3 Problem削除

**エンドポイント**: `DELETE /api/problems/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | Problem ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

### 5.5 Plan API

#### 5.5.1 Plan追加

**エンドポイント**: `POST /api/daily-reports/{daily_report_id}/plans`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| daily_report_id | integer | 日報ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。"
}
```

| フィールド | 型     | 必須 | 最大長 | 説明     |
| ---------- | ------ | ---- | ------ | -------- |
| content    | string | ◯    | 1000   | Plan内容 |

**レスポンス** (201 Created)

```json
{
  "id": 101,
  "daily_report_id": 123,
  "content": "ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。",
  "comments": [],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T18:30:00+09:00"
}
```

---

#### 5.5.2 Plan更新

**エンドポイント**: `PUT /api/plans/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | Plan ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。(修正版)"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 101,
  "daily_report_id": 123,
  "content": "ABC商事へ見積書提出。新商品の見積書を作成し、午前中に訪問予定。(修正版)",
  "comments": [],
  "created_at": "2026-02-01T18:30:00+09:00",
  "updated_at": "2026-02-01T19:00:00+09:00"
}
```

---

#### 5.5.3 Plan削除

**エンドポイント**: `DELETE /api/plans/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | Plan ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

### 5.6 コメントAPI

#### 5.6.1 Problemへのコメント追加

**エンドポイント**: `POST /api/problems/{problem_id}/comments`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| problem_id | integer | Problem ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日、詳細を相談しましょう。"
}
```

| フィールド | 型     | 必須 | 最大長 | 説明         |
| ---------- | ------ | ---- | ------ | ------------ |
| content    | string | ◯    | 1000   | コメント内容 |

**レスポンス** (201 Created)

```json
{
  "id": 401,
  "target_type": "PROBLEM",
  "target_id": 201,
  "commenter_id": 5,
  "commenter_name": "佐藤 花子",
  "commenter_position": "部長",
  "content": "5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日、詳細を相談しましょう。",
  "created_at": "2026-02-01T20:30:00+09:00"
}
```

**エラーレスポンス** (403 Forbidden)

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "コメントを投稿する権限がありません。上長のみがコメントを投稿できます。"
  }
}
```

---

#### 5.6.2 Planへのコメント追加

**エンドポイント**: `POST /api/plans/{plan_id}/comments`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| plan_id | integer | Plan ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "見積書の提出、頑張ってください。価格設定については事前に確認させてください。"
}
```

**レスポンス** (201 Created)

```json
{
  "id": 402,
  "target_type": "PLAN",
  "target_id": 101,
  "commenter_id": 5,
  "commenter_name": "佐藤 花子",
  "commenter_position": "部長",
  "content": "見積書の提出、頑張ってください。価格設定については事前に確認させてください。",
  "created_at": "2026-02-01T20:35:00+09:00"
}
```

---

#### 5.6.3 コメント更新

**エンドポイント**: `PUT /api/comments/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | コメントID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "content": "5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日の午後、詳細を相談しましょう。"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 401,
  "target_type": "PROBLEM",
  "target_id": 201,
  "commenter_id": 5,
  "commenter_name": "佐藤 花子",
  "commenter_position": "部長",
  "content": "5%までの値引きであれば承認します。それ以上は本部承認が必要です。明日の午後、詳細を相談しましょう。",
  "created_at": "2026-02-01T20:30:00+09:00"
}
```

---

#### 5.6.4 コメント削除

**エンドポイント**: `DELETE /api/comments/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | コメントID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

---

### 5.7 顧客マスタAPI

#### 5.7.1 顧客一覧取得

**エンドポイント**: `GET /api/customers`

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| name | string | - | 顧客名(部分一致) |
| industry | string | - | 業種 |
| page | integer | - | ページ番号(デフォルト: 1) |
| per_page | integer | - | 1ページあたりの件数(デフォルト: 10) |
| sort | string | - | ソート対象フィールド(デフォルト: `name`) |
| order | string | - | ソート順序 (`asc`/`desc`、デフォルト: `asc`) |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "data": [
    {
      "id": 10,
      "name": "株式会社ABC商事",
      "contact_person": "山田 一郎",
      "phone": "03-1234-5678",
      "address": "東京都千代田区丸の内1-1-1",
      "industry": "卸売業",
      "last_visit_date": "2026-02-01",
      "visit_count": 15,
      "created_at": "2025-06-01T10:00:00+09:00",
      "updated_at": "2026-01-20T15:30:00+09:00"
    },
    {
      "id": 11,
      "name": "DEF株式会社",
      "contact_person": "鈴木 花子",
      "phone": "03-2345-6789",
      "address": "東京都港区六本木1-1-1",
      "industry": "製造業",
      "last_visit_date": "2026-01-31",
      "visit_count": 8,
      "created_at": "2025-08-15T14:00:00+09:00",
      "updated_at": "2026-01-25T11:00:00+09:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 12,
    "total_count": 120
  }
}
```

---

#### 5.7.2 顧客詳細取得

**エンドポイント**: `GET /api/customers/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 顧客ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "id": 10,
  "name": "株式会社ABC商事",
  "contact_person": "山田 一郎",
  "phone": "03-1234-5678",
  "address": "東京都千代田区丸の内1-1-1",
  "industry": "卸売業",
  "last_visit_date": "2026-02-01",
  "visit_count": 15,
  "visit_history": [
    {
      "visit_date": "2026-02-01",
      "sales_name": "山田 太郎",
      "visit_content": "新商品のプレゼンテーションを実施。"
    },
    {
      "visit_date": "2026-01-25",
      "sales_name": "山田 太郎",
      "visit_content": "定例訪問。"
    }
  ],
  "created_at": "2025-06-01T10:00:00+09:00",
  "updated_at": "2026-01-20T15:30:00+09:00"
}
```

---

#### 5.7.3 顧客作成

**エンドポイント**: `POST /api/customers`

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "name": "株式会社新規顧客",
  "contact_person": "田中 次郎",
  "phone": "03-9999-8888",
  "address": "東京都渋谷区渋谷1-1-1",
  "industry": "小売業"
}
```

| フィールド     | 型     | 必須 | 最大長 | 説明           |
| -------------- | ------ | ---- | ------ | -------------- |
| name           | string | ◯    | 200    | 顧客名(会社名) |
| contact_person | string | -    | 100    | 担当者名       |
| phone          | string | -    | 20     | 電話番号       |
| address        | string | -    | 255    | 住所           |
| industry       | string | -    | 100    | 業種           |

**レスポンス** (201 Created)

```json
{
  "id": 50,
  "name": "株式会社新規顧客",
  "contact_person": "田中 次郎",
  "phone": "03-9999-8888",
  "address": "東京都渋谷区渋谷1-1-1",
  "industry": "小売業",
  "last_visit_date": null,
  "visit_count": 0,
  "created_at": "2026-02-01T21:00:00+09:00",
  "updated_at": "2026-02-01T21:00:00+09:00"
}
```

**エラーレスポンス** (403 Forbidden)

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "顧客を作成する権限がありません。管理者のみが実行できます。"
  }
}
```

---

#### 5.7.4 顧客更新

**エンドポイント**: `PUT /api/customers/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 顧客ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**リクエストボディ**

```json
{
  "name": "株式会社ABC商事",
  "contact_person": "山田 一郎",
  "phone": "03-1234-5678",
  "address": "東京都千代田区丸の内1-1-1 ABCビル10F",
  "industry": "卸売業"
}
```

**レスポンス** (200 OK)

```json
{
  "id": 10,
  "name": "株式会社ABC商事",
  "contact_person": "山田 一郎",
  "phone": "03-1234-5678",
  "address": "東京都千代田区丸の内1-1-1 ABCビル10F",
  "industry": "卸売業",
  "last_visit_date": "2026-02-01",
  "visit_count": 15,
  "created_at": "2025-06-01T10:00:00+09:00",
  "updated_at": "2026-02-01T21:30:00+09:00"
}
```

---

#### 5.7.5 顧客削除

**エンドポイント**: `DELETE /api/customers/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 顧客ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (204 No Content)

**エラーレスポンス** (422 Unprocessable Entity)

```json
{
  "error": {
    "code": "DELETION_RESTRICTED",
    "message": "この顧客には訪問記録が存在するため削除できません"
  }
}
```

---

### 5.8 営業マスタAPI

#### 5.8.1 営業担当者一覧取得

**エンドポイント**: `GET /api/sales`

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| department | string | - | 所属部署 |
| position | string | - | 役職 |
| page | integer | - | ページ番号(デフォルト: 1) |
| per_page | integer | - | 1ページあたりの件数(デフォルト: 10) |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "name": "山田 太郎",
      "email": "yamada@example.com",
      "department": "営業第一部",
      "position": "課長",
      "manager_id": 5,
      "manager_name": "佐藤 花子"
    },
    {
      "id": 2,
      "name": "鈴木 一郎",
      "email": "suzuki@example.com",
      "department": "営業第一部",
      "position": "一般",
      "manager_id": 1,
      "manager_name": "山田 太郎"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_pages": 3,
    "total_count": 25
  }
}
```

---

#### 5.8.2 営業担当者詳細取得

**エンドポイント**: `GET /api/sales/{id}`

**パスパラメータ**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | integer | 営業担当者ID |

**リクエストヘッダー**

```
Authorization: Bearer {access_token}
```

**レスポンス** (200 OK)

```json
{
  "id": 1,
  "name": "山田 太郎",
  "email": "yamada@example.com",
  "department": "営業第一部",
  "position": "課長",
  "manager_id": 5,
  "manager_name": "佐藤 花子",
  "subordinates": [
    {
      "id": 2,
      "name": "鈴木 一郎",
      "department": "営業第一部",
      "position": "一般"
    },
    {
      "id": 3,
      "name": "田中 花子",
      "department": "営業第一部",
      "position": "一般"
    }
  ],
  "created_at": "2025-01-15T10:00:00+09:00",
  "updated_at": "2026-01-20T15:30:00+09:00"
}
```

---

## 6. エラーハンドリング

### 6.1 エラーレスポンスの共通フォーマット

すべてのエラーレスポンスは以下の形式で返却されます:

```json
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

### 6.2 エラーコード一覧

| エラーコード          | HTTPステータス | 説明                   |
| --------------------- | -------------- | ---------------------- |
| INVALID_CREDENTIALS   | 401            | 認証情報が不正         |
| TOKEN_EXPIRED         | 401            | トークンの有効期限切れ |
| INVALID_TOKEN         | 401            | トークンが不正         |
| ACCESS_DENIED         | 403            | アクセス権限なし       |
| RESOURCE_NOT_FOUND    | 404            | リソースが存在しない   |
| VALIDATION_ERROR      | 422            | バリデーションエラー   |
| DUPLICATE_RESOURCE    | 422            | リソースの重複         |
| DELETION_RESTRICTED   | 422            | 削除制限               |
| INTERNAL_SERVER_ERROR | 500            | サーバー内部エラー     |

### 6.3 バリデーションエラーの詳細

バリデーションエラー時は、`details` フィールドに詳細情報を含めます:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラー",
    "details": [
      {
        "field": "report_date",
        "message": "報告日を入力してください"
      },
      {
        "field": "visit_content",
        "message": "訪問内容は1000文字以内で入力してください"
      }
    ]
  }
}
```

---

## 7. セキュリティ

### 7.1 HTTPS必須

すべての通信はHTTPS経由で行う必要があります。

### 7.2 CORS (Cross-Origin Resource Sharing)

許可されたオリジンからのリクエストのみを受け付けます。

### 7.3 レート制限

APIリクエストには以下のレート制限があります:

| ユーザー種別 | 制限                |
| ------------ | ------------------- |
| 一般ユーザー | 1000リクエスト/時間 |
| 管理者       | 5000リクエスト/時間 |

レート制限を超えた場合は、HTTPステータス429 (Too Many Requests) を返却します。

レスポンスヘッダー:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1643713200
```

### 7.4 SQLインジェクション対策

すべてのクエリにはプレースホルダーを使用し、パラメータをエスケープします。

### 7.5 XSS対策

HTMLエンティティエンコーディングを実施し、スクリプトの実行を防ぎます。

---

## 8. バージョニング

### 8.1 バージョン管理方式

URLパスにバージョン番号を含める方式を採用します。

例: `/v1/daily-reports`

### 8.2 バージョンアップポリシー

- メジャーバージョンアップ: 後方互換性のない変更
- マイナーバージョンアップ: 後方互換性のある機能追加
- パッチバージョンアップ: バグフィックス

### 8.3 非推奨API

非推奨となったAPIは、レスポンスヘッダーに警告を含めます:

```
Warning: 299 - "This API version is deprecated and will be removed on 2027-01-01"
```

---

## 9. WebSocket (今後の拡張)

リアルタイム通知機能のために、WebSocketの実装を検討しています。

**エンドポイント** (計画中): `wss://api.sales-report.example.com/v1/notifications`

**用途**:

- 上長からのコメント通知
- 日報未提出のリマインダー
- システムメンテナンス通知

---

## 改訂履歴

| バージョン | 日付       | 作成者 | 変更内容 |
| ---------- | ---------- | ------ | -------- |
| 1.0        | 2026-02-01 | Claude | 初版作成 |
