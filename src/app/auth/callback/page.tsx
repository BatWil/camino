import type { Metadata } from "next";
import { AuthCallback } from "@/features/auth/components/auth-callback";

export const metadata: Metadata = { title: "Entrando", robots: { index: false } };

export default function Page() {
  return <AuthCallback />;
}
