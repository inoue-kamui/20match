# API定義書（REST + WebSocket）

## 1. 目的・スコープ
- 本書は「要件定義書」「システム設計書」「チャット機能実装設計書」「統合設計書」を統合し、REST APIおよびWebSocketイベントの入出力仕様を定義します。
- バージョン/ミドルウェアは既存方針に準拠（Nest.js 11.1.6 + Socket.io 4.8.1）。

## 2. 共通仕様
- 認証: 匿名JWT（デバイスIDベース）。`Authorization: Bearer <token>`
- コンテンツタイプ: `application/json`（画像アップロードはmultipart）
- レート制限（サーバ側方針）: 1デバイス=100リク/分、1ユーザー=2デバイス、1IP=2デバイス
- エラーフォーマット:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "説明",
    "details": {"field": "reason"}
  }
}
```

## 3. REST API

### 3.1 Users
- POST /users
  - 概要: 匿名ユーザーを作成し、プロフィールを登録
  - Request
    - body: { nickname: string(1-20), gender: 'male'|'female', age: number[18-90], prefecture: string }
  - Response
    - 201: { id: uuid, nickname, gender, age, prefecture, createdAt }

### 3.2 Posts
- POST /posts
  - 概要: 掲示板投稿を作成
  - body: { content: string(1-100), purposeTag: string }
  - 201: { id, userId, content, purposeTag, createdAt, expiresAt }

- GET /posts
  - 概要: 投稿一覧の取得（目的/都道府県/性別/年齢でフィルタ）
  - query: { purposeTag?, prefecture?, gender?, minAge?, maxAge? }
  - 200: { items: Post[], nextCursor? }

### 3.3 Matches
- POST /match/apply/{postId}
  - 概要: 指定投稿にマッチ申請
  - 201: { id, postId, applicantId, status: 'pending', createdAt, expiresAt }

- PATCH /match/approve/{matchId}
  - 概要: マッチ申請を承認し、チャットルームを作成
  - 200: { match: Match{status:'approved'}, chatRoom: { id, matchId, createdAt } }

### 3.4 Chat Rooms & Messages
- GET /chat/rooms
  - 概要: 自ユーザーが参加するアクティブ（UI上20分以内）のチャットルーム一覧
  - 200: { items: [{ roomId, opponent: {userId, nickname}, lastMessage, createdAt, remainingSeconds }] }

- GET /chat/rooms/{roomId}/messages
  - 概要: メッセージ履歴（ページング）
  - query: { cursor?, limit=50 }
  - 200: { items: Message[], nextCursor? }

- POST /chat/rooms/{roomId}/messages
  - 概要: テキストメッセージ送信
  - body: { content: string(<=500) }
  - 201: Message

- POST /chat/rooms/{roomId}/messages/{messageId}/attachments
  - 概要: 画像添付アップロード（multipart/form-data）
  - form fields: file (jpeg/png, <=2MB)
  - 201: { attachmentId, fileName, fileSize, mimeType }

- GET /messages/{messageId}/attachments/{attachmentId}
  - 概要: 画像取得（認可必須）
  - 200: image/jpeg|image/png バイナリ

- POST /chat/rooms/{roomId}/read-receipts
  - 概要: 既読更新（room内の相手未読分を既読化）
  - body: { upToMessageId: uuid }
  - 204: No Content

### 3.5 Notifications
- GET /notifications
  - 概要: 通知一覧
  - 200: { items: Notification[] }

### 3.6 Ads & Subscriptions
- GET /ads/banners
  - 概要: アクティブな広告バナー取得
  - 200: { items: AdBanner[] }

- GET /subscriptions/me
  - 概要: 自ユーザーの課金状態
  - 200: { entitlementActive: boolean, productId?, expiresAt? }

## 4. モデルスキーマ（レスポンス例）
```json
// Message
{
  "id": "uuid",
  "roomId": "uuid",
  "senderId": "uuid",
  "content": "こんにちは",
  "messageType": "text",
  "isRead": false,
  "createdAt": "2025-09-13T12:00:00Z",
  "attachments": [
    {"attachmentId": "uuid", "fileName": "photo.jpg", "fileSize": 123456, "mimeType": "image/jpeg"}
  ]
}
```

## 5. WebSocket 定義（Socket.io）
- 接続URL: `wss://<host>/socket.io/chat`（例）
- 認証: 接続時にJWT（queryまたはauthヘッダ）

### 5.1 イベント（クライアント→サーバー）
- joinRoom
  - payload: { roomId: uuid }
  - ack: { ok: true }

- sendMessage
  - payload: { roomId: uuid, content?: string(<=500), messageType: 'text'|'image' }
  - ack: { ok: true, messageId: uuid }

- readReceipt
  - payload: { roomId: uuid, upToMessageId: uuid }
  - ack: { ok: true }

### 5.2 イベント（サーバー→クライアント）
- messageReceived
  - payload: Message（上記スキーマ）

- readUpdated
  - payload: { roomId: uuid, upToMessageId: uuid }

- timerExpired
  - payload: { roomId: uuid, expiredAt: iso8601 } -- UIでチャット非表示切替

## 6. 認可・制限
- ルームアクセスは `room_participants` に基づく
- 画像取得は添付の `message_id` が同一ルームかつ参加者のみ許可
- レート制限: 1デバイス=100リク/分。1ユーザー=2デバイス。1IP=2デバイス

## 7. ステータスコード方針
- 200 OK / 201 Created / 204 No Content
- 400 Bad Request / 401 Unauthorized / 403 Forbidden / 404 Not Found
- 409 Conflict / 413 Payload Too Large / 429 Too Many Requests
- 500 Internal Server Error

## 8. エラ—コード例
- AUTH_INVALID_TOKEN, ACCESS_DENIED, RATE_LIMITED
- ROOM_NOT_FOUND, MESSAGE_TOO_LONG, ATTACHMENT_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE

## 9. 今後の拡張（参考）
- 動画添付（別テーブル）、音声/ビデオ通話、AIマッチング用の検索API


