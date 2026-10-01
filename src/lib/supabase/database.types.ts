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
export type HighlightColorDb = "yellow" | "green" | "blue" | "violet";
export type JournalKind = "free" | "gratitude" | "struggle" | "reflection" | "verse" | "devotional";
export type PrayerStatus = "PRAYING" | "ANSWERED" | "ARCHIVED";
export type PrayerPrivacy = "PRIVATE" | "MENTOR" | "GROUP" | "CHURCH";
export type PrayerCategory = "family" | "studies" | "health" | "friends" | "church" | "work" | "faith" | "other";
export type Mood = "joy" | "peace" | "tired" | "anxious" | "lonely" | "doubts";
export type MomentKind =
  | "journey_started"
  | "faith_decision"
  | "baptism"
  | "first_service"
  | "first_preaching"
  | "prayer_answered"
  | "plan_completed"
  | "stage_reached"
  | "calling"
  | "mission"
  | "custom";
export type ContentSource = "PLATFORM" | "CHURCH";
export type PlanCategory = "daily_life" | "foundations" | "leadership";
export type ModuleKind = "devotional" | "plan" | "experience";
export type ProgressStatus = "in_progress" | "completed";
export type UserPlanStatus = "active" | "completed" | "left";
export type DevotionalStep = "read" | "reflect" | "think" | "write" | "pray" | "act";
export type ChallengeKind = "daily" | "weekly";
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
          timezone: string;
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
          timezone?: string;
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
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      journey_stages: {
        Row: { id: string; key: string; position: number; name: string; description: string | null } & Timestamps;
        Insert: { key: string; position: number; name: string; description?: string | null };
        Update: Partial<Database["public"]["Tables"]["journey_stages"]["Insert"]>;
        Relationships: [];
      };
      devotionals: {
        Row: {
          id: string;
          source: ContentSource;
          church_id: string | null;
          title: string;
          minutes: number;
          scripture_ref: string;
          scripture_text: string;
          scripture_version: string | null;
          reflection: string;
          question: string;
          prayer: string;
          action: string;
          audio_path: string | null;
          is_published: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          source: ContentSource;
          church_id: string | null;
          title: string;
          summary: string;
          category: PlanCategory;
          color: string;
          minutes_per_day: number;
          recommended_stage_id: string | null;
          growth_areas: GrowthArea[];
          is_published: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      plan_days: {
        Row: { id: string; plan_id: string; day_number: number; devotional_id: string };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "plan_days_devotional_id_fkey";
            columns: ["devotional_id"];
            isOneToOne: false;
            referencedRelation: "devotionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_days_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      journey_modules: {
        Row: {
          id: string;
          stage_id: string;
          position: number;
          title: string;
          kind: ModuleKind;
          devotional_id: string | null;
          plan_id: string | null;
          is_optional: boolean;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          source: ContentSource;
          church_id: string | null;
          title: string;
          description: string;
          kind: ChallengeKind;
          days_target: number;
          stage_id: string | null;
          starts_on: string | null;
          ends_on: string | null;
          is_published: boolean;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      devotional_progress: {
        Row: {
          user_id: string;
          devotional_id: string;
          status: ProgressStatus;
          completed_steps: DevotionalStep[];
          answer: string | null;
          started_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "devotional_progress_devotional_id_fkey";
            columns: ["devotional_id"];
            isOneToOne: false;
            referencedRelation: "devotionals";
            referencedColumns: ["id"];
          },
        ];
      };
      user_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: UserPlanStatus;
          started_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_day_completions: {
        Row: { user_plan_id: string; day_number: number; completed_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      user_module_progress: {
        Row: {
          user_id: string;
          module_id: string;
          status: ProgressStatus;
          started_at: string;
          completed_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      challenge_checkins: {
        Row: { user_id: string; challenge_id: string; day: string; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      activity_days: {
        Row: { user_id: string; day: string; sources: string[] };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      bible_highlights: {
        Row: {
          user_id: string;
          book: string;
          chapter: number;
          verse: number;
          color: HighlightColorDb;
          created_at: string;
        };
        Insert: { book: string; chapter: number; verse: number; color: HighlightColorDb; user_id?: string };
        Update: { color?: HighlightColorDb };
        Relationships: [];
      };
      bible_bookmarks: {
        Row: { user_id: string; book: string; chapter: number; verse: number; created_at: string };
        Insert: { book: string; chapter: number; verse: number; user_id?: string };
        Update: never;
        Relationships: [];
      };
      bible_notes: {
        Row: { id: string; user_id: string; book: string; chapter: number; verse: number; body: string } & Timestamps;
        Insert: { book: string; chapter: number; verse: number; body: string; user_id?: string; id?: string };
        Update: { body?: string };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          kind: JournalKind;
          body: string;
          verse_ref: string | null;
          verse_text: string | null;
          devotional_id: string | null;
          entry_date: string;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id?: string;
          kind?: JournalKind;
          body: string;
          verse_ref?: string | null;
          verse_text?: string | null;
          devotional_id?: string | null;
          entry_date?: string;
        };
        Update: {
          kind?: JournalKind;
          body?: string;
          verse_ref?: string | null;
          verse_text?: string | null;
          entry_date?: string;
        };
        Relationships: [];
      };
      prayers: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: PrayerCategory;
          status: PrayerStatus;
          privacy: PrayerPrivacy;
          group_id: string | null;
          church_id: string | null;
          verse_ref: string | null;
          answered_at: string | null;
          answer_note: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: PrayerCategory;
          status?: PrayerStatus;
          privacy?: PrayerPrivacy;
          group_id?: string | null;
          church_id?: string | null;
          verse_ref?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: PrayerCategory;
          status?: PrayerStatus;
          privacy?: PrayerPrivacy;
          group_id?: string | null;
          church_id?: string | null;
          verse_ref?: string | null;
          answer_note?: string | null;
        };
        Relationships: [];
      };
      prayer_sessions: {
        Row: { id: string; user_id: string; seconds: number; created_at: string };
        Insert: { seconds: number };
        Update: never;
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          mood: Mood;
          note: string | null;
          shared_with_mentor: boolean;
        } & Timestamps;
        Insert: { week_start: string; mood: Mood; note?: string | null; shared_with_mentor?: boolean };
        Update: { mood?: Mood; note?: string | null; shared_with_mentor?: boolean };
        Relationships: [];
      };
      moments: {
        Row: {
          id: string;
          user_id: string;
          kind: MomentKind;
          title: string;
          note: string | null;
          happened_on: string;
          is_auto: boolean;
          ref_id: string | null;
          created_at: string;
        };
        Insert: { kind: MomentKind; title: string; note?: string | null; happened_on?: string };
        Update: { title?: string; note?: string | null; happened_on?: string };
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
      save_devotional_progress: {
        Args: { p_devotional_id: string; p_steps: DevotionalStep[]; p_answer?: string | null };
        Returns: undefined;
      };
      start_plan: { Args: { p_plan_id: string }; Returns: string };
      leave_plan: { Args: { p_user_plan_id: string }; Returns: undefined };
      complete_devotional: {
        Args: { p_devotional_id: string; p_answer?: string | null; p_user_plan_id?: string | null };
        Returns: Json;
      };
      my_story_stats: { Args: Record<string, never>; Returns: Json };
      challenge_checkin: { Args: { p_challenge_id: string; p_done?: boolean }; Returns: number };
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
      content_source: ContentSource;
      plan_category: PlanCategory;
      module_kind: ModuleKind;
      progress_status: ProgressStatus;
      user_plan_status: UserPlanStatus;
      devotional_step: DevotionalStep;
      challenge_kind: ChallengeKind;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
