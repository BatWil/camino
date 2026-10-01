import type { Metadata } from "next";
import { AdminMinistries } from "@/features/admin/components/admin-ministries";

export const metadata: Metadata = { title: "Ministerios · Administración" };

export default function Page() {
  return <AdminMinistries />;
}
