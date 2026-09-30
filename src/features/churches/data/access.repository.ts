import { requireSupabase } from "@/lib/supabase/client";
import { AppError } from "@/types/result";
import type { ChurchMembership, RoleGrant, UserAccess } from "../domain/access";

/**
 * Reads the caller's memberships and role grants. RLS restricts both queries to
 * rows the user is allowed to see; the explicit user_id filter keeps the result
 * scoped to "me" even for admins who can see more.
 */
export const accessRepository = {
  async getMine(userId: string): Promise<UserAccess> {
    const sb = requireSupabase();
    const [memberships, roles] = await Promise.all([
      sb.from("church_members").select("church_id, status, churches ( name, city )").eq("user_id", userId),
      sb.from("user_roles").select("role, church_id").eq("user_id", userId),
    ]);

    if (memberships.error) throw new AppError("unknown", "No pudimos cargar tu iglesia.", memberships.error);
    if (roles.error) throw new AppError("unknown", "No pudimos cargar tus permisos.", roles.error);

    return {
      memberships: memberships.data
        .filter((m) => m.churches)
        .map<ChurchMembership>((m) => ({
          churchId: m.church_id,
          churchName: m.churches!.name,
          city: m.churches!.city,
          status: m.status,
        })),
      roles: roles.data
        .filter((r) => r.role !== "USER")
        .map<RoleGrant>((r) => ({ role: r.role as RoleGrant["role"], churchId: r.church_id })),
    };
  },
};
