import SwiftUI

// MARK: - 장보기 (목록 중심 · 하단 한 줄 추가 · 밀어서 지우기)

struct ShopView: View {
    @Environment(Store.self) private var store
    @State private var text = ""
    @State private var askClearAll = false
    @FocusState private var focused: Bool

    private var checkedCount: Int { store.shop.filter(\.checked).count }
    private var openItems: [ShopItem] { store.shop.filter { !$0.checked } }
    private var doneItems: [ShopItem] { store.shop.filter(\.checked) }

    /// 아직 안 산 재료를 담은 곳(레시피 이름 / 직접 담은 것)별로 묶는다
    private var groups: [String] {
        var seen: [String] = []
        for i in openItems where !seen.contains(i.from) { seen.append(i.from) }
        return seen
    }

    /// 기존 앱과 같은 구매하기 경로: /redirect/coupang?name=<재료> → 쿠팡 제휴 링크
    private func buyURL(_ name: String) -> URL? {
        var c = URLComponents(string: "https://ourhomemenu.vercel.app/redirect/coupang")
        c?.queryItems = [URLQueryItem(name: "name", value: name)]
        return c?.url
    }

    var body: some View {
        Screen {
            VStack(spacing: 0) {
                header
                if store.shop.isEmpty { empty } else { list }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) { bottomBar }
        .alert("장보기 목록을 모두 지울까요?", isPresented: $askClearAll) {
            Button("취소", role: .cancel) {}
            Button("모두 지우기", role: .destructive) { store.clearAllShop() }
        } message: { Text("되돌릴 수 없어요.") }
    }

    // MARK: 머리말

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("장보기").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                Text(store.kitchenName).font(.suit(28, .bold)).tracking(-0.5).foregroundStyle(Theme.ink)
                if !store.shop.isEmpty {
                    Text(openItems.isEmpty ? "다 담았어요" : "\(openItems.count)개 남았어요")
                        .font(.suit(12.5)).foregroundStyle(Theme.sub).padding(.top, 2)
                }
            }
            Spacer()
            if !store.shop.isEmpty {
                Menu {
                    if checkedCount > 0 { Button("체크한 것 지우기", systemImage: "checkmark.circle") { store.clearCheckedShop() } }
                    Button("모두 지우기", systemImage: "trash", role: .destructive) { askClearAll = true }
                } label: {
                    Image(systemName: "ellipsis").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.sub)
                        .frame(width: 40, height: 40).background(Theme.surface, in: Circle())
                }
                .accessibilityLabel("더보기")
            }
        }
        .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 10)
    }

    // MARK: 목록

    private var list: some View {
        List {
            ForEach(groups, id: \.self) { g in
                Section {
                    ForEach(openItems.filter { $0.from == g }) { row($0) }
                } header: { sectionTitle(g == ShopItem.manual ? g : "부족한 재료 · \(g)") }
            }
            if !doneItems.isEmpty {
                Section {
                    ForEach(doneItems) { row($0) }
                } header: { sectionTitle("체크한 재료") }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.interactively)
    }

    private func sectionTitle(_ t: String) -> some View {
        Text(t).font(.suit(13, .bold)).foregroundStyle(Theme.sub).textCase(nil).padding(.vertical, 2)
    }

    private func row(_ it: ShopItem) -> some View {
        HStack(spacing: 10) {
            Button { store.toggle(it) } label: {
                HStack(spacing: 12) {
                    Circle()
                        .strokeBorder(it.checked ? Theme.accent : Color(hex: 0xD3D6DB), lineWidth: 1.6)
                        .background(Circle().fill(it.checked ? Theme.accent : .white))
                        .frame(width: 24, height: 24)
                        .overlay { if it.checked { Image(systemName: "checkmark").font(.system(size: 11, weight: .black)).foregroundStyle(.white) } }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(it.name).font(.suit(16, .semibold)).strikethrough(it.checked)
                        Text(it.amt).font(.suit(12.5)).foregroundStyle(Theme.sub)
                    }
                    .foregroundStyle(it.checked ? Theme.faint : Theme.ink)
                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.selection, trigger: it.checked)

            if !it.checked, let url = buyURL(it.name) {
                Link(destination: url) {
                    Text("구매하기").font(.suit(12.5, .bold)).foregroundStyle(Theme.accent)
                        .padding(.horizontal, 12).padding(.vertical, 8)
                        .background(Theme.accentSoft, in: Capsule())
                }
                .accessibilityLabel("\(it.name) 쿠팡에서 구매하기")
            }
        }
        .padding(.vertical, 11)
        .listRowInsets(EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
        .listRowSeparatorTint(Theme.border)
        .listRowBackground(Theme.background)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) { store.removeShop([it.id]) } label: { Text("지우기") }
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Spacer()
            MascotImage(name: "grocery-bag", size: 120)
            Text("장보기 목록이 비어 있어요.").font(.suit(16, .semibold))
            Text("메뉴에서 부족한 재료를 눌러 담거나, 아래에 직접 적어보세요").font(.suit(13)).foregroundStyle(Theme.sub)
                .multilineTextAlignment(.center).padding(.horizontal, 40)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: 하단: (체크한 게 있으면) 완료 버튼 + 한 줄 추가

    private var bottomBar: some View {
        VStack(spacing: 8) {
            if checkedCount > 0 {
                VStack(spacing: 6) {
                    PrimaryButton(title: "장보기 완료 → 냉장고에 넣기") { store.completeShopping() }
                    Text("체크한 \(checkedCount)개 재료가 냉장고로 이동해요").font(.suit(12)).foregroundStyle(Theme.sub)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            HStack(spacing: 8) {
                TextField("살 것 추가 (예: 우유 2팩)", text: $text)
                    .font(.suit(16)).focused($focused).submitLabel(.done).onSubmit(add)
                    .padding(.leading, 8)
                Button(action: add) {
                    Image(systemName: "arrow.up").font(.system(size: 15, weight: .bold))
                        .foregroundStyle(canAdd ? .white : Theme.faint)
                        .frame(width: 38, height: 38)
                        .background(canAdd ? Theme.accent : Theme.surface, in: Circle())
                }
                .buttonStyle(PressStyle()).disabled(!canAdd).accessibilityLabel("장보기에 추가")
            }
            .padding(.leading, 12).padding(.trailing, 6).padding(.vertical, 6)
            .background(Color.white, in: Capsule())
            .overlay(Capsule().strokeBorder(Theme.border, lineWidth: 1))
            .shadow(color: Color(red: 31 / 255, green: 38 / 255, blue: 60 / 255).opacity(0.08), radius: 12, y: 4)
        }
        .padding(.horizontal, 14).padding(.top, 8).padding(.bottom, 8)
        .background(Theme.background)
        .animation(.easeOut(duration: 0.2), value: checkedCount)
    }

    private var canAdd: Bool { !text.trimmingCharacters(in: .whitespaces).isEmpty }

    private func add() {
        guard canAdd else { return }
        store.addShop(text)
        text = ""
        focused = true   // 이어서 다음 재료를 바로 적을 수 있게
    }
}
