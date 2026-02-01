erDiagram
営業マスタ ||--o{ 日報 : "作成する"
営業マスタ ||--o{ 営業マスタ : "上長"
営業マスタ ||--o{ コメント : "記入する"

    顧客マスタ ||--o{ 訪問記録 : "訪問される"

    日報 ||--o{ 訪問記録 : "含む"
    日報 ||--o{ Problem : "含む"
    日報 ||--o{ Plan : "含む"

    Problem ||--o{ コメント : "受ける"
    Plan ||--o{ コメント : "受ける"

    営業マスタ {
        int 営業ID PK
        string 営業名
        string 所属部署
        string 役職
        string メールアドレス
        int 上長ID FK
        datetime 登録日時
        datetime 更新日時
    }

    顧客マスタ {
        int 顧客ID PK
        string 顧客名
        string 担当者名
        string 電話番号
        string 住所
        string 業種
        datetime 登録日時
        datetime 更新日時
    }

    日報 {
        int 日報ID PK
        int 営業ID FK
        date 報告日
        datetime 作成日時
        datetime 更新日時
    }

    訪問記録 {
        int 訪問記録ID PK
        int 日報ID FK
        int 顧客ID FK
        text 訪問内容
        time 訪問開始時刻
        time 訪問終了時刻
        datetime 作成日時
    }

    Problem {
        int ProblemID PK
        int 日報ID FK
        text 内容
        datetime 作成日時
        datetime 更新日時
    }

    Plan {
        int PlanID PK
        int 日報ID FK
        text 内容
        datetime 作成日時
        datetime 更新日時
    }

    コメント {
        int コメントID PK
        string 対象区分
        int 対象ID
        int コメント者ID FK
        text コメント内容
        datetime 作成日時
    }
