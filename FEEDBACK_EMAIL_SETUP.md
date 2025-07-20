# 📧 フィードバック邮件发送功能设置指南

## 概要
この機能により、ユーザーがフィードバックページで送信したメッセージが、あなたの管理者メールアドレス（xroffer@gmail.com）に自動的に送信されます。

## 🔧 必要な設置

### 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を追加してください：

```env
# Supabase設定（既存）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Resend API Key（新規追加）
RESEND_API_KEY=your_resend_api_key
```

### 2. Resendアカウントの作成

1. [Resend](https://resend.com) にアクセス
2. 無料アカウントを作成（月間3,000通まで無料）
3. API Keyを取得
4. API Keyを `.env.local` に追加

## 📬 機能の流れ

1. **ユーザーがフィードバックを送信**
   - フィードバックページでフォームを入力
   - "送信する" ボタンをクリック

2. **データベースに保存**
   - Supabaseの `feedback` テーブルに保存
   - ステータスは最初 `pending` に設定

3. **メール送信**
   - あなたのGmail（xroffer@gmail.com）に通知メール送信
   - HTML形式の美しいメールテンプレート
   - ユーザーの連絡先がReply-To に設定（直接返信可能）

4. **ステータス更新**
   - 成功時: `sent`
   - 失敗時: `email_failed`

## 📧 メール内容

### 件名
```
[就職指導] {ユーザーが入力した件名}
```

### 送信者
```
Job Guidance System <noreply@resend.dev>
```

### 返信先
```
{ユーザーのメールアドレス}
```

### メール内容
- 送信者名
- メールアドレス（クリックで返信可能）
- カテゴリ（バッジ表示）
- 件名
- メッセージ内容
- フィードバックID
- 送信日時（日本時間）

## 🎨 メールデザイン

- モダンなHTML設計
- レスポンシブデザイン（スマホ対応）
- グラデーション背景
- 読みやすいレイアウト
- カテゴリごとの色分け

## 🔍 カテゴリ一覧

- `bug` → 不具合報告
- `feature` → 機能要望
- `improvement` → 改善提案
- `question` → 質問
- `other` → その他

## 🚨 エラーハンドリング

### データベース保存失敗
- ユーザーにエラーメッセージ表示
- メール送信は試行されない

### メール送信失敗
- データベースには保存済み
- ステータスを `email_failed` に更新
- ユーザーには成功メッセージ表示（UX考慮）

## 🧪 テスト方法

1. 開発サーバー起動:
```bash
pnpm dev
```

2. フィードバックページにアクセス:
```
http://localhost:3000/feedback
```

3. テストメッセージを送信

4. Gmail（xroffer@gmail.com）を確認

## 🔒 セキュリティ注意事項

- `.env.local` は絶対にGitにコミットしない
- `SUPABASE_SERVICE_ROLE_KEY` は機密情報
- `RESEND_API_KEY` も機密情報として扱う

## 📊 監視とログ

### 成功時のログ
```
邮件发送成功: {feedback_id}
```

### 失敗時のログ
```
邮件发送失败: {error_details}
```

### データベースでの確認
```sql
-- 最近のフィードバック確認
SELECT id, name, email, subject, status, created_at 
FROM feedback 
ORDER BY created_at DESC 
LIMIT 10;

-- ステータス別の集計
SELECT status, COUNT(*) 
FROM feedback 
GROUP BY status;
```

## 🔧 トラブルシューティング

### メールが届かない場合

1. **API Key確認**
   - Resendダッシュボードでキーが有効か確認
   - 環境変数の名前が正確か確認

2. **スパムフォルダ確認**
   - Gmail のスパムフォルダを確認

3. **ログ確認**
   - ブラウザの開発者ツールでエラー確認
   - サーバーログ確認

4. **Resend制限確認**
   - 月間送信数制限に達していないか確認

### データベースエラーの場合

1. **Supabase接続確認**
   - 環境変数が正しく設定されているか
   - サービスロールキーが有効か

2. **テーブル確認**
   - `feedback` テーブルが存在するか
   - RLS（Row Level Security）ポリシーが適切か

## 📈 今後の拡張可能性

- 自動返信機能
- カテゴリ別の担当者振り分け
- 優先度設定
- SLA（回答期限）設定
- メール内からの直接回答機能

## 💡 使用技術

- **フロントエンド**: Next.js 15, React, TypeScript
- **データベース**: Supabase PostgreSQL
- **メール送信**: Resend API
- **認証**: Supabase Auth
- **UI**: Radix UI + Tailwind CSS 