import SwiftUI
import UIKit

// MARK: - 메뉴판 카드 (이미지로 저장 · 공유)
// 웹의 meal-plan-card-image.ts 와 같은 구성: 흰 바탕, 가운데 정렬, 우리집 이름 → 메뉴판 이름 → 메뉴와 재료, 하단 로고.
// 사진 없이 글자만 쓰고, 폰트만 고를 수 있다.

struct CardTemplate: Identifiable, Hashable {
    let id: String
    let label: String
    let nameSize: CGFloat
    let titleBold: Bool
    let font: (CGFloat, Font.Weight) -> Font

    static func == (a: CardTemplate, b: CardTemplate) -> Bool { a.id == b.id }
    func hash(into h: inout Hasher) { h.combine(id) }

    static let all: [CardTemplate] = [
        CardTemplate(id: "sans", label: "기본", nameSize: 26, titleBold: true) { .suit($0, $1) },
        CardTemplate(id: "noltotaenggu", label: "노을탱구", nameSize: 34, titleBold: false) { s, _ in .custom("Griun_NoltoTAENGGU-Rg", size: s) },
        CardTemplate(id: "hwalkongserif", label: "활공세리프", nameSize: 34, titleBold: true) { s, _ in .custom("HSHwalkongSerif-Regular", size: s) },
        CardTemplate(id: "memoment", label: "꾸끄꾹", nameSize: 34, titleBold: true) { s, _ in .custom("MemomentKkukkukkR", size: s) },
        CardTemplate(id: "chosun-gs", label: "조선굵은", nameSize: 34, titleBold: true) { s, _ in .custom("ChosunGs", size: s) },
        CardTemplate(id: "chosun-sm", label: "조선얇은", nameSize: 26, titleBold: true) { s, _ in .custom("ChosunSm", size: s) },
    ]
}

struct CardRecipe: Identifiable, Equatable {
    let id = UUID()
    var title: String
    /// "재료1, 재료2, 재료3"
    var ingredientsText: String

    /// 화면을 다시 그릴 때마다 새로 만들어지는 id는 비교하지 않는다 (내용이 같으면 "수정 안 함")
    static func == (a: CardRecipe, b: CardRecipe) -> Bool {
        a.title == b.title && a.ingredientsText == b.ingredientsText
    }

    var ingredients: [String] {
        ingredientsText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
    }
}

struct MealboardCardData: Equatable {
    var householdName: String
    var title: String
    var recipes: [CardRecipe]
}

/// 실제 이미지가 되는 카드 (1000 × 1850 px)
struct MealboardCardView: View {
    let data: MealboardCardData
    let template: CardTemplate

    static let width: CGFloat = 1000
    static let height: CGFloat = 1850

    var body: some View {
        let recipes = data.recipes.filter { !$0.title.trimmingCharacters(in: .whitespaces).isEmpty }
        // 메뉴가 많으면 글자와 간격을 함께 줄여 한 장에 담는다 (적으면 원래 크기 그대로)
        let natural = CGFloat(recipes.count) * (40 + 22 + 85)
        let available = Self.height - 410 - 100 - 90
        let scale = natural > available ? max(0.45, available / natural) : 1

        ZStack {
            Color.white
            VStack(spacing: 0) {
                Text(data.householdName).font(template.font(26, .regular)).padding(.top, 165)
                Text(data.title).font(template.font(46, template.titleBold ? .bold : .regular)).padding(.top, 34)
                VStack(spacing: 85 * scale) {
                    ForEach(recipes) { r in
                        VStack(spacing: 14 * scale) {
                            Text(r.title).font(template.font(template.nameSize * scale, .medium))
                            Text(r.ingredients.isEmpty ? "-" : r.ingredients.joined(separator: ", "))
                                .font(template.font(22 * scale, .regular)).foregroundStyle(Color(hex: 0x6B6B6B))
                        }
                    }
                }
                .padding(.top, 118)
                Spacer(minLength: 0)
                Image("logo-mark").resizable().scaledToFit().frame(width: 44, height: 44).padding(.bottom, 28)
            }
            .foregroundStyle(Color(hex: 0x1C1C1C))
            .multilineTextAlignment(.center)
            .padding(.horizontal, 90)
        }
        .frame(width: Self.width, height: Self.height)
        .environment(\.colorScheme, .light)
    }
}

