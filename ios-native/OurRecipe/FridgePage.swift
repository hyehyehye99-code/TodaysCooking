import SwiftUI

// MARK: - 유통기한 고르기 (필수가 아니다: 기한 없음 / +3일 / +1주 … / 날짜 선택)

enum ExpiryChoice: Hashable {
    case none
    case days(Int)
    case date(Date)

    var resolved: Date? {
        switch self {
        case .none: return nil
        case .days(let n): return FridgeItem.date(afterDays: n)
        case .date(let d): return Calendar.current.startOfDay(for: d)
        }
    }

    init(_ date: Date?) { self = date.map { .date($0) } ?? .none }

    /// 추가 줄의 작은 버튼에 보여 줄 짧은 이름
    var shortLabel: String {
        switch self {
        case .none: return "기한 없음"
        case .days(let n): return n == 7 ? "+1주" : n == 14 ? "+2주" : n == 30 ? "+1개월" : "+\(n)일"
        case .date(let d): return d.formatted(.dateTime.month().day().locale(Locale(identifier: "ko_KR")))
        }
    }
}

struct ExpiryPicker: View {
    @Binding var choice: ExpiryChoice
    private let presets: [(String, Int)] = [("+3일", 3), ("+1주", 7), ("+2주", 14), ("+1개월", 30)]

    private var isDate: Bool { if case .date = choice { return true } else { return false } }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            FlowLayout(spacing: 6) {
                option("기한 없음", on: choice == .none) { choice = .none }
                ForEach(presets, id: \.1) { label, n in
                    option(label, on: choice == .days(n)) { choice = .days(n) }
                }
                option("날짜 선택", icon: "calendar", on: isDate) {
                    if !isDate { choice = .date(FridgeItem.date(afterDays: 7)) }
                }
            }
            if case .date(let d) = choice {
                DatePicker("유통기한", selection: Binding(get: { d }, set: { choice = .date($0) }), in: Date.distantPast..., displayedComponents: .date)
                    .datePickerStyle(.compact).environment(\.locale, Locale(identifier: "ko_KR"))
                    .font(.suit(14)).tint(Theme.accent)
            } else if let r = choice.resolved {
                Text("유통기한 \(r.formatted(.dateTime.month().day().locale(Locale(identifier: "ko_KR"))))까지")
                    .font(.suit(12)).foregroundStyle(Theme.sub)
            }
        }
    }

    private func option(_ label: String, icon: String? = nil, on: Bool, run: @escaping () -> Void) -> some View {
        Button(action: run) { FilterChip(label: label, systemImage: icon, on: on) }.buttonStyle(PressStyle())
    }
}

// MARK: - 보유중인 재료 (전체 화면): 목록 + 하단 한 줄 추가

