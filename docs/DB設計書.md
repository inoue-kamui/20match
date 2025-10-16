# DB設計書（PostgreSQL 17）

## 1. 目的・スコープ
- 本書は「要件定義書」「システム設計書」「チャット機能実装設計書」「統合設計書」を統合し、データベース設計を一般的なフローに沿って定義します。
- 対象: サーバーサイドのRDS PostgreSQL 17 に保存するアプリケーションデータ一式（Prisma 6.16.1で管理）。

## 2. 前提・非機能要件
- エンジン: PostgreSQL 17（RDS/ローカル開発環境）
- スケール: 小規模（MVP 10-50 同時ユーザー、将来 100-500）
- 可用性: 99%
- 画像保存: BYTEA（小規模最適化）
- 通信暗号化: TLS 1.3（アプリ〜ALB〜EC2〜RDS間）
- デバイス/IP制限: 1ユーザー=2デバイス、1IP=5デバイス、1デバイス=100リク/分（DBではなくアプリ層で制御）
- データ保持: 20分はUIの表示制御（DB削除なし）、24時間で容量管理削除（chat系テーブル）
- **実装状況**: 初回マイグレーション完了（2025年9月13日）

## 3. 概念データモデル（ドメイン）
- Users（ユーザー）
- Posts（掲示板投稿）
- Matches（マッチング）
- ChatRooms（チャットルーム、20分UI制御の起点）
- RoomParticipants（ルーム参加者）
- Messages（メッセージ）
- MessageAttachments（メッセージ添付画像・メタ）
- Notifications（通知）
- AdBanners（広告）
- UserSubscriptions（課金状態）

主な関連:
- User 1 - n Post
- Post 1 - n Match
- User 1 - n Match (applicant)
- Match 1 - 1 ChatRoom
- ChatRoom 1 - n RoomParticipant
- User 1 - n RoomParticipant
- ChatRoom 1 - n Message
- User 1 - n Message (sender)
- Message 1 - n MessageAttachment

## 実装状況（2025年9月13日更新）

### 完了項目
- ✅ PostgreSQL 17 インストール・起動
- ✅ データベース `matching_app` 作成
- ✅ Prisma 6.16.1 セットアップ
- ✅ 初回マイグレーション実行（20250913191610_mg1）
- ✅ 全11テーブル作成完了
- ✅ インデックス・外部キー制約設定完了
- ✅ PrismaService単体テスト作成・実行完了

### 作成されたテーブル
1. `users` - ユーザー基本情報
2. `posts` - 投稿情報
3. `matches` - マッチング情報
4. `chat_rooms` - チャットルーム
5. `room_participants` - ルーム参加者
6. `messages` - メッセージ
7. `message_attachments` - メッセージ添付ファイル
8. `notifications` - 通知
9. `ad_banners` - 広告バナー
10. `user_subscriptions` - ユーザー課金情報
11. `_prisma_migrations` - Prismaマイグレーション履歴

## 4. 論理データモデル（正規化とキー設計）
- 主キーは全テーブルUUID（gen_random_uuid()）。
- 参照整合性は外部キーで保証。
- 正規化: 第3正規形（メッセージ本体と添付を分離）。
- 時系列検索最適化のため created_at にインデックス（場合によりBRIN）。
- 性能要件に応じて複合インデックスを設定。

## 5. 物理データモデル（型・制約・インデックス）

### 5.1 テーブル定義一覧

#### users
- 用途: 匿名ユーザーの基本プロフィール
- カラム:
  - id: uuid PK default gen_random_uuid()
  - nickname: varchar(20) not null
  - gender: varchar(10) not null -- 'male'|'female' など
  - age: smallint not null check (age between 18 and 90)
  - prefecture: varchar(32) not null
  - created_at: timestamptz not null default now()
  - updated_at: timestamptz not null default now()
- インデックス: (nickname), (gender), (age), (prefecture)

#### posts
- 用途: 掲示板投稿
- カラム:
  - id: uuid PK
  - user_id: uuid not null references users(id) on delete cascade
  - content: varchar(100) not null
  - purpose_tag: varchar(32) not null
  - created_at: timestamptz not null default now()
  - expires_at: timestamptz not null -- 例: 作成1時間後
- インデックス: (purpose_tag), (created_at), 部分IDX: (expires_at) where expires_at > now()

#### matches
- 用途: 申請/承認のマッチング記録
- カラム:
  - id: uuid PK
  - post_id: uuid not null references posts(id) on delete cascade
  - applicant_id: uuid not null references users(id) on delete cascade
  - status: varchar(16) not null -- 'pending'|'approved'|'rejected'
  - created_at: timestamptz not null default now()
  - expires_at: timestamptz not null -- 例: 作成20分後（UI制御の参考）
- インデックス: (post_id), (applicant_id), (status), (created_at)

#### chat_rooms
- 用途: マッチ成立で作成される1対1ルーム
- カラム:
  - id: uuid PK
  - match_id: uuid not null unique references matches(id) on delete cascade
  - created_at: timestamptz not null default now() -- 20分UI制御に利用
- インデックス: (created_at)

#### room_participants
- 用途: ルーム参加者（2ユーザーを想定）
- カラム:
  - id: uuid PK
  - room_id: uuid not null references chat_rooms(id) on delete cascade
  - user_id: uuid not null references users(id) on delete cascade
  - created_at: timestamptz not null default now()
- 制約: unique(room_id, user_id)
- インデックス: (room_id), (user_id), (created_at)

