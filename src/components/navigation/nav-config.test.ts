import { describe, expect, it } from "vitest";
import { isTabActive } from "./nav-config";

describe("bottom nav active tab", () => {
  it("follows the design: Biblia under Camino, Diario under Perfil, Oración under Inicio", () => {
    expect(isTabActive("/biblia/", "/camino")).toBe(true);
    expect(isTabActive("/planes/", "/camino")).toBe(true);
    expect(isTabActive("/diario", "/perfil")).toBe(true);
    expect(isTabActive("/oracion/", "/inicio")).toBe(true);
    expect(isTabActive("/comunidad", "/inicio")).toBe(false);
    expect(isTabActive("/caminos", "/camino")).toBe(false);
  });
});
