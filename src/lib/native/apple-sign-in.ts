import { registerPlugin } from "@capacitor/core";
import { isIOS, isPluginAvailable } from "@/lib/platform";

/**
 * Native Sign in with Apple (iOS). Implemented as a small local plugin in
 * ios/App/App/CaminoBridgeViewController.swift (AuthenticationServices), so no
 * third-party native dependency is needed. The raw nonce stays in JS; Apple
 * receives only its SHA-256, and Supabase verifies both.
 */
interface AppleSignInPlugin {
  authorize(options: { nonce: string }): Promise<{ identityToken: string; givenName?: string; familyName?: string }>;
}

const AppleSignIn = registerPlugin<AppleSignInPlugin>("CaminoAppleSignIn");

export function nativeAppleSignInAvailable(): boolean {
  return isIOS() && isPluginAvailable("CaminoAppleSignIn");
}

export function randomNonce(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function authorizeWithApple(nonce: string) {
  return AppleSignIn.authorize({ nonce });
}
