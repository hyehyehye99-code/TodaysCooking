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

    // TimerActivityPlugin lives in this target (not an npm package), so it
    // never lands in the auto-generated capacitor.config.json packageClassList
    // that `npx cap sync` writes from node_modules — auto-registration skips
    // it entirely. registerPluginInstance is the one registration path that
    // isn't gated behind that list, so it's the actual way to plug this in.
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TimerActivityPlugin())
    }
}
