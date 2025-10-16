//
//  ContentView.swift
//  20 match
//
//  Created by 井上火猛 on 2025/10/17.
//

import SwiftUI

struct ContentView: View {
    @State private var posts: [Post] = [
        Post(icon: "person.crop.circle.fill", age: 24, prefecture: "東京", content: "今夜、誰か一緒に飲みませんか？", purposeTag: "飲み友達募集"),
        Post(icon: "person.crop.circle.fill", age: 28, prefecture: "大阪", content: "週末、映画に行きたいです。", purposeTag: "映画好き"),
        Post(icon: "person.crop.circle.fill", age: 22, prefecture: "福岡", content: "新しいカフェを開拓したい！", purposeTag: "カフェ巡り"),
        Post(icon: "person.crop.circle.fill", age: 31, prefecture: "北海道", content: "美味しいラーメン屋さん知りませんか？", purposeTag: "グルメ"),
        Post(icon: "person.crop.circle.fill", age: 26, prefecture: "沖縄", content: "ビーチでゆっくり過ごしたいです。", purposeTag: "旅行好き")
    ]
    
    @State private var isShowingPostCreationSheet = false

    // ダーク背景
    private let baseBackground = Color(red: 33/255, green: 17/255, blue: 52/255)
    // タグの背景
    private let tagBackground = Color.white.opacity(0.4)

    var body: some View {
        TabView {
            // 掲示板
            NavigationStack {
                ScrollView {
                    LazyVStack(spacing: 22) {
                        ForEach(posts) { post in
                            PostCardView(
                                post: post,
                                tagBackground: tagBackground
                            )
                            .padding(.horizontal, 18)
                        }
                    }
                    .padding(.vertical, 16)
                }
                .background(baseBackground.ignoresSafeArea())
                .navigationTitle("掲示板")
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbarBackground(baseBackground, for: .navigationBar)
                .toolbarColorScheme(.dark, for: .navigationBar)
                .toolbar {
                    ToolbarItem {
                        Button(action: { isShowingPostCreationSheet.toggle() }) {
                            Label("Add Post", systemImage: "plus")
                        }
                        .tint(.white)
                    }
                }
                .sheet(isPresented: $isShowingPostCreationSheet) {
                    PostCreationView(posts: $posts)
                }
                .refreshable {
                    // プルリフレッシュ（モック）
                    try? await Task.sleep(nanoseconds: 600_000_000)
                }
            }
            .tabItem {
                Label("掲示板", systemImage: "list.bullet")
            }

            // チャット一覧（検索バーなし）
            NavigationStack {
                ChatListView(baseBackground: baseBackground)
            }
            .tabItem {
                Label("チャット", systemImage: "message.fill")
            }

            // 設定
            ZStack {
                baseBackground.ignoresSafeArea()
                Text("設定")
                    .font(.largeTitle)
                    .foregroundColor(.white)
            }
            .tabItem {
                Label("設定", systemImage: "gear")
            }
        }
    }
}

private struct PostCardView: View {
    let post: Post
    let tagBackground: Color
    
    private let cornerRadius: CGFloat = 16
    @State private var isPressed: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 14) {
                Image(systemName: post.icon)
                    .font(.system(size: 40))
                    .foregroundColor(.white)
                HStack(spacing: 8) {
                    Text("\(post.age)歳")
                    Text(post.prefecture)
                }
                .font(.headline)
                .foregroundColor(.white)
                Spacer()
            }
            
            Text(post.content)
                .font(.body)
                .foregroundColor(.white)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .frame(minHeight: 44)

            HStack(spacing: 12) {
                Text(post.purposeTag)
                    .font(.caption)
                    .foregroundColor(.white)
                    .padding(.vertical, 7)
                    .padding(.horizontal, 12)
                    .background(tagBackground)
                    .clipShape(Capsule())
                
                Spacer()
                
                Button(action: {}) {
                    Text("マッチング申請")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 20)
                        .background(
                            Capsule().fill(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(isPressed ? 0.18 : 0.22),
                                        Color.white.opacity(isPressed ? 0.10 : 0.14)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        )
                        .overlay(
                            Capsule().strokeBorder(
                                Color.white.opacity(isPressed ? 0.28 : 0.36),
                                lineWidth: 0.8
                            )
                        )
                        .shadow(color: Color.black.opacity(0.20), radius: 8, x: 0, y: 5)
                        .scaleEffect(isPressed ? 0.98 : 1.0)
                        .animation(.spring(response: 0.22, dampingFraction: 0.8), value: isPressed)
                }
                .buttonStyle(.plain)
                .simultaneousGesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in if !isPressed { isPressed = true } }
                        .onEnded { _ in isPressed = false }
                )
            }
        }
        .padding(20)
        .background(
            // 半透明の白ベース（Material/blurなし）
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Color.white.opacity(0.12))
        )
        .overlay(
            // 上辺ハイライト
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .strokeBorder(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.34),
                            Color.white.opacity(0.08)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 0.9
                )
        )
        .overlay(
            // ごく薄い外周輪郭
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 0.8)
        )
        .shadow(color: .black.opacity(0.24), radius: 9, x: 0, y: 7)
    }
}

