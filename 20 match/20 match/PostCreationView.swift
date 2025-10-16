import SwiftUI

struct PostCreationView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var posts: [Post]
    
    @State private var content: String = ""
    @State private var purposeTag: String = ""
    @State private var age: String = ""
    @State private var prefecture: String = ""
    
    var body: some View {
        NavigationStack {
            Form {
                TextField("Content", text: $content)
                TextField("Purpose Tag", text: $purposeTag)
                TextField("Age", text: $age)
                TextField("Prefecture", text: $prefecture)
            }
            .foregroundColor(.black)
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("New Post")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Post") {
                        let newPost = Post(icon: "person.crop.circle.fill", age: Int(age) ?? 0, prefecture: prefecture, content: content, purposeTag: purposeTag)
                        posts.append(newPost)
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    PostCreationView(posts: .constant([]))
}
