import Capacitor

// Enables the native iOS "swipe from the left edge to go back" gesture on
// the WKWebView, driven by the same browser history our own back
// buttons/links already navigate — Capacitor doesn't turn this on by
// default (allowsBackForwardNavigationGestures is false out of the box).
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}
