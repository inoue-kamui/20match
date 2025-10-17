import SwiftUI

struct ProfileEditorView: View {
    enum Mode {
        case onboarding
        case edit
    }
    
    let mode: Mode
    let baseBackground: Color
    
    // 保存先（軽量に AppStorage）
    @AppStorage("profile_iconName") private var iconName: String = "person.crop.circle.fill"
    @AppStorage("profile_nickname") private var nickname: String = ""
    @AppStorage("profile_age") private var age: Int = 20
    @AppStorage("profile_prefecture") private var prefectureRaw: String = Prefecture.tokyo.rawValue
    @AppStorage("hasCompletedProfile") private var hasCompletedProfile: Bool = false
    // タブ選択（掲示板=0, チャット=1, 設定=2）
    @AppStorage("selectedTab") private var selectedTab: Int = 0
    
    @Environment(\.dismiss) private var dismiss
    
    @State private var tempIconName: String = "person.crop.circle.fill"
    @State private var tempNickname: String = ""
    @State private var tempAge: Int = 20
    @State private var tempPrefecture: Prefecture = .tokyo
    
    private let iconCandidates: [String] = [
        "person.crop.circle.fill",
        "person.circle.fill",
        "face.smiling",
        "person.fill",
        "person.2.circle.fill",
        "star.circle.fill",
        "heart.circle.fill"
    ]
    private let ageRange = Array(18...80)
    
    var body: some View {
        ZStack {
            baseBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    
                    // アイコン選択
                    sectionCard(title: "アイコン") {
                        iconPicker
                    }
                    
                    // ニックネーム
                    sectionCard(title: "ニックネーム") {
                        TextField("ニックネームを入力", text: $tempNickname)
                            .textInputAutocapitalization(.none)
                            .autocorrectionDisabled()
                            .foregroundColor(.white)
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
                    }
                    
                    // 年齢 Picker
                    sectionCard(title: "年齢") {
                        Picker("年齢", selection: $tempAge) {
                            ForEach(ageRange, id: \.self) { value in
                                Text("\(value)歳")
                                    .foregroundColor(.white)
                                    .tag(value)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 120)
                        .clipped()
                        .tint(.white)
                        .colorScheme(.dark)
                    }
                    
                    // 都道府県 Picker
                    sectionCard(title: "都道府県") {
                        Picker("都道府県", selection: $tempPrefecture) {
                            ForEach(Prefecture.allCases) { pref in
                                Text(pref.displayName)
                                    .foregroundColor(.white)
                                    .tag(pref)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 160)
                        .clipped()
                        .tint(.white)
                        .colorScheme(.dark)
                    }
                    
                    saveButton
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 16)
            }
        }
        .navigationTitle(mode == .edit ? "プロフィール設定" : "プロフィール登録")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarBackground(baseBackground, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .interactiveDismissDisabled(mode == .onboarding && !hasCompletedProfile)
        .onAppear {
            // 既存値を一時変数にロード（編集キャンセル時のため）
            tempIconName = iconName
            tempNickname = nickname
            tempAge = age
            tempPrefecture = Prefecture(rawValue: prefectureRaw) ?? .tokyo
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 10) {
            Image(systemName: tempIconName)
                .font(.system(size: 64))
                .foregroundColor(.white)
                .padding(12)
                .background(
                    Circle().fill(Color.white.opacity(0.15))
                )
                .overlay(
                    Circle().stroke(Color.white.opacity(0.25), lineWidth: 0.8)
                )
            
            Text(tempNickname.isEmpty ? "ニックネーム未設定" : tempNickname)
                .foregroundColor(.white)
                .font(.headline)
            
            HStack(spacing: 12) {
                Text("\(tempAge)歳")
                Text(tempPrefecture.displayName)
            }
            .foregroundColor(.white.opacity(0.85))
            .font(.subheadline)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }
    
    private func sectionCard<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .foregroundColor(.white)
                .font(.headline)
            content()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(0.10))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
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
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.05), lineWidth: 0.8)
        )
        .shadow(color: .black.opacity(0.22), radius: 8, x: 0, y: 6)
    }
    
    private var iconPicker: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
            ForEach(iconCandidates, id: \.self) { symbol in
                Button {
                    tempIconName = symbol
                } label: {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(symbol == tempIconName ? Color.white.opacity(0.20) : Color.white.opacity(0.10))
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.white.opacity(symbol == tempIconName ? 0.35 : 0.20), lineWidth: 0.9)
                        Image(systemName: symbol)
                            .foregroundColor(.white)
                            .font(.system(size: 24, weight: .semibold))
                            .padding(16)
                    }
                    .frame(height: 64)
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    private var saveButton: some View {
        Button(action: saveProfile) {
            Text(mode == .edit ? "保存する" : "はじめる")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    Capsule().fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.22), Color.white.opacity(0.14)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                )
                .overlay(
                    Capsule().stroke(Color.white.opacity(0.30), lineWidth: 0.8)
                )
                .shadow(color: .black.opacity(0.26), radius: 8, x: 0, y: 6)
        }
        .buttonStyle(.plain)
        .padding(.top, 8)
        .disabled(tempNickname.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .opacity(tempNickname.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.6 : 1.0)
    }
    
    private func saveProfile() {
        let trimmed = tempNickname.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        
        // 値を保存
        iconName = tempIconName
        nickname = trimmed
        age = tempAge
        prefectureRaw = tempPrefecture.rawValue
        hasCompletedProfile = true
        
        // 遷移先の分岐
        switch mode {
        case .onboarding:
            // 初回起動時は掲示板タブへ
            selectedTab = 0
            // フルスクリーンは hasCompletedProfile の変更により ContentView 側で閉じられるが、
            // 念のため明示的に dismiss しても問題なし
            dismiss()
        case .edit:
            // 設定タブからの編集時は設定一覧に戻るだけ（タブは変更しない）
            dismiss()
        }
    }
}

#Preview {
    ProfileEditorView(mode: .edit, baseBackground: Color(red: 33/255, green: 17/255, blue: 52/255))
}
