import type { ReactNode } from "react";

/** Re-mounted on every navigation inside the tab app: each screen eases in. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