// MARK: - 사진에 저장

private final class PhotoSaver: NSObject {
    var done: (Bool) -> Void = { _ in }
    @objc func image(_ image: UIImage, didFinishSavingWithError error: Error?, contextInfo: UnsafeRawPointer) {
        done(error == nil)
    }
}

// MARK: - 폰트 고르기 · 내용 수정 · 이미지로 저장 · 공유하기

struct MealboardCardSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss

    let original: MealboardCardData
    let shareTitle: String

    @State private var data: MealboardCardData
    @State private var templateIndex = 0
    @State private var image: UIImage?
    @State private var editing = false
    @State private var editKey = 0
    @State private var saver = PhotoSaver()

    init(original: MealboardCardData, shareTitle: String) {
        self.original = original
        self.shareTitle = shareTitle
        _data = State(initialValue: original)
        #if DEBUG
        _templateIndex = State(initialValue: UserDefaults.standard.integer(forKey: "boardfont"))
        #endif
    }

    private var edited: Bool { data != original }
    private var template: CardTemplate { CardTemplate.all[min(templateIndex, CardTemplate.all.count - 1)] }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if editing {
                Text("메뉴판에 보여질 내용").font(.suit(15, .bold))
                CardContentEditor(data: data, onCancel: { editing = false }) { data = $0; editing = false }
                    .id(editKey)
            } else {
                chooser
            }
        }
        .padding(.horizontal, 20).padding(.top, 28).padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationBackground(Theme.background)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(28)
        .onAppear {
            #if DEBUG
            if UserDefaults.standard.bool(forKey: "boardedited") { data.title += " · 수정" }
            #endif
            render()
        }
        .onChange(of: data) { render() }
        .onChange(of: templateIndex) { render() }
    }

    // MARK: 폰트 고르기 + 미리보기 + 저장/공유

    private var chooser: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 머리: 제목 + 닫기 (아래쪽의 큰 닫기 버튼을 대신한다)
            HStack {
                Text("메뉴판 만들기").font(.suit(20, .bold)).tracking(-0.3)
                Spacer()
                Button { dismiss() } label: {
                    Image(systemName: "xmark").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.sub)
                        .frame(width: 34, height: 34).background(Theme.surface, in: Circle())
                }
                .buttonStyle(PressStyle()).accessibilityLabel("닫기")
            }

            Text("폰트를 골라주세요").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
            FlowLayout(spacing: 8) {
                ForEach(Array(CardTemplate.all.enumerated()), id: \.element.id) { i, t in
                    Button { templateIndex = i } label: {
                        Text(t.label).font(t.font(15, .regular))
                            .foregroundStyle(i == templateIndex ? Theme.accent : Theme.sub)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(i == templateIndex ? Theme.accentSoft : Theme.card, in: Capsule())
                            .overlay(Capsule().strokeBorder(i == templateIndex ? Theme.accent : Theme.border, lineWidth: 1))
                    }
                    .buttonStyle(PressStyle())
                }
            }

            Group {
                if let image {
                    Image(uiImage: image).resizable().scaledToFit()
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.border, lineWidth: 1))
                } else {
                    Text("만드는 중...").font(.suit(12.5)).foregroundStyle(Theme.faint).frame(maxWidth: .infinity).padding(.vertical, 60)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // 카드 내용을 바꾸는 두 동작은 미리보기 바로 아래에 나란히: 내용 수정 / (바꿨을 때만) 초기화
            HStack(spacing: 8) {
                Spacer()
                cardAction("내용 수정", icon: "pencil", tint: Theme.accent) { editing = true }
                if edited {
                    cardAction("초기화", icon: "arrow.counterclockwise", tint: Theme.sub) { data = original; editKey += 1 }
                        .transition(.opacity.combined(with: .scale(scale: 0.9)))
                }
                Spacer()
            }
            .animation(.easeOut(duration: 0.15), value: edited)

            HStack(spacing: 8) {
                Button(action: saveImage) {
                    Text("이미지로 저장").font(.suit(15, .bold)).foregroundStyle(Theme.ink)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(PressStyle()).disabled(image == nil)
                if let image {
                    ShareLink(item: Image(uiImage: image), preview: SharePreview(shareTitle, image: Image(uiImage: image))) {
                        Text("공유하기").font(.suit(15, .bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 14)
                            .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                } else {
                    Text("공유하기").font(.suit(15, .bold)).foregroundStyle(Theme.faint)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
        }
    }

    private func cardAction(_ title: String, icon: String, tint: Color, run: @escaping () -> Void) -> some View {
        Button(action: run) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.system(size: 12, weight: .bold))
                Text(title).font(.suit(13.5, .bold))
            }
            .foregroundStyle(tint).padding(.horizontal, 14).padding(.vertical, 9)
            .background(Theme.surface, in: Capsule())
        }
        .buttonStyle(PressStyle())
    }

    private func render() {
        let renderer = ImageRenderer(content: MealboardCardView(data: data, template: template))
        renderer.scale = 1
        image = renderer.uiImage
    }

    private func saveImage() {
        guard let image else { return }
        saver.done = { ok in
            Task { @MainActor in store.showToast(ok ? "저장했어요" : "설정에서 사진 저장 권한을 허용해주세요.") }
        }
        UIImageWriteToSavedPhotosAlbum(image, saver, #selector(PhotoSaver.image(_:didFinishSavingWithError:contextInfo:)), nil)
    }
}

// MARK: - 카드에만 반영되는 내용 수정 (실제 레시피·메뉴판 데이터는 바뀌지 않는다)

struct CardContentEditor: View {
    let data: MealboardCardData
    let onCancel: () -> Void
    let onSave: (MealboardCardData) -> Void

    @State private var household: String
    @State private var title: String
    @State private var recipes: [CardRecipe]

    init(data: MealboardCardData, onCancel: @escaping () -> Void, onSave: @escaping (MealboardCardData) -> Void) {
        self.data = data; self.onCancel = onCancel; self.onSave = onSave
        _household = State(initialValue: data.householdName)
        _title = State(initialValue: data.title)
        _recipes = State(initialValue: data.recipes)
    }

    var body: some View {
        VStack(spacing: 12) {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    labeled("우리집 이름", text: $household, placeholder: "")
                    labeled("메뉴판 이름", text: $title, placeholder: "")
                    ForEach($recipes) { $r in
                        VStack(spacing: 8) {
                            HStack(spacing: 8) {
                                TextField("메뉴 이름", text: $r.title).font(.suit(15, .bold))
                                    .padding(.horizontal, 12).frame(height: 42)
                                    .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                                Button { recipes.removeAll { $0.id == r.id } } label: {
                                    Image(systemName: "xmark").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.faint)
                                        .frame(width: 32, height: 32)
                                }
                                .accessibilityLabel("삭제")
                            }
                            TextField("재료1, 재료2, 재료3", text: $r.ingredientsText).font(.suit(13)).foregroundStyle(Theme.sub)
                                .padding(.horizontal, 12).frame(height: 40)
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .padding(12).background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    Button { recipes.append(CardRecipe(title: "", ingredientsText: "")) } label: {
                        Text("+ 메뉴 추가").font(.suit(13, .bold)).foregroundStyle(Theme.accent)
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(Theme.border, style: StrokeStyle(lineWidth: 1.2, dash: [4, 4])))
                    }
                    .buttonStyle(PressStyle())
                }
            }
            .scrollDismissesKeyboard(.interactively)
            HStack(spacing: 8) {
                Button(action: onCancel) {
                    Text("취소").font(.suit(15, .bold)).foregroundStyle(Theme.sub)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Button(action: save) {
                    Text("확인").font(.suit(15, .bold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
            .buttonStyle(PressStyle())
        }
    }

    private func labeled(_ label: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(.suit(12, .semibold)).foregroundStyle(Theme.sub)
            TextField(placeholder, text: text).font(.suit(15))
                .padding(.horizontal, 12).frame(height: 44)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    private func save() {
        onSave(MealboardCardData(
            householdName: household.trimmingCharacters(in: .whitespaces).isEmpty ? data.householdName : household,
            title: title.trimmingCharacters(in: .whitespaces).isEmpty ? data.title : title,
            recipes: recipes.filter { !$0.title.trimmingCharacters(in: .whitespaces).isEmpty }))
    }
}
