import UIKit
import UniformTypeIdentifiers

// Minimal share-sheet entry point for "우리집 레시피": grabs the shared URL
// (or a URL embedded in shared text), puts it on the general pasteboard, and
// hands off to the main app via its existing custom scheme (already used for
// the OAuth callback — see NativeAuthBridge.tsx). The main app's new-recipe
// screen already offers to use whatever link sits on the clipboard (see
// useClipboardLinkSuggestion.ts), so no App Group / shared container is
// needed just to pass one string across process boundaries.
class ShareViewController: UIViewController {

    private let hostAppURLScheme = "com.hyeji.ourmenu"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        let spinner = UIActivityIndicatorView(style: .large)
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()
        view.addSubview(spinner)
        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])

        extractSharedURL { [weak self] url in
            DispatchQueue.main.async {
                guard let self else { return }
                guard let url else {
                    self.finish()
                    return
                }
                UIPasteboard.general.string = url
                self.openHostApp()
            }
        }
    }

    private func extractSharedURL(completion: @escaping (String?) -> Void) {
        guard
            let item = extensionContext?.inputItems.first as? NSExtensionItem,
            let attachments = item.attachments,
            !attachments.isEmpty
        else {
            completion(nil)
            return
        }

        let urlType = UTType.url.identifier
        let textType = UTType.plainText.identifier

        if let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(urlType) }) {
            provider.loadItem(forTypeIdentifier: urlType) { item, _ in
                completion((item as? URL)?.absoluteString)
            }
            return
        }

        if let provider = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(textType) }) {
            provider.loadItem(forTypeIdentifier: textType) { item, _ in
                guard
                    let text = item as? String,
                    let range = text.range(of: #"https?://\S+"#, options: .regularExpression)
                else {
                    completion(nil)
                    return
                }
                completion(String(text[range]))
            }
            return
        }

        completion(nil)
    }

    private func openHostApp() {
        guard let url = URL(string: "\(hostAppURLScheme)://share-recipe") else {
            finish()
            return
        }
        // NSExtensionContext.open is the sanctioned way for an extension to
        // hand off to another app — there's no UIApplication instance inside
        // an extension process, so UIApplication.shared.open isn't available
        // here the way it is in the main app.
        extensionContext?.open(url) { [weak self] _ in
            self?.finish()
        }
    }

    private func finish() {
        extensionContext?.completeRequest(returningItems: nil)
    }
}
