import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  preview: vi.fn(async (code: string) =>
    code === "VIDA26" ? { name: "Iglesia Vida Nueva", city: "Monterrey" } : null,
  ),
  join: vi.fn(async () => ({ churchId: "c1", name: "Iglesia Vida Nueva", city: "Monterrey" })),
}));
vi.mock("../data/church.repository", () => ({ churchRepository: repo }));

import { ChurchJoinPanel } from "./church-join-panel";

function setup(props: Partial<Parameters<typeof ChurchJoinPanel>[0]> = {}) {
  const onJoined = vi.fn();
  const onSkip = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChurchJoinPanel onJoined={onJoined} onSkip={onSkip} {...props} />
    </QueryClientProvider>,
  );
  return { onJoined, onSkip, user: userEvent.setup() };
}

describe("ChurchJoinPanel (screen 4b)", () => {
  it("previews the church for a complete code and joins it", async () => {
    const { user, onJoined } = setup();
    const join = screen.getByRole("button", { name: "Unirme" });
    expect(join).toBeDisabled();

    await user.type(screen.getByLabelText("Código de tu iglesia"), "vida-26");
    expect(await screen.findByText("Iglesia Vida Nueva")).toBeInTheDocument();
    expect(screen.getByText("Ministerio de Jóvenes · Monterrey")).toBeInTheDocument();

    await user.click(join);
    await waitFor(() => expect(onJoined).toHaveBeenCalledWith(expect.objectContaining({ churchId: "c1" })));
    expect(repo.join).toHaveBeenCalledWith("VIDA26");
  });

  it("explains an unknown code without enabling join", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText("Código de tu iglesia"), "NOPE99");
    expect(await screen.findByText(/No encontramos una iglesia con ese código/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unirme" })).toBeDisabled();
  });

  it("lets people continue without a church", async () => {
    const { user, onSkip } = setup();
    await user.click(screen.getByRole("button", { name: "Aún no tengo iglesia · continuar" }));
    expect(onSkip).toHaveBeenCalled();
  });

  it("prefills a code that came from a QR link", async () => {
    setup({ initialCode: "vida26" });
    expect(await screen.findByText("Iglesia Vida Nueva")).toBeInTheDocument();
  });
});
