import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthStatus } from "./auth-provider";

const replace = vi.fn();
const auth = vi.hoisted(() => ({ status: "loading" as AuthStatus }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("../hooks/use-auth", () => ({ useAuth: () => ({ status: auth.status }) }));

import { AuthGuard } from "./auth-guard";

describe("AuthGuard", () => {
  beforeEach(() => replace.mockReset());

  it("never renders private content while the session is being restored", () => {
    auth.status = "loading";
    render(<AuthGuard>secreto</AuthGuard>);
    expect(screen.queryByText("secreto")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Cargando Camino" })).toBeInTheDocument();
  });

  it("redirects signed-out users to the welcome screen", () => {
    auth.status = "unauthenticated";
    render(<AuthGuard>secreto</AuthGuard>);
    expect(screen.queryByText("secreto")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/bienvenida");
  });

  it("explains missing configuration instead of showing a blank screen", () => {
    auth.status = "unconfigured";
    render(<AuthGuard>secreto</AuthGuard>);
    expect(screen.getByText("Falta conectar el servidor")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    auth.status = "authenticated";
    render(<AuthGuard>secreto</AuthGuard>);
    expect(screen.getByText("secreto")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