#### messages
- 用途: テキスト/画像メッセージ（本文はテキスト、画像は別テーブル）
- カラム:
  - id: uuid PK
  - room_id: uuid not null references chat_rooms(id) on delete cascade
  - sender_id: uuid not null references users(id) on delete cascade
  - content: text null check (content is null or char_length(content) <= 500)
  - message_type: varchar(16) not null default 'text' -- 'text'|'image'|'system'
  - is_read: boolean not null default false -- 既読管理（送信者視点での相手既読）
  - created_at: timestamptz not null default now()
- インデックス: (room_id, created_at desc), (sender_id), (created_at)

#### message_attachments
- 用途: 画像データとメタ情報
- カラム:
  - id: uuid PK
  - message_id: uuid not null references messages(id) on delete cascade
  - file_data: bytea not null
  - file_name: varchar(128) not null
  - file_size: integer not null check (file_size <= 2097152) -- 2MB
  - mime_type: varchar(64) not null check (mime_type in ('image/jpeg','image/png'))
  - created_at: timestamptz not null default now()
- インデックス: (message_id), (created_at)

#### notifications
- 用途: 通知メッセージ（APNs送信用のログ）
- カラム:
  - id: uuid PK
  - user_id: uuid not null references users(id) on delete cascade
  - type: varchar(32) not null
  - title: varchar(128) not null
  - body: text not null
  - data: jsonb null
  - created_at: timestamptz not null default now()
  - expires_at: timestamptz not null default (now() + interval '24 hours')
- インデックス: (user_id), (created_at), (expires_at)

#### ad_banners
- 用途: アクティブな広告管理
- カラム:
  - id: uuid PK
  - image_url: text not null
  - click_url: text not null
  - is_active: boolean not null default true
  - priority: integer not null default 0
  - expires_at: timestamptz not null
  - created_at: timestamptz not null default now()
- インデックス: (is_active), (expires_at), (priority desc)
- 部分インデックス: (is_active, expires_at) where is_active = true and expires_at > now()

#### user_subscriptions
- 用途: RevenueCat連携の課金状態スナップショット
- カラム:
  - id: uuid PK
  - user_id: uuid not null references users(id) on delete cascade
  - product_id: varchar(64) not null -- 例: monthly, weekly
  - entitlement_active: boolean not null
  - renewed_at: timestamptz null
  - expires_at: timestamptz null
  - created_at: timestamptz not null default now()
- インデックス: (user_id), (entitlement_active), (expires_at)

### 5.2 リレーション/参照整合性
- 外部キーは on delete cascade を基本とし、親削除時の孤児レコード発生を防止。
- `chat_rooms` は `matches` と1対1で unique(match_id)。
- `room_participants` は unique(room_id, user_id)。

### 5.3 期限と削除ポリシー
- 20分制限: DB削除は行わず `chat_rooms.created_at` を用いたUI表示制御。
- 24時間削除（容量管理）: 以下テーブルで `created_at < now() - interval '24 hours'` を削除対象。
  - chat_rooms, room_participants, messages, message_attachments
- posts は `expires_at` に基づいて業務要件に応じ削除または非表示。

### 5.4 パフォーマンス設計
- インデックス戦略:
  - users: (nickname), (gender), (age), (prefecture)
  - posts: (purpose_tag), (created_at), 部分 (expires_at)
  - chat_rooms: (created_at) → BRIN検討
  - room_participants: (room_id), (user_id), (created_at)
  - messages: (room_id, created_at desc), (sender_id)
  - message_attachments: (message_id), (created_at)
  - notifications: (user_id), (expires_at)
  - ad_banners: (is_active), (expires_at), (priority)
  - user_subscriptions: (user_id), (entitlement_active)
- パーティショニング（任意）: 大量時は messages を日/週単位で RANGE 分割。

### 5.5 セキュリティ設計（DB）
- 接続はアプリ層でJWT認証（DBはアプリ層のみ接続）。
- RDS セキュリティグループでEC2からのみ接続許可。
- 透過暗号化は不要方針。通信路のTLSのみ。

### 5.6 マイグレーション/運用
- ORM: Prisma を利用（DDLはコード管理）。
- 定期削除: 毎日 02:00 に Cron で24時間超のチャット系データを削除（トランザクション/ログ）。
- 監視: テーブルサイズ、インデックス膨張、クエリ遅延をCloudWatch + 追加メトリクスで監視。

## 6. 代表DDL（参考：実装はORMで管理）
```sql
-- 拡張
create extension if not exists pgcrypto; -- gen_random_uuid()

-- 例: chat_rooms
create table if not exists chat_rooms (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references matches(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_rooms_created_at on chat_rooms(created_at);

-- 例: message_attachments
create table if not exists message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  file_data bytea not null,
  file_name varchar(128) not null,
  file_size integer not null check (file_size <= 2097152),
  mime_type varchar(64) not null check (mime_type in ('image/jpeg','image/png')),
  created_at timestamptz not null default now()
);
create index if not exists idx_msg_attach_message_id on message_attachments(message_id);
```

## 7. データサンプル（最小）
```text
users: {id, nickname: "たろう", gender: "male", age: 28, prefecture: "Tokyo"}
posts: {user_id: users.id, content: "今夜飲める方", purpose_tag: "casual"}
matches: {post_id: posts.id, applicant_id: users.id, status: "approved"}
chat_rooms: {match_id: matches.id}
room_participants: {room_id: chat_rooms.id, user_id: users.id}
messages: {room_id: chat_rooms.id, sender_id: users.id, content: "こんにちは", message_type: "text"}
message_attachments: {message_id: messages.id, file_name: "photo.jpg", mime_type: "image/jpeg", file_size: 123456, file_data: <BYTEA>}
```

## 8. 変更管理
- 本設計はMVP版。将来的に動画、通話、AIマッチング等の拡張時はテーブル追加/分割を検討。


