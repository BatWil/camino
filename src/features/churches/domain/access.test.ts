import { describe, expect, it } from "vitest";
import {
  canAccessAdminPanel,
  canAccessLeaderPanel,
  effectiveRoles,
  hasAnyRole,
  resolveCurrentChurch,
  type UserAccess,
} from "./access";

const CHURCH_A = "a";
const CHURCH_B = "b";

const youth: UserAccess = {
  memberships: [{ churchId: CHURCH_A, churchName: "Vida Nueva", city: null, status: "active" }],
  roles: [],
};

describe("roles", () => {
  it("every account is implicitly USER", () => {
    expect(effectiveRoles({ memberships: [], roles: [] })).toEqual(["USER"]);
  });

  it("supports several roles at once (a youth who becomes mentor)", () => {
    const access: UserAccess = {
      ...youth,
      roles: [
        { role: "MENTOR", churchId: CHURCH_A },
        { role: "LEADER", churchId: CHURCH_A },
      ],
    };
    expect(effectiveRoles(access, CHURCH_A).sort()).toEqual(["LEADER", "MENTOR", "USER"]);
  });

  it("scopes church roles to their church", () => {
    const access: UserAccess = { ...youth, roles: [{ role: "LEADER", churchId: CHURCH_A }] };
    expect(hasAnyRole(access, ["LEADER"], CHURCH_A)).toBe(true);
    expect(hasAnyRole(access, ["LEADER"], CHURCH_B)).toBe(false);
  });

  it("PLATFORM_ADMIN applies to every church", () => {
    const access: UserAccess = { memberships: [], roles: [{ role: "PLATFORM_ADMIN", churchId: null }] };
    expect(hasAnyRole(access, ["PLATFORM_ADMIN"], CHURCH_B)).toBe(true);
  });
});

describe("panel access", () => {
  it("a regular youth cannot open leader or admin panels", () => {
    expect(canAccessLeaderPanel(youth)).toBe(false);
    expect(canAccessAdminPanel(youth)).toBe(false);
  });

  it("a mentor alone does not get the leader panel", () => {
    expect(canAccessLeaderPanel({ ...youth, roles: [{ role: "MENTOR", churchId: CHURCH_A }] })).toBe(false);
  });

  it("leaders, pastors and church admins get the leader panel", () => {
    for (const role of ["LEADER", "PASTOR", "CHURCH_ADMIN"] as const) {
      expect(canAccessLeaderPanel({ ...youth, roles: [{ role, churchId: CHURCH_A }] })).toBe(true);
    }
  });

  it("only church/platform admins get the admin panel", () => {
    expect(canAccessAdminPanel({ ...youth, roles: [{ role: "PASTOR", churchId: CHURCH_A }] })).toBe(false);
    expect(canAccessAdminPanel({ ...youth, roles: [{ role: "CHURCH_ADMIN", churchId: CHURCH_A }] })).toBe(true);
  });
});

describe("resolveCurrentChurch", () => {
  const access: UserAccess = {
    memberships: [
      { churchId: CHURCH_A, churchName: "A", city: null, status: "inactive" },
      { churchId: CHURCH_B, churchName: "B", city: null, status: "active" },
    ],
    roles: [],
  };

  it("ignores inactive memberships even if previously selected", () => {
    expect(resolveCurrentChurch(access, CHURCH_A)?.churchId).toBe(CHURCH_B);
  });

  it("returns null when the user has no church yet", () => {
    expect(resolveCurrentChurch({ memberships: [], roles: [] }, null)).toBeNull();
  });
});
