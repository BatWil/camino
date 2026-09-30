import type { AppRole } from "@/lib/supabase/database.types";

export type { AppRole };

export interface ChurchMembership {
  churchId: string;
  churchName: string;
  city: string | null;
  status: "pending" | "active" | "inactive";
}

export interface RoleGrant {
  role: Exclude<AppRole, "USER">;
  churchId: string | null;
}

/** What the signed-in user can do. USER is implicit for every account. */
export interface UserAccess {
  memberships: ChurchMembership[];
  roles: RoleGrant[];
}

export const EMPTY_ACCESS: UserAccess = { memberships: [], roles: [] };

export const LEADER_PANEL_ROLES: AppRole[] = ["LEADER", "PASTOR", "CHURCH_ADMIN"];
export const ADMIN_PANEL_ROLES: AppRole[] = ["CHURCH_ADMIN", "PLATFORM_ADMIN"];

export function effectiveRoles(access: UserAccess, churchId?: string | null): AppRole[] {
  const roles = new Set<AppRole>(["USER"]);
  for (const grant of access.roles) {
    if (grant.role === "PLATFORM_ADMIN" || churchId === undefined || grant.churchId === churchId) {
      roles.add(grant.role);
    }
  }
  return [...roles];
}

export function hasAnyRole(access: UserAccess, roles: AppRole[], churchId?: string | null): boolean {
  const mine = effectiveRoles(access, churchId);
  return roles.some((r) => mine.includes(r));
}

export function activeMemberships(access: UserAccess): ChurchMembership[] {
  return access.memberships.filter((m) => m.status === "active");
}

/**
 * Church the UI should focus on: the stored selection if it is still an active
 * membership, otherwise the first active membership.
 */
export function resolveCurrentChurch(access: UserAccess, selectedId: string | null): ChurchMembership | null {
  const active = activeMemberships(access);
  return active.find((m) => m.churchId === selectedId) ?? active[0] ?? null;
}

export function canAccessLeaderPanel(access: UserAccess): boolean {
  return hasAnyRole(access, LEADER_PANEL_ROLES) || hasAnyRole(access, ["PLATFORM_ADMIN"]);
}

export function canAccessAdminPanel(access: UserAccess): boolean {
  return hasAnyRole(access, ADMIN_PANEL_ROLES);
}
