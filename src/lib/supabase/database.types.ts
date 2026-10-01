/**
 * Database types for the Supabase client.
 *
 * Mirrors supabase/migrations. Regenerate from a running database with
 * `npm run db:types` (Supabase CLI) whenever a migration changes the schema.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type AppRole = "USER" | "MENTOR" | "LEADER" | "PASTOR" | "CHURCH_ADMIN" | "PLATFORM_ADMIN";
export type MembershipStatus = "pending" | "active" | "inactive";
export type GroupMemberRole = "member" | "leader";
export type FaithStatus = "knowing_god" | "starting" | "growing" | "returning" | "serving" | "helping_others";
export type GrowthArea =
  "bible" | "prayer" | "consistency" | "identity" | "purpose" | "relationships" | "service" | "evangelism";
export type Expectation =
  | "closer_to_god"
  | "start_again"
  | "understand_bible"
  | "learn_to_pray"
  | "going_through_something"
  | "discover_purpose"
  | "serve"
  | "share_faith";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          birth_date: string | null;
          locale: string;
          onboarding_completed_at: string | null;
          faith_status: FaithStatus | null;
          growth_areas: GrowthArea[];
          expectations: Expectation[];
          current_stage_id: string | null;
        } & Timestamps;
        Insert: never;
        /** Column privileges: onboarding_completed_at and current_stage_id are server-only. */
        Update: {
          display_name?: string | null;
          avatar_path?: string | null;
          birth_date?: string | null;
          locale?: string;
          faith_status?: FaithStatus | null;
          growth_areas?: GrowthArea[];
          expectations?: Expectation[];
        };
        Relationships: [];
      };
      churches: {
        Row: {
          id: string;
          name: string;
          slug: string;
          join_code: string;
          city: string | null;
          country_code: string | null;
          logo_path: string | null;
          settings: Json;
          is_active: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          join_code: string;
          city?: string | null;
          country_code?: string | null;
          logo_path?: string | null;
          settings?: Json;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["churches"]["Insert"]>;
        Relationships: [];
      };
      church_members: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          status: MembershipStatus;
          joined_at: string;
        } & Timestamps;
        Insert: { church_id: string; user_id: string; status?: MembershipStatus };
        Update: { status?: MembershipStatus };
        Relationships: [
          {
            foreignKeyName: "church_members_church_id_fkey";
            columns: ["church_id"];
            isOneToOne: false;
            referencedRelation: "churches";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          church_id: string | null;
          granted_by: string | null;
          created_at: string;
        };
        Insert: { user_id: string; role: AppRole; church_id?: string | null; granted_by?: string | null };
        Update: never;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          description: string | null;
          meeting_schedule: string | null;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          church_id: string;
          name: string;
          description?: string | null;
          meeting_schedule?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: { id: string; group_id: string; user_id: string; role: GroupMemberRole; joined_at: string };
        Insert: { group_id: string; user_id: string; role?: GroupMemberRole };
        Update: { role?: GroupMemberRole };
        Relationships: [];
      };
      journey_stages: {
        Row: { id: string; key: string; position: number; name: string; description: string | null } & Timestamps;
        Insert: { key: string; position: number; name: string; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["journey_stages"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          church_id: string | null;
          action: string;
          target_table: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_church_by_code: {
        Args: { p_code: string };
        Returns: { church_id: string; church_name: string; city: string | null }[];
      };
      preview_church_by_code: {
        Args: { p_code: string };
        Returns: { church_name: string; city: string | null }[];
      };
      complete_onboarding: {
        Args: {
          p_display_name: string;
          p_birth_date: string;
          p_faith_status: FaithStatus;
          p_growth_areas: GrowthArea[];
          p_expectations: Expectation[];
        };
        Returns: { stage_key: string; stage_name: string; stage_description: string | null }[];
      };
      min_account_age: { Args: Record<string, never>; Returns: number };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      is_church_member: { Args: { p_church_id: string }; Returns: boolean };
      has_church_role: { Args: { p_church_id: string; p_roles: AppRole[] }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      membership_status: MembershipStatus;
      group_member_role: GroupMemberRole;
      faith_status: FaithStatus;
      growth_area: GrowthArea;
      expectation: Expectation;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
