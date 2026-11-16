import SwiftUI

@main
struct OurRecipeApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var store = Store()
    @Environment(\.scenePhase) private var scenePhase

    init() {
        SUIT.register()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .tint(Theme.accent)
                .font(.suit(15))
                .onOpenURL { store.handleURL($0) }
                .onAppear { KeyboardDismisser.install() }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { Task { await store.refreshIfNeeded() } }
                }
        }
    }
}

struct RootView: View {
    @Environment(Store.self) private var store

    var body: some View {
        @Bindable var store = store
        TabView(selection: $store.tab) {
            ChatView()
                .tabItem { Image("tab-assistant").accessibilityLabel("대화") }
                .tag(AppTab.chat)
            RecipesView()
                .tabItem { Image("tab-recipes").accessibilityLabel("레시피") }
                .tag(AppTab.recipes)
            ShopView()
                .tabItem { Image("tab-shopping").accessibilityLabel("장보기") }
                .badge(store.openShopCount)
                .tag(AppTab.shop)
            MyView()
                .tabItem { Image("tab-mypage").accessibilityLabel("마이페이지") }
                .tag(AppTab.my)
        }
        .sheet(isPresented: $store.showLogin) { LoginSheet().environment(store) }
        .fullScreenCover(isPresented: $store.needsSetup) { SetupView().environment(store) }
        .fullScreenCover(isPresented: $store.showFridge) {
            FridgePage()
                .environment(store)
        }
        .overlay {
            if store.showKitchenSettings {
                KitchenSettingsView()
                    .transition(.move(edge: .leading))
                    .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.28), value: store.showKitchenSettings)
        .overlay(alignment: .bottom) {
            if let t = store.toast {
                Text(t)
                    .font(.suit(14, .semibold)).foregroundStyle(.white)
                    .padding(.horizontal, 18).padding(.vertical, 12)
                    .background(Theme.ink, in: Capsule())
                    .padding(.bottom, 110)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .allowsHitTesting(false)
            }
        }
        .animation(.easeOut(duration: 0.2), value: store.toast)
    }
}

/// 모든 탭 공통 배경
struct Screen<Content: View>: View {
    @ViewBuilder var content: () -> Content
    var body: some View {
        content().frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.background.ignoresSafeArea())
    }
}
