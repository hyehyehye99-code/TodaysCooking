import SwiftUI
import CoreText

/// 기존 "우리집 레시피" 웹앱 토큰(globals.css)을 그대로 옮긴 값.
enum Theme {
    static let background = Color.white
    static let card = Color.white
    static let surface = Color(hex: 0xF2F2F2)
    static let border = Color(hex: 0xECECEC)
    static let ink = Color(hex: 0x191F28)
    static let sub = Color(hex: 0x6B7684)
    static let faint = Color(hex: 0xA1A8B3)
    static let accent = Color(hex: 0xE8603C)
    static let accentSoft = Color(hex: 0xFDECE7)
    static let warn = Color(hex: 0xF50B0B)
    static let positive = Color(hex: 0xFBBF24)

    static let radius: CGFloat = 20
    static let radiusSmall: CGFloat = 14
}

// MARK: - SUIT 폰트 (웹앱과 같은 서체)

enum SUIT {
    static func register() {
        let names = ["SUIT-Regular", "SUIT-Medium", "SUIT-SemiBold", "SUIT-Bold", "SUIT-ExtraBold",
                     // 메뉴판 카드 전용 폰트 (웹과 같은 파일)
                     "griun-noltotaenggu", "hs-hwalkongserif", "memoment-kkukkukk", "chosun-gs", "chosun-sm"]
        for n in names {
            if let url = Bundle.main.url(forResource: n, withExtension: "ttf") {
                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            }
        }
    }
}

extension Font {
    static func suit(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .heavy, .black: name = "SUIT-ExtraBold"
        case .bold: name = "SUIT-Bold"
        case .semibold: name = "SUIT-SemiBold"
        case .medium: name = "SUIT-Medium"
        default: name = "SUIT-Regular"
        }
        return .custom(name, size: size)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

// MARK: - 공통 모디파이어

extension View {
    /// 흰 카드 + 얇은 #ECECEC 테두리, 그림자 없음
    func paperCard(radius: CGFloat = Theme.radius, fill: Color = Theme.card) -> some View {
        background(fill, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(Theme.border, lineWidth: 1))
    }
}

/// 웹앱 PageHeader: 작은 회색 부엌 이름 + 큰 제목 + 오른쪽 액션
struct PageHeader<Right: View>: View {
    @Environment(Store.self) private var store
    let title: String
    var showKitchen = true
    @ViewBuilder var right: () -> Right

    var body: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 2) {
                if showKitchen { Text(store.kitchenName).font(.suit(13, .semibold)).foregroundStyle(Theme.sub) }
                Text(title).font(.suit(28, .bold)).tracking(-0.5).foregroundStyle(Theme.ink)
            }
            Spacer()
            right()
        }
        .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 12)
    }
}
extension PageHeader where Right == EmptyView {
    init(title: String, showKitchen: Bool = true) { self.init(title: title, showKitchen: showKitchen) { EmptyView() } }
}

struct SectionLabel: View {
    let text: String
    init(_ t: String) { text = t }
    var body: some View {
        Text(text).font(.suit(13, .semibold)).foregroundStyle(Theme.sub).padding(.horizontal, 8)
    }
}

struct PrimaryButton: View {
    let title: String
    var disabled = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title).font(.suit(16, .bold)).frame(maxWidth: .infinity).padding(.vertical, 16)
                .foregroundStyle(disabled ? Theme.faint : .white)
                .background(disabled ? Theme.surface : Theme.accent, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(PressStyle()).disabled(disabled)
    }
}

/// 웹앱의 button:active { scale(0.97) } 손맛
struct PressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

func clockText(_ sec: Int) -> String { String(format: "%02d:%02d", sec / 60, sec % 60) }
func timerLabel(_ sec: Int) -> String { sec % 60 == 0 ? "\(sec / 60)분" : clockText(sec) }
