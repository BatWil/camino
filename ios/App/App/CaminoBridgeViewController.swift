import UIKit
import Capacitor
import AuthenticationServices
import CryptoKit

/// Root view controller (created in SceneDelegate). Registers Camino's local native plugins.
class CaminoBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CaminoAppleSignInPlugin())
    }
}

/// Native Sign in with Apple. JS: src/lib/native/apple-sign-in.ts → Supabase `signInWithIdToken`.
/// Only the SHA-256 of the nonce is sent to Apple; the raw nonce stays in JS for Supabase to verify.
@objc(CaminoAppleSignInPlugin)
public class CaminoAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "CaminoAppleSignInPlugin"
    public let jsName = "CaminoAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        guard let nonce = call.getString("nonce"), nonce.count >= 16 else {
            call.reject("A nonce is required", "invalid_nonce")
            return
        }
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)
        pendingCall = call
        DispatchQueue.main.async {
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.webView?.window ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController,
                                        didCompleteWithAuthorization authorization: ASAuthorization) {
        defer { pendingCall = nil }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let token = String(data: tokenData, encoding: .utf8) else {
            pendingCall?.reject("Apple did not return an identity token", "no_token")
            return
        }
        pendingCall?.resolve([
            "identityToken": token,
            "givenName": credential.fullName?.givenName ?? "",
            "familyName": credential.fullName?.familyName ?? ""
        ])
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let canceled = (error as? ASAuthorizationError)?.code == .canceled
        pendingCall?.reject(error.localizedDescription, canceled ? "canceled" : "failed")
        pendingCall = nil
    }

    private func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}
