import type { Metadata } from "next";
import { SignedInPage } from "@/components/layout/signed-in-page";
import { GiftsTest } from "@/features/service/components/gifts-test";

export const metadata: Metadata = { title: "Mis dones" };

export default function Page() {
  return (
    <SignedInPage>
      <GiftsTest />
    </SignedInPage>
  );
}