struct FridgePage: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var query = ""
    @State private var editMode: EditMode = .inactive
    @State private var selection: Set<UUID> = []
    @State private var editing: FridgeItem?
    @State private var showReminder = false

    // 하단 추가 줄
    @State private var newName = ""
    @State private var newExpiry: ExpiryChoice = .none
    @State private var pickDate = false
    @State private var pickedDate = FridgeItem.date(afterDays: 7)
    @FocusState private var nameFocused: Bool

    private var isEditing: Bool { editMode.isEditing }

    private var filtered: [FridgeItem] {
        let q = query.trimmingCharacters(in: .whitespaces)
        return store.fridge.filter { q.isEmpty || $0.name.contains(q) }
    }
    private func byDate(_ items: [FridgeItem]) -> [FridgeItem] {
        items.sorted { ($0.days ?? 0, $0.name) < ($1.days ?? 0, $1.name) }
    }
    private var soon: [FridgeItem] { byDate(filtered.filter { $0.days != nil && $0.isSoon }) }
    private var later: [FridgeItem] { byDate(filtered.filter { $0.days != nil && !$0.isSoon }) }
    private var noDate: [FridgeItem] { filtered.filter { $0.days == nil }.sorted { $0.name < $1.name } }

    var body: some View {
        VStack(spacing: 0) {
            header
            if store.fridge.count > 8 { searchRow }
            if store.fridge.isEmpty { empty } else { list }
        }
        .background(Theme.background.ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) { isEditing ? AnyView(selectBar) : AnyView(addBar) }
        .environment(\.editMode, $editMode)
        .sheet(item: $editing) { item in
            FridgeEditSheet(item: item) { name, amt, expiry in store.updateFridge(item.id, name: name, amt: amt, expiry: expiry) }
                onDelete: { store.removeFridge([item.id]) }
        }
        .sheet(isPresented: $showReminder) { ReminderSheet() }
        .sheet(isPresented: $pickDate) {
            VStack(spacing: 8) {
                Text("유통기한 날짜").font(.suit(17, .bold)).padding(.top, 22)
                DatePicker("유통기한", selection: $pickedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical).labelsHidden().tint(Theme.accent)
                    .environment(\.locale, Locale(identifier: "ko_KR")).padding(.horizontal, 12)
                PrimaryButton(title: "확인") { newExpiry = .date(pickedDate); pickDate = false }.padding(.horizontal, 16)
                Spacer(minLength: 0)
            }
            .presentationBackground(Theme.background)
            .presentationDetents([.height(520)])
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(28)
        }
        .toolbar(.hidden, for: .navigationBar)
        .toolbar(.hidden, for: .tabBar)
        .task {
            // 화면 확인용 실행 인자 (-fridgebell / -fridgeedit)
            #if DEBUG
            try? await Task.sleep(for: .seconds(1.5))
            if UserDefaults.standard.bool(forKey: "fridgebell") { showReminder = true }
            if UserDefaults.standard.bool(forKey: "fridgeedit") { editing = byDate(store.fridge).first }
            #endif
        }
    }

    // MARK: 머리말 — 뒤로 / 제목 / 알림 / 편집

    private var header: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.ink)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .buttonStyle(PressStyle()).accessibilityLabel("뒤로")
            Text("보유중인 재료").font(.suit(22, .bold)).tracking(-0.4)
            Spacer(minLength: 4)
            Button { showReminder = true } label: {
                Image(systemName: store.cleanupReminder ? "bell.fill" : "bell").font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(store.cleanupReminder ? Theme.accent : Theme.sub)
                    .frame(width: 36, height: 36).background(Theme.surface, in: Circle())
            }
            .buttonStyle(PressStyle()).accessibilityLabel("냉장고 정리 알림")
            if !store.fridge.isEmpty {
                Button(isEditing ? "완료" : "편집") {
                    withAnimation { editMode = isEditing ? .inactive : .active }
                    selection = []
                }
                .font(.suit(15, .bold)).foregroundStyle(Theme.accent).padding(.leading, 4)
            }
        }
        .padding(.horizontal, 16).padding(.top, 18).padding(.bottom, 10)
    }

    private var searchRow: some View {
        SearchField(text: $query, prompt: "재료 검색").padding(.horizontal, 16).padding(.bottom, 6)
    }

    // MARK: 목록

    private var list: some View {
        List(selection: $selection) {
            section("곧 상해요", items: soon, accent: true)
            section("여유 있어요", items: later, accent: false)
            section("기한 없음", items: noDate, accent: false)
            if filtered.isEmpty {
                Text("검색 결과가 없어요.").font(.suit(14)).foregroundStyle(Theme.sub)
                    .frame(maxWidth: .infinity).padding(.top, 30).listRowSeparator(.hidden).listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.interactively)
    }

    @ViewBuilder
    private func section(_ title: String, items: [FridgeItem], accent: Bool) -> some View {
        if !items.isEmpty {
            Section {
                ForEach(items) { f in
                    row(f)
                        .listRowInsets(EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
                        .listRowSeparatorTint(Theme.border)
                        .listRowBackground(Theme.background)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) { store.removeFridge([f.id]) } label: { Text("빼기") }
                        }
                }
            } header: {
                Text(title).font(.suit(13, .bold)).foregroundStyle(accent ? Theme.accent : Theme.sub)
                    .textCase(nil).padding(.vertical, 2)
            }
        }
    }

    @ViewBuilder
    private func row(_ f: FridgeItem) -> some View {
        let content = HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(f.name).font(.suit(16, .semibold)).foregroundStyle(Theme.ink)
                Text(f.amt).font(.suit(12.5)).foregroundStyle(Theme.sub)
            }
            Spacer(minLength: 8)
            if let d = f.ddayText {
                Text(d).font(.suit(12, .bold)).monospacedDigit()
                    .foregroundStyle(f.isSoon ? Theme.accent : Theme.sub)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(f.isSoon ? Theme.accentSoft : Theme.surface, in: Capsule())
            } else {
                Text("기한 없음").font(.suit(12)).foregroundStyle(Theme.faint)
            }
        }
        .padding(.vertical, 12).contentShape(Rectangle())

        if isEditing {
            content.tag(f.id)
        } else {
            Button { editing = f } label: { content }.buttonStyle(.plain).tag(f.id)
        }
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Spacer()
            MascotImage(name: "fridge-open", size: 120)
            Text("냉장고가 비었어요").font(.suit(16, .semibold))
            Text("아래에 재료 이름을 적어서 넣어보세요").font(.suit(13)).foregroundStyle(Theme.sub)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: 하단 한 줄 추가 (이름만 쓰고 엔터, 유통기한은 선택)

    private var addBar: some View {
        HStack(spacing: 8) {
            TextField("재료 이름 (예: 우유)", text: $newName)
                .font(.suit(16)).focused($nameFocused).submitLabel(.done).onSubmit(add)
                .padding(.leading, 6)
            Menu {
                Button("기한 없음") { newExpiry = .none }
                Button("+3일") { newExpiry = .days(3) }
                Button("+1주") { newExpiry = .days(7) }
                Button("+2주") { newExpiry = .days(14) }
                Button("+1개월") { newExpiry = .days(30) }
                Button("날짜 선택…", systemImage: "calendar") { pickDate = true }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "calendar").font(.system(size: 12, weight: .semibold))
                    Text(newExpiry.shortLabel).font(.suit(12.5, .semibold)).lineLimit(1)
                }
                .foregroundStyle(newExpiry == .none ? Theme.sub : Theme.accent)
                .padding(.horizontal, 10).frame(height: 34)
                .background(newExpiry == .none ? Theme.surface : Theme.accentSoft, in: Capsule())
            }
            .accessibilityLabel("유통기한 선택")
            Button(action: add) {
                Image(systemName: "arrow.up").font(.system(size: 15, weight: .bold))
                    .foregroundStyle(canAdd ? .white : Theme.faint)
                    .frame(width: 38, height: 38)
                    .background(canAdd ? Theme.accent : Theme.surface, in: Circle())
            }
            .buttonStyle(PressStyle()).disabled(!canAdd).accessibilityLabel("냉장고에 넣기")
        }
        .padding(.leading, 12).padding(.trailing, 6).padding(.vertical, 6)
        .background(Color.white, in: Capsule())
        .overlay(Capsule().strokeBorder(Theme.border, lineWidth: 1))
        .shadow(color: Color(red: 31 / 255, green: 38 / 255, blue: 60 / 255).opacity(0.08), radius: 12, y: 4)
        .padding(.horizontal, 14).padding(.top, 8).padding(.bottom, 8)
        .background(Theme.background)
    }

    private var canAdd: Bool { !newName.trimmingCharacters(in: .whitespaces).isEmpty }

    private func add() {
        guard canAdd else { return }
        if store.addFridge(name: newName, amt: "", expiry: newExpiry.resolved) {
            newName = ""; newExpiry = .none
            nameFocused = true   // 이어서 다음 재료를 바로 넣을 수 있게
        }
    }

    private var selectBar: some View {
        VStack(spacing: 0) {
            Divider().overlay(Theme.border)
            let allIds = Set(filtered.map(\.id))
            let allSelected = !allIds.isEmpty && allIds.isSubset(of: selection)
            HStack {
                Button { selection = allSelected ? [] : allIds } label: {
                    HStack(spacing: 8) {
                        Image(systemName: allSelected ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 20)).foregroundStyle(allSelected ? Theme.accent : Theme.faint)
                        Text(allSelected ? "전체 해제" : "전체 선택").font(.suit(14.5, .semibold)).foregroundStyle(Theme.ink)
                    }
                }
                Spacer()
                Text("\(filtered.count)개 중 \(selection.count)개 선택").font(.suit(12.5)).foregroundStyle(Theme.sub)
            }
            .padding(.horizontal, 18).padding(.top, 10)
            Button {
                store.removeFridge(selection)
                store.showToast("\(selection.count)개를 뺐어요")
                selection = []; editMode = .inactive
            } label: {
                Text(selection.isEmpty ? "빼낼 재료를 골라주세요" : "선택한 \(selection.count)개 빼기")
                    .font(.suit(16, .bold)).foregroundStyle(selection.isEmpty ? Theme.faint : .white)
                    .frame(maxWidth: .infinity).padding(.vertical, 16)
                    .background(selection.isEmpty ? Theme.surface : Theme.warn, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(PressStyle()).disabled(selection.isEmpty)
            .padding(.horizontal, 16).padding(.vertical, 10)
        }
        .background(Theme.background)
    }
}

