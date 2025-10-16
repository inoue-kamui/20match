import Foundation

struct Post: Identifiable {
    let id = UUID()
    let icon: String
    let age: Int
    let prefecture: String
    let content: String
    let purposeTag: String
}