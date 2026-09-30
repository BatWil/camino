"use client";

import { useCurrentChurch } from "../hooks/use-access";

/**
 * Shown on Home while the user is not connected to a church.
 * Joining with a code/QR is implemented in M1 (join_church_by_code RPC already exists).
 */
export function ChurchInviteCard() {
  const { church, isPending, isError } = useCurrentChurch();
  if (isPending || isError || church) return null;
  return (
    <section className="flex flex-col gap-2 rounded-[26px] bg-white p-5">
      <span className="eyebrow text-violet">Mi iglesia</span>
      <h2 className="m-0 text-[20px] leading-[1.15] font-bold">Conecta con tu iglesia</h2>
      <p className="m-0 text-sm leading-[1.45] text-ink/60">
        Muy pronto podrás unirte con el código o el QR de tu iglesia. Mientras tanto, tu camino ya es tuyo.
      </p>
    </section>
  );
}
