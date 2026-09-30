import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile/components/profile-screen";

export const metadata: Metadata = { title: "Perfil" };

export default function PerfilPage() {
  return <ProfileScreen />;
}
