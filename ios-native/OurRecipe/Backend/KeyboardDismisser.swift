import UIKit

/// 키보드가 올라와 있을 때 입력창이나 버튼이 아닌 곳을 누르면 키보드를 내린다.
/// 터치를 가로채지 않아서(cancelsTouchesInView = false) 다른 화면 동작에는 영향이 없다.
@MainActor
enum KeyboardDismisser {
    private static var installed = false
    private static let handler = Handler()

    static func install() {
        guard !installed, let window = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow }).first else { return }
        installed = true
        let tap = UITapGestureRecognizer(target: handler, action: #selector(Handler.tapped))
        tap.cancelsTouchesInView = false
        tap.delegate = handler
        window.addGestureRecognizer(tap)
    }

    private final class Handler: NSObject, UIGestureRecognizerDelegate {
        @objc func tapped() { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            var view = touch.view
            while let v = view {
                if v is UITextField || v is UITextView || v is UIControl { return false }
                view = v.superview
            }
            return true
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool { true }
    }
}
