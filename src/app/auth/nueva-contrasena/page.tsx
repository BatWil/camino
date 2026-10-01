import type { Metadata } from "next";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default function Page() {
  return <NewPasswordForm />;
}