// MARK: - 재료 수정 (행을 누르면 열리는 작은 창)

struct FridgeEditSheet: View {
    @Environment(Store.self) private var store
    @Environment(\.dismiss) private var dismiss
    let item: FridgeItem
    let onSave: (String, String, Date?) -> Void
    let onDelete: () -> Void

    @State private var name: String
    @State private var amt: String
    @State private var choice: ExpiryChoice

    init(item: FridgeItem, onSave: @escaping (String, String, Date?) -> Void, onDelete: @escaping () -> Void) {
        self.item = item; self.onSave = onSave; self.onDelete = onDelete
        _name = State(initialValue: item.name)
        _amt = State(initialValue: item.amt)
        _choice = State(initialValue: ExpiryChoice(item.expiry))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("재료 수정").font(.suit(20, .bold)).tracking(-0.3)
            HStack(spacing: 8) {
                TextField("재료 이름", text: $name).font(.suit(16))
                    .padding(.horizontal, 14).frame(height: 48)
                    .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                if !store.isRemote {
                    TextField("수량", text: $amt).font(.suit(16))
                        .padding(.horizontal, 14).frame(width: 96, height: 48)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("유통기한").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                ExpiryPicker(choice: $choice)
            }
            HStack(spacing: 8) {
                Button { onDelete(); dismiss() } label: {
                    Text("빼기").font(.suit(15, .bold)).foregroundStyle(Theme.warn)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Button { onSave(name, amt, choice.resolved); dismiss() } label: {
                    Text("저장").font(.suit(15, .bold)).foregroundStyle(.white)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
            }
            .buttonStyle(PressStyle())
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 20).padding(.top, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationBackground(Theme.background)
        .presentationDetents([.height(420)])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(28)
    }
}

// MARK: - 냉장고 정리 알림 (헤더의 벨 아이콘으로 여는 작은 설정 창)

struct ReminderSheet: View {
    @Environment(Store.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("냉장고 정리 알림").font(.suit(20, .bold)).tracking(-0.3)
            Toggle(isOn: Binding(get: { store.cleanupReminder }, set: { store.setCleanupReminder($0) })) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("정리할 시간을 알려드려요").font(.suit(15, .semibold))
                    Text("주기적으로 임박한 재료를 확인하도록 도와줘요").font(.suit(12.5)).foregroundStyle(Theme.sub)
                }
            }
            .tint(Theme.accent)
            .padding(14).paperCard()

            if store.cleanupReminder {
                VStack(alignment: .leading, spacing: 10) {
                    Text("얼마나 자주").font(.suit(13, .semibold)).foregroundStyle(Theme.sub)
                    HStack(spacing: 6) {
                        ForEach(CleanupFrequency.allCases) { f in
                            Button { store.setCleanupFreq(f) } label: { FilterChip(label: f.rawValue, on: store.cleanupFreq == f) }
                                .buttonStyle(PressStyle())
                        }
                        Text("오후 7시").font(.suit(12.5)).foregroundStyle(Theme.sub).padding(.leading, 4)
                    }
                    Button { Task { await Reminders.preview(); store.showToast("5초 뒤에 알림이 와요") } } label: {
                        Text("5초 뒤 미리 받아보기").font(.suit(13, .semibold)).foregroundStyle(Theme.accent)
                    }
                    .padding(.top, 2)
                }
                .transition(.opacity)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 20).padding(.top, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(.easeOut(duration: 0.18), value: store.cleanupReminder)
        .presentationBackground(Theme.background)
        .presentationDetents([.height(store.cleanupReminder ? 380 : 230)])
        .presentationDragIndicator(.visible)
        .presentationCornerRadius(28)
    }
}
