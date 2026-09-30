import type { Metadata } from "next";
import { PanelGreeting } from "@/features/panel/components/panel-greeting";
import { StateView } from "@/components/feedback/state-view";

export const metadata: Metadata = { title: "Administración" };

export default function AdminHomePage() {
  return (
    <>
      <PanelGreeting />
      <StateView
        kind="empty"
        title="Administración"
        message="Gestión de iglesias, roles y ministerios. Las acciones sensibles quedan registradas en la auditoría."
      />
    </>
  );
}
