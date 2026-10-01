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
export type GiftArea = "teaching" | "service" | "creativity" | "music" | "tech" | "care" | "evangelism" | "prayer";
export type QuestionCategory = "faith" | "bible" | "relationships" | "doubts" | "other";
export type MentorshipStatus = "active" | "ended";
export type MessageKind = "text" | "meeting" | "checkin";
export type MeetingStatus = "proposed" | "confirmed" | "declined";
export type RegistrationStatus = "registered" | "cancelled" | "attended";
export type ServiceRequestStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type RequestStatus = "open" | "scheduled" | "closed";
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
      series: {
        Row: {
          id: string;
          church_id: string;
          title: string;
          total_topics: number;
          current_topic: number;
          current_title: string | null;
          plan_id: string | null;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          church_id: string;
          title: string;
          total_topics?: number;
          current_topic?: number;
          current_title?: string | null;
          plan_id?: string | null;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          total_topics?: number;
          current_topic?: number;
          current_title?: string | null;
          plan_id?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      ministries: {
        Row: {
          id: string;
          church_id: string;
          name: string;
          area: GiftArea;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: { church_id: string; name: string; area?: GiftArea; description?: string | null };
        Update: { name?: string; area?: GiftArea; description?: string | null; is_active?: boolean };
        Relationships: [];
      };
      ministry_members: {
        Row: { ministry_id: string; user_id: string; joined_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      service_opportunities: {
        Row: {
          id: string;
          church_id: string;
          ministry_id: string | null;
          title: string;
          schedule_text: string | null;
          area: GiftArea;
          spots: number | null;
          is_open: boolean;
          created_at: string;
        };
        Insert: {
          church_id: string;
          ministry_id?: string | null;
          title: string;
          schedule_text?: string | null;
          area?: GiftArea;
          spots?: number | null;
        };
        Update: {
          title?: string;
          schedule_text?: string | null;
          area?: GiftArea;
          spots?: number | null;
          is_open?: boolean;
        };
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          opportunity_id: string;
          user_id: string;
          status: ServiceRequestStatus;
          message: string | null;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: { opportunity_id: string; message?: string | null };
        Update: never;
        Relationships: [];
      };
      gift_assessments: {
        Row: { user_id: string; answers: Json; scores: Json; completed_at: string };
        Insert: { answers: Json; scores: Json; completed_at?: string };
        Update: { answers?: Json; scores?: Json; completed_at?: string };
        Relationships: [];
      };
      mentorships: {
        Row: {
          id: string;
          church_id: string;
          mentor_id: string;
          mentee_id: string;
          status: MentorshipStatus;
          assigned_by: string | null;
          started_at: string;
          ended_at: string | null;
          end_reason: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      mentorship_messages: {
        Row: {
          id: string;
          mentorship_id: string;
          sender_id: string;
          kind: MessageKind;
          body: string | null;
          meeting_at: string | null;
          meeting_place: string | null;
          meeting_status: MeetingStatus | null;
          check_in_id: string | null;
          created_at: string;
        };
        Insert: {
          mentorship_id: string;
          kind?: "text" | "meeting";
          body?: string | null;
          meeting_at?: string | null;
          meeting_place?: string | null;
          meeting_status?: "proposed" | null;
        };
        Update: never;
        Relationships: [];
      };
      safety_reports: {
        Row: {
          id: string;
          church_id: string;
          reporter_id: string;
          mentorship_id: string | null;
          message_id: string | null;
          reason: string;
          status: string;
          created_at: string;
        };
        Insert: { church_id: string; mentorship_id?: string | null; message_id?: string | null; reason: string };
        Update: never;
        Relationships: [];
      };
      conversation_requests: {
        Row: {
          id: string;
          church_id: string;
          user_id: string;
          with_role: "mentor" | "pastor" | "leader";
          topic: string | null;
          status: RequestStatus;
          created_at: string;
        };
        Insert: { church_id: string; with_role: "mentor" | "pastor" | "leader"; topic?: string | null };
        Update: { status?: RequestStatus };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          church_id: string;
          author_id: string;
          category: QuestionCategory;
          body: string;
          verse_ref: string | null;
          is_anonymous: boolean;
          status: "new" | "answered" | "archived";
          created_at: string;
        };
        Insert: {
          church_id: string;
          category?: QuestionCategory;
          body: string;
          verse_ref?: string | null;
          is_anonymous?: boolean;
        };
        Update: never;
        Relationships: [];
      };
      question_answers: {
        Row: {
          id: string;
          question_id: string;
          answered_by: string | null;
          body: string;
          publish_faq: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          church_id: string;
          group_id: string | null;
          ministry_id: string | null;
          title: string;
          description: string | null;
          cover_path: string | null;
          starts_at: string;
          ends_at: string | null;
          location_name: string | null;
          cost_text: string | null;
          capacity: number | null;
          registration_open: boolean;
          is_published: boolean;
          created_by: string | null;
        } & Timestamps;
        Insert: {
          church_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          location_name?: string | null;
          cost_text?: string | null;
          capacity?: number | null;
          registration_open?: boolean;
          is_published?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          location_name?: string | null;
          cost_text?: string | null;
          capacity?: number | null;
          registration_open?: boolean;
          is_published?: boolean;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: RegistrationStatus;
          ticket_code: string;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      prayer_intercessions: {
        Row: { prayer_id: string; user_id: string; day: string };
        Insert: { prayer_id: string };
        Update: never;
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
      is_church_leader: { Args: { p_church_id: string }; Returns: boolean };
      assign_mentor: { Args: { p_church_id: string; p_mentor: string; p_mentee: string }; Returns: string };
      end_mentorship: { Args: { p_mentorship_id: string; p_reason?: string | null }; Returns: undefined };
      my_mentor: {
        Args: Record<string, never>;
        Returns: { mentorship_id: string; mentor_id: string; mentor_name: string | null; church_id: string }[];
      };
      my_mentees: {
        Args: Record<string, never>;
        Returns: {
          mentorship_id: string;
          mentee_id: string;
          first_name: string;
          stage_key: string | null;
          stage_name: string | null;
          current_plan: string | null;
          active_days_7: number;
          last_active: string | null;
          shared_checkins: number;
        }[];
      };
      shared_checkins: {
        Args: { p_mentorship_id: string };
        Returns: { id: string; week_start: string; mood: Mood }[];
      };
      respond_meeting: { Args: { p_message_id: string; p_accept: boolean }; Returns: undefined };
      share_checkin_with_mentor: { Args: { p_check_in_id: string }; Returns: undefined };
      leader_questions: {
        Args: { p_church_id: string };
        Returns: {
          id: string;
          category: QuestionCategory;
          body: string;
          verse_ref: string | null;
          is_anonymous: boolean;
          author_name: string | null;
          status: string;
          created_at: string;
          answer: string | null;
          publish_faq: boolean | null;
        }[];
      };
      answer_question: {
        Args: { p_question_id: string; p_body: string; p_publish_faq?: boolean };
        Returns: undefined;
      };
      church_faq: {
        Args: { p_church_id: string };
        Returns: { id: string; category: QuestionCategory; question: string; answer: string; answered_at: string }[];
      };
      register_for_event: { Args: { p_event_id: string; p_register?: boolean }; Returns: string };
      event_attendance: { Args: { p_event_id: string }; Returns: number };
      decide_service_request: { Args: { p_request_id: string; p_accept: boolean }; Returns: undefined };
      leader_service_requests: {
        Args: { p_church_id: string };
        Returns: {
          id: string;
          opportunity: string;
          person: string | null;
          status: ServiceRequestStatus;
          message: string | null;
          created_at: string;
        }[];
      };
      group_roster: {
        Args: { p_group_id: string };
        Returns: { user_id: string; first_name: string; is_leader: boolean }[];
      };
      shared_prayers: {
        Args: { p_church_id: string };
        Returns: {
          id: string;
          title: string;
          owner_name: string;
          group_name: string | null;
          prayed_today: boolean;
          created_at: string;
        }[];
      };
      prayer_intercession_count: { Args: { p_prayer_id: string }; Returns: number };
      leader_overview: { Args: { p_church_id: string }; Returns: Json };
      leader_youth: {
        Args: { p_church_id: string };
        Returns: {
          user_id: string;
          name: string | null;
          stage_key: string | null;
          stage_name: string | null;
          current_plan: string | null;
          last_active: string | null;
          group_name: string | null;
          mentor_name: string | null;
          is_mentor: boolean;
        }[];
      };
      leader_conversation_requests: {
        Args: { p_church_id: string };
        Returns: {
          id: string;
          user_id: string;
          person: string | null;
          with_role: "mentor" | "pastor" | "leader";
          topic: string | null;
          status: RequestStatus;
          created_at: string;
          has_mentor: boolean;
        }[];
      };
      invite_plan_companion: { Args: { p_user_plan_id: string; p_companion: string }; Returns: undefined };
      respond_plan_invite: { Args: { p_invite_id: string; p_accept: boolean }; Returns: string | null };
      my_plan_invites: {
        Args: Record<string, never>;
        Returns: { id: string; plan_id: string; plan_title: string; from_name: string; created_at: string }[];
      };
      plan_companions_of: {
        Args: { p_user_plan_id: string };
        Returns: { companion_id: string; first_name: string; status: string }[];
      };
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
      gift_area: GiftArea;
      question_category: QuestionCategory;
      mentorship_status: MentorshipStatus;
      message_kind: MessageKind;
      meeting_status: MeetingStatus;
      registration_status: RegistrationStatus;
      service_request_status: ServiceRequestStatus;
      request_status: RequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