// MARK: - Chat List (Mock UI Only)

private struct ChatThread: Identifiable {
    let id = UUID()
    let avatarSymbol: String
    let name: String
    let lastMessage: String
    let lastTimestamp: String
    let unreadCount: Int
    let isTyping: Bool
}

private struct ChatListView: View {
    let baseBackground: Color
    
    @State private var threads: [ChatThread] = [
        .init(avatarSymbol: "person.circle.fill", name: "ゆかり (25)", lastMessage: "明日の集合場所どうします？", lastTimestamp: "21:45", unreadCount: 2, isTyping: false),
        .init(avatarSymbol: "person.circle.fill", name: "たくみ (27)", lastMessage: "了解！また連絡します〜", lastTimestamp: "20:12", unreadCount: 0, isTyping: true),
        .init(avatarSymbol: "person.circle.fill", name: "みさき (23)", lastMessage: "カフェの写真送りました ☕️", lastTimestamp: "昨日", unreadCount: 0, isTyping: false),
        .init(avatarSymbol: "person.circle.fill", name: "りょう (29)", lastMessage: "駅に着いたら教えて！", lastTimestamp: "火", unreadCount: 5, isTyping: false),
        .init(avatarSymbol: "person.circle.fill", name: "さな (24)", lastMessage: "ありがとう！助かりました", lastTimestamp: "先週", unreadCount: 0, isTyping: false)
    ]
    
    var body: some View {
        ZStack {
            baseBackground.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(threads) { thread in
                        NavigationLink {
                            ChatDetailView(
                                baseBackground: baseBackground,
                                partnerName: thread.name
                            )
                        } label: {
                            ChatRowView(thread: thread)
                                .padding(.horizontal, 16)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.vertical, 12)
            }
        }
        .navigationTitle("チャット")
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarBackground(baseBackground, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .refreshable {
            // 見た目だけのリフレッシュ
            try? await Task.sleep(nanoseconds: 600_000_000)
        }
    }
}

private struct ChatRowView: View {
    let thread: ChatThread
    
    private let cornerRadius: CGFloat = 14
    
    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.white.opacity(0.15))
                    .frame(width: 52, height: 52)
                    .overlay(
                        Circle().stroke(Color.white.opacity(0.22), lineWidth: 0.8)
                    )
                Image(systemName: thread.avatarSymbol)
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(thread.name)
                        .foregroundColor(.white)
                        .font(.headline)
                        .lineLimit(1)
                    Spacer(minLength: 8)
                    Text(thread.lastTimestamp)
                        .foregroundColor(.white.opacity(0.7))
                        .font(.caption)
                }
                
                HStack(alignment: .center, spacing: 8) {
                    if thread.isTyping {
                        TypingDotsView()
                    } else {
                        Text(thread.lastMessage)
                            .foregroundColor(.white.opacity(0.9))
                            .font(.subheadline)
                            .lineLimit(1)
                    }
                    Spacer()
                    if thread.unreadCount > 0 {
                        Text("\(thread.unreadCount)")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                            .padding(.vertical, 4)
                            .padding(.horizontal, 6)
                            .background(
                                Capsule().fill(Color.red.opacity(0.85))
                            )
                            .overlay(
                                Capsule().stroke(Color.white.opacity(0.2), lineWidth: 0.6)
                            )
                    }
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(Color.white.opacity(0.10))
        )
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [Color.white.opacity(0.30), Color.white.opacity(0.06)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 0.9
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(Color.white.opacity(0.05), lineWidth: 0.8)
        )
        .shadow(color: .black.opacity(0.22), radius: 8, x: 0, y: 6)
    }
}

private struct TypingDotsView: View {
    @State private var phase: CGFloat = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Color.white.opacity(0.85))
                    .frame(width: 6, height: 6)
                    .offset(y: sin((phase + CGFloat(i) * 0.8)) * 2.5)
            }
        }
        .frame(height: 12)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true)) {
                phase = .pi * 2
            }
        }
        .accessibilityLabel("入力中")
    }
}

// MARK: - Chat Detail (Redesigned)

private struct ChatMessage: Identifiable, Equatable {
    enum Status { case sending, sent, read }
    let id = UUID()
    let isMe: Bool
    var text: String
    var timestamp: Date
    var status: Status
}

private struct ChatDetailView: View {
    let baseBackground: Color
    let partnerName: String
    
    @State private var messages: [ChatMessage] = ChatDetailView.mockMessages()
    @State private var inputText: String = ""
    @State private var isPartnerTyping: Bool = false
    
    var body: some View {
        ZStack {
            baseBackground.ignoresSafeArea()
            
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12, pinnedViews: []) {
                        ForEach(groupedByDay(), id: \.key) { day, items in
                            // セクション見出し
                            Text(day)
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.85))
                                .padding(.vertical, 6)
                                .padding(.horizontal, 10)
                                .background(Color.white.opacity(0.10))
                                .clipShape(Capsule())
                                .padding(.vertical, 4)
                            
                            ForEach(items) { msg in
                                MessageBubbleView(message: msg)
                                    .id(msg.id)
                                    .padding(.horizontal, 12)
                            }
                        }
                        
                        if isPartnerTyping {
                            HStack {
                                MessageBubbleSkeleton(isMe: false) {
                                    TypingDotsView()
                                }
                                Spacer()
                            }
                            .padding(.horizontal, 12)
                            .transition(.opacity)
                        }
                    }
                    .padding(.vertical, 12)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: messages) { _, _ in
                    scrollToBottom(proxy: proxy)
                }
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        scrollToBottom(proxy: proxy)
                    }
                }
            }
        }
        // 入力バーは常に最下部に固定（キーボード連動）
        .safeAreaInset(edge: .bottom) {
            MessageInputBar(
                baseBackground: baseBackground,
                text: $inputText,
                onSend: sendMessage
            )
        }
        .navigationTitle(partnerName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear {
            // モック: 2秒後に相手がタイプ開始→1.2秒後に受信
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                isPartnerTyping = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    isPartnerTyping = false
                    receiveMock("写真見たよ！すごく良かった📷")
                }
            }
        }
    }
    
    private func scrollToBottom(proxy: ScrollViewProxy) {
        if let last = messages.last {
            withAnimation(.easeOut(duration: 0.25)) {
                proxy.scrollTo(last.id, anchor: .bottom)
            }
        }
    }
    
    private func groupedByDay() -> [(key: String, value: [ChatMessage])] {
        let calendar = Calendar.current
        let groups = Dictionary(grouping: messages) { msg -> String in
            if calendar.isDateInToday(msg.timestamp) { return "今日" }
            if calendar.isDateInYesterday(msg.timestamp) { return "昨日" }
            let df = DateFormatter()
            df.locale = Locale(identifier: "ja_JP")
            df.dateFormat = "M/d(E)"
            return df.string(from: msg.timestamp)
        }
        return groups
            .sorted { lhs, rhs in
                guard let l = lhs.value.last?.timestamp, let r = rhs.value.last?.timestamp else { return false }
                return l < r
            }
    }
    
    private func sendMessage() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        inputText = ""
        
        var new = ChatMessage(isMe: true, text: trimmed, timestamp: Date(), status: .sending)
        messages.append(new)
        
        // モック: 送信状態→送信済み
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            if let idx = messages.firstIndex(of: new) {
                messages[idx].status = .sent
            }
        }
        
        // モック: 相手からの返信
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            receiveMock("いいね！それでいこう🙌")
        }
    }
    
    private func receiveMock(_ text: String) {
        let msg = ChatMessage(isMe: false, text: text, timestamp: Date(), status: .read)
        messages.append(msg)
    }
    
    static func mockMessages() -> [ChatMessage] {
        let now = Date()
        return [
            ChatMessage(isMe: false, text: "はじめまして！", timestamp: now.addingTimeInterval(-3600*26), status: .read),
            ChatMessage(isMe: true, text: "よろしくお願いします！", timestamp: now.addingTimeInterval(-3600*25.5), status: .read),
            ChatMessage(isMe: false, text: "カフェ好きですか？", timestamp: now.addingTimeInterval(-3600*2), status: .read),
            ChatMessage(isMe: true, text: "大好きです☕️ 新しいお店開拓中です！", timestamp: now.addingTimeInterval(-3600*1.8), status: .read),
            ChatMessage(isMe: false, text: "明日、時間あります？", timestamp: now.addingTimeInterval(-1200), status: .read),
            ChatMessage(isMe: true, text: "夕方なら大丈夫です！", timestamp: now.addingTimeInterval(-600), status: .read),
        ]
    }
}

private struct MessageBubbleView: View {
    let message: ChatMessage
    
    private var bubbleColor: Color {
        message.isMe ? Color.white.opacity(0.18) : Color.white.opacity(0.12)
    }
    private let corner: CGFloat = 16
    private var maxBubbleWidth: CGFloat {
        UIScreen.main.bounds.width * 0.72
    }
    
    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if message.isMe { Spacer(minLength: 40) }
            
            VStack(alignment: message.isMe ? .trailing : .leading, spacing: 6) {
                // バブル本体
                Text(message.text)
                    .foregroundColor(.white)
                    .font(.body)
                    .padding(.vertical, 10)
                    .padding(.horizontal, 12)
                    .background(
                        RoundedRectangle(cornerRadius: corner, style: .continuous)
                            .fill(bubbleColor)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: corner, style: .continuous)
                            .stroke(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.34), Color.white.opacity(0.08)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 0.9
                            )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: corner, style: .continuous)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.8)
                    )
                    .shadow(color: .black.opacity(0.22), radius: 8, x: 0, y: 6)
                    .frame(minWidth: 44, maxWidth: maxBubbleWidth, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                
                // メタ情報（時刻・既読など）をバブルの外側に統一配置
                HStack(spacing: 6) {
                    if message.isMe {
                        Text(timeString(message.timestamp))
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.75))
                        switch message.status {
                        case .sending:
                            Text("送信中").font(.caption2).foregroundColor(.white.opacity(0.7))
                        case .sent:
                            Text("送信済み").font(.caption2).foregroundColor(.white.opacity(0.7))
                        case .read:
                            Text("既読").font(.caption2).foregroundColor(.white.opacity(0.9))
                        }
                    } else {
                        Text(timeString(message.timestamp))
                            .font(.caption2)
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .frame(maxWidth: maxBubbleWidth, alignment: message.isMe ? .trailing : .leading)
                .padding(.horizontal, 4)
            }
            
            if !message.isMe { Spacer(minLength: 40) }
        }
        .padding(.horizontal, 4)
    }
    
    private func timeString(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "ja_JP")
        f.dateFormat = "H:mm"
        return f.string(from: date)
    }
}

private struct MessageBubbleSkeleton<Content: View>: View {
    let isMe: Bool
    @ViewBuilder var content: () -> Content
    
    var body: some View {
        HStack {
            if isMe { Spacer() }
            content()
                .padding(.vertical, 10)
                .padding(.horizontal, 12)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color.white.opacity(0.12))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.18), lineWidth: 0.8)
                )
            if !isMe { Spacer() }
        }
    }
}

private struct MessageInputBar: View {
    let baseBackground: Color
    @Binding var text: String
    var onSend: () -> Void
    
    @FocusState private var focused: Bool
    
    var body: some View {
        VStack(spacing: 10) {
            Divider().background(Color.white.opacity(0.15))
                .padding(.horizontal, -16)
            
            HStack(spacing: 10) {
                TextField("メッセージを入力", text: $text, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.vertical, 10)
                    .padding(.horizontal, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color.white.opacity(0.10))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.white.opacity(0.18), lineWidth: 0.8)
                    )
                    .foregroundColor(.white)
                    .focused($focused)
                
                Button(action: onSend) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(10)
                        .background(
                            Circle().fill(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.22), Color.white.opacity(0.14)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        )
                        .overlay(
                            Circle().stroke(Color.white.opacity(0.30), lineWidth: 0.8)
                        )
                        .shadow(color: .black.opacity(0.26), radius: 8, x: 0, y: 6)
                }
                .buttonStyle(.plain)
                .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .opacity(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1.0)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
        .background(baseBackground.ignoresSafeArea(edges: .bottom))
    }
}

#Preview {
    ContentView()
}
