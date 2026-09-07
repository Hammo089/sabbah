// types/database.types.ts
// Regenerate with:
//   npx supabase gen types typescript --project-id <ref> --schema public > types/database.types.ts
//
// NOTE: every Row is declared as a standalone type FIRST. Referencing
// `Database['public']['Tables'][...]` from inside the `Database` type itself is
// circular — TypeScript cannot resolve it, Supabase's generics collapse to
// `never`, and every .from()/.select() call fails to typecheck.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LocalizedText = { ar?: string; en?: string; fr?: string };

export type AppRoleEnum = 'super_admin' | 'admin' | 'editor' | 'b2b_client' | 'viewer';
export type ContentStatusEnum = 'draft' | 'in_review' | 'published' | 'archived';
export type ProgramKindEnum = 'show' | 'documentary' | 'format' | 'special';
export type LicenseStatusEnum = 'available' | 'optioned' | 'licensed' | 'expired' | 'withdrawn';
export type DrmSystemEnum = 'widevine' | 'fairplay' | 'playready' | 'none';

// ---------------------------------------------------------------------------
// Row shapes
// ---------------------------------------------------------------------------

export type UsersProfilesRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRoleEnum;
  company_name: string | null;
  country_code: string | null;
  phone: string | null;
  locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SeriesRow = {
  id: string;
  slug: string;
  title: Json;
  subtitle: Json;
  kind: TitleKind;
  region: RegionCode;
  subtitle_langs: string[];
  is_script: boolean;
  is_coming_soon: boolean;
  is_new: boolean;
  is_hit: boolean;
  youtube_id: string | null;
  synopsis: Json;
  genres: string[];
  year: number | null;
  seasons_count: number;
  episodes_count: number;
  cast_members: Json;
  director: string | null;
  production_country: string | null;
  original_language: string;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  status: ContentStatusEnum;
  is_featured_slider: boolean;
  sort_order: number;
  seo: Json;
  seas_code: string | null;
  prog_code: string | null;
  remarks: string | null;
  audio_langs: string[];
  dubbing_langs: string[];
  subtitling_langs: string[];
  genres_ar: string[];
  watch_url: string | null;
  website_url: string | null;
  press_kit_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MoviesRow = {
  id: string;
  slug: string;
  title: Json;
  subtitle: Json;
  region: RegionCode;
  subtitle_langs: string[];
  is_coming_soon: boolean;
  is_new: boolean;
  is_hit: boolean;
  youtube_id: string | null;
  synopsis: Json;
  genres: string[];
  year: number | null;
  duration_minutes: number | null;
  cast_members: Json;
  director: string | null;
  original_language: string;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  status: ContentStatusEnum;
  is_featured_slider: boolean;
  sort_order: number;
  seo: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramsRow = {
  id: string;
  slug: string;
  kind: ProgramKindEnum;
  title: Json;
  synopsis: Json;
  genres: string[];
  year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_url: string | null;
  status: ContentStatusEnum;
  is_featured_slider: boolean;
  sort_order: number;
  seo: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EpisodesRow = {
  id: string;
  series_id: string;
  season_number: number;
  episode_number: number;
  title: Json;
  synopsis: Json;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  video_url: string | null;
  hls_manifest_url: string | null;
  subtitles: Json;
  air_date: string | null;
  status: ContentStatusEnum;
  created_at: string;
  updated_at: string;
};

export type DrmLicensesRow = {
  id: string;
  series_id: string | null;
  movie_id: string | null;
  licensee_id: string | null;
  licensee_name: string;
  signed_on: string | null;
  reminder_days: number;
  reminder_ack: boolean;
  currency: string;
  licensee_email: string | null;
  territory: string[] | null;
  rights: string[] | null;
  exclusivity: boolean;
  drm: DrmSystemEnum;
  license_key_id: string | null;
  license_server_url: string | null;
  contract_ref: string | null;
  fee_usd: number | null;
  status: LicenseStatusEnum;
  starts_on: string | null;
  ends_on: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsTickerRow = {
  id: string;
  message: Json;
  link_url: string | null;
  priority: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyLegacyRow = {
  id: string;
  title: Json;
  description: Json;
  video_url: string | null;
  poster_url: string | null;
  year: number | null;
  is_milestone: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};


export type SearchMatchKind = 'prefix' | 'fulltext' | 'fuzzy' | 'translit';

export type SearchResultRow = {
  entity_type: 'series' | 'movie' | 'program';
  entity_id: string;
  slug: string;
  title: string;
  synopsis: string;
  poster_url: string | null;
  year: number | null;
  genres: string[];
  rank: number;
  match_kind: SearchMatchKind;
};


export type TitleKind = 'series' | 'show' | 'movie' | 'animation';
export type RegionCode = 'levant' | 'egypt' | 'arabia' | 'maghreb' | 'other';
export type CreditKind = 'cast' | 'crew';

export type PeopleRow = {
  id: string;
  slug: string;
  name: Json;
  bio: Json;
  photo_url: string | null;
  birth_year: number | null;
  nationality: string | null;
  is_published: boolean;
  is_team: boolean;
  job_title: Json;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CreditsRow = {
  id: string;
  person_id: string;
  series_id: string | null;
  movie_id: string | null;
  kind: CreditKind;
  role: string | null;
  character: Json;
  sort_order: number;
  created_at: string;
};

export type BroadcastersRow = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  site_url: string | null;
  sort_order: number;
};

export type MediaAssetsRow = {
  id: string;
  series_id: string | null;
  movie_id: string | null;
  url: string;
  caption: Json;
  asset_type: 'poster' | 'still' | 'keyart' | 'logo';
  sort_order: number;
  created_at: string;
};

export type ServicesRow = {
  id: string;
  slug: string;
  title: Json;
  summary: Json;
  body: Json;
  icon: string | null;
  image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type VideoKind =
  | 'trailer'
  | 'teaser'
  | 'clip'
  | 'opening'
  | 'behind_scenes'
  | 'interview'
  | 'promo';

export type TitleVideosRow = {
  id: string;
  series_id: string | null;
  movie_id: string | null;
  kind: VideoKind;
  label: Json;
  youtube_id: string | null;
  url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export type SubmissionStatusEnum = 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'optioned';
export type SubmissionKindEnum = 'series' | 'film' | 'format' | 'novel' | 'idea' | 'other';

export type ScriptSubmissionRow = {
  id: string;
  ref: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  agent_or_company: string | null;
  portfolio_url: string | null;
  work_title: string;
  kind: SubmissionKindEnum;
  language: string;
  episodes_planned: number | null;
  logline: string;
  synopsis: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime: string | null;
  ai_summary: string | null;
  ai_themes: string[] | null;
  ai_genre: string | null;
  ai_comparables: string | null;
  ai_audience: string | null;
  ai_strength: string | null;
  ai_risk: string | null;
  ai_score: number | null;
  ai_model: string | null;
  ai_processed_at: string | null;
  ai_error: string | null;
  status: SubmissionStatusEnum;
  staff_notes: string | null;
  reviewed_by: string | null;
  consent_terms: boolean;
  source_ip_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type AssistantKnowledgeRow = {
  id: string;
  topic: string;
  question: Json;
  answer: Json;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type LibraryKindEnum = 'master' | 'mezzanine' | 'proxy' | 'audio' | 'subtitle' | 'document' | 'artwork' | 'other';
export type SocialPlatformEnum = 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'tiktok' | 'linkedin';
export type PostStatusEnum = 'draft' | 'scheduled' | 'published' | 'archived';
export type NotificationLevelEnum = 'info' | 'success' | 'warning' | 'danger';

export type TagRow = {
  id: string; slug: string; label: Json; color: string; sort_order: number; created_at: string;
};

export type LibraryItemRow = {
  id: string; series_id: string | null; episode_id: string | null; kind: LibraryKindEnum;
  label: string; format: string | null; resolution: string | null; duration_s: number | null;
  size_mb: number | null; location: string | null; barcode: string | null; file_url: string | null;
  notes: string | null; created_at: string; updated_at: string;
};

export type MasterSceneRow = {
  id: string; series_id: string | null; episode_id: string | null; scene_no: number | null;
  tc_in: string | null; tc_out: string | null; heading: string | null; description: string | null;
  location: string | null; characters: string[]; keywords: string[]; still_url: string | null;
  created_at: string; updated_at: string;
};

export type NewsPressRow = {
  id: string; slug: string; title: Json; excerpt: Json; body: Json; cover_url: string | null;
  outlet: string | null; external_url: string | null; published_on: string | null;
  is_published: boolean; series_id: string | null; sort_order: number;
  created_at: string; updated_at: string;
};

export type SocialAccountRow = {
  id: string; platform: SocialPlatformEnum; handle: string; profile_url: string | null;
  followers: number | null; is_primary: boolean; series_id: string | null;
  created_at: string; updated_at: string;
};

export type SocialPostRow = {
  id: string; account_id: string | null; platform: SocialPlatformEnum; series_id: string | null;
  caption: string | null; media_url: string | null; post_url: string | null; status: PostStatusEnum;
  scheduled_for: string | null; published_at: string | null;
  likes: number | null; comments: number | null; views: number | null;
  created_at: string; updated_at: string;
};

export type ExportRow = {
  id: string; kind: string; format: string; params: Json; file_url: string | null;
  row_count: number | null; requested_by: string | null; created_at: string;
};

export type TrackingEventRow = {
  id: string; entity: string; entity_id: string | null; action: string; summary: string | null;
  meta: Json; actor_id: string | null; actor_email: string | null; created_at: string;
};

export type NotificationRow = {
  id: string; level: NotificationLevelEnum; title: string; body: string | null; href: string | null;
  audience: AppRoleEnum | null; is_read: boolean; created_at: string;
};

export type B2BLeadRow = {
  id: string; full_name: string; company: string; position: string; phone: string;
  email: string | null; country: string | null; interest: string | null;
  downloads: number; last_seen: string; created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users_profiles: {
        Row: UsersProfilesRow;
        Insert: Partial<UsersProfilesRow> & { id: string; email: string };
        Update: Partial<UsersProfilesRow>;
        Relationships: [];
      };
      series: {
        Row: SeriesRow;
        Insert: Partial<SeriesRow> & { slug: string };
        Update: Partial<SeriesRow>;
        Relationships: [];
      };
      movies: {
        Row: MoviesRow;
        Insert: Partial<MoviesRow> & { slug: string };
        Update: Partial<MoviesRow>;
        Relationships: [];
      };
      programs: {
        Row: ProgramsRow;
        Insert: Partial<ProgramsRow> & { slug: string };
        Update: Partial<ProgramsRow>;
        Relationships: [];
      };
      episodes: {
        Row: EpisodesRow;
        Insert: Partial<EpisodesRow> & { series_id: string; episode_number: number };
        Update: Partial<EpisodesRow>;
        Relationships: [];
      };
      drm_licenses: {
        Row: DrmLicensesRow;
        Insert: Partial<DrmLicensesRow> & { licensee_name: string };
        Update: Partial<DrmLicensesRow>;
        Relationships: [];
      };
      news_ticker: {
        Row: NewsTickerRow;
        Insert: Partial<NewsTickerRow>;
        Update: Partial<NewsTickerRow>;
        Relationships: [];
      };
      people: {
        Row: PeopleRow;
        Insert: Partial<PeopleRow> & { slug: string };
        Update: Partial<PeopleRow>;
        Relationships: [];
      };
      credits: {
        Row: CreditsRow;
        Insert: Partial<CreditsRow> & { person_id: string };
        Update: Partial<CreditsRow>;
        Relationships: [];
      };
      broadcasters: {
        Row: BroadcastersRow;
        Insert: Partial<BroadcastersRow> & { slug: string; name: string };
        Update: Partial<BroadcastersRow>;
        Relationships: [];
      };
      title_broadcasters: {
        Row: { broadcaster_id: string; series_id: string | null; movie_id: string | null };
        Insert: { broadcaster_id: string; series_id?: string | null; movie_id?: string | null };
        Update: Partial<{ broadcaster_id: string; series_id: string | null; movie_id: string | null }>;
        Relationships: [];
      };
      media_assets: {
        Row: MediaAssetsRow;
        Insert: Partial<MediaAssetsRow> & { url: string };
        Update: Partial<MediaAssetsRow>;
        Relationships: [];
      };
      title_videos: {
        Row: TitleVideosRow;
        Insert: Partial<TitleVideosRow>;
        Update: Partial<TitleVideosRow>;
        Relationships: [];
      };
      services: {
        Row: ServicesRow;
        Insert: Partial<ServicesRow> & { slug: string };
        Update: Partial<ServicesRow>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: boolean;
          ticker_enabled: boolean;
          anniversary_enabled: boolean;
          anniversary_youtube: string;
          hero_backdrop_url: string | null;
          stat_years: string;
          stat_productions: string;
          stat_offices: string;
          stat_partners: string;
          theme_primary: string;
          theme_accent: string;
          theme_background: string;
          theme_foreground: string;
          theme_muted: string;
          theme_radius: string;
          header_style: 'transparent' | 'solid';
          hero_align: 'start' | 'center';
          hero_show_strip: boolean;
          show_stats: boolean;
          show_marquee: boolean;
          show_showcase: boolean;
          show_rails: boolean;
          show_partners: boolean;
          section_order: string[];
          cta_primary_href: string | null;
          ticker_speed: number;
          loader_enabled: boolean;
          loader_logo_url: string | null;
          loader_style: 'ring' | 'sweep' | 'pulse' | 'none';
          loader_speed: number;
          bg_video_enabled: boolean;
          bg_video_youtube: string;
          bg_video_opacity: number;
          bg_video_scope: 'home' | 'all';
          submissions_open: boolean;
          assistant_enabled: boolean;
          backdrop_enabled: boolean;
          backdrop_loop_url: string | null;
          backdrop_webm_url: string | null;
          backdrop_poster_url: string | null;
          backdrop_scope: 'home' | 'all';
          backdrop_brightness: number;
          backdrop_blur: number;
          backdrop_on_mobile: boolean;
          anniversary_url: string | null;
          anniversary_label: string;
          anniversary_cta: boolean;
          glass_enabled: boolean;
          glass_blur: number;
          glass_opacity: number;
          glass_border: number;
          hero_enabled: boolean;
          hero_eyebrow: Json;
          hero_headline: Json;
          hero_highlight: Json;
          hero_body: Json;
          logo_url: string | null;
          logo_dark_url: string | null;
          anniversary_art_url: string | null;
          backdrop_mobile_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Relationships: [];
      };
      user_invitations: {
        Row: {
          email: string;
          role: AppRoleEnum;
          invited_by: string | null;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: { email: string; role?: AppRoleEnum; invited_by?: string | null };
        Update: Partial<{ email: string; role: AppRoleEnum; accepted_at: string | null }>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: Partial<TagRow> & { slug: string };
        Update: Partial<TagRow>;
        Relationships: [];
      };
      title_tags: {
        Row: { tag_id: string; series_id: string };
        Insert: { tag_id: string; series_id: string };
        Update: Partial<{ tag_id: string; series_id: string }>;
        Relationships: [];
      };
      library_items: {
        Row: LibraryItemRow;
        Insert: Partial<LibraryItemRow> & { label: string };
        Update: Partial<LibraryItemRow>;
        Relationships: [];
      };
      master_scenes: {
        Row: MasterSceneRow;
        Insert: Partial<MasterSceneRow>;
        Update: Partial<MasterSceneRow>;
        Relationships: [];
      };
      news_press: {
        Row: NewsPressRow;
        Insert: Partial<NewsPressRow> & { slug: string };
        Update: Partial<NewsPressRow>;
        Relationships: [];
      };
      social_accounts: {
        Row: SocialAccountRow;
        Insert: Partial<SocialAccountRow> & { platform: SocialPlatformEnum; handle: string };
        Update: Partial<SocialAccountRow>;
        Relationships: [];
      };
      social_posts: {
        Row: SocialPostRow;
        Insert: Partial<SocialPostRow> & { platform: SocialPlatformEnum };
        Update: Partial<SocialPostRow>;
        Relationships: [];
      };
      exports: {
        Row: ExportRow;
        Insert: Partial<ExportRow> & { kind: string };
        Update: Partial<ExportRow>;
        Relationships: [];
      };
      tracking_events: {
        Row: TrackingEventRow;
        Insert: Partial<TrackingEventRow> & { entity: string; action: string };
        Update: Partial<TrackingEventRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & { title: string };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      b2b_leads: {
        Row: B2BLeadRow;
        Insert: Partial<B2BLeadRow> & {
          full_name: string; company: string; position: string; phone: string;
        };
        Update: Partial<B2BLeadRow>;
        Relationships: [];
      };
      script_submissions: {
        Row: ScriptSubmissionRow;
        Insert: Partial<ScriptSubmissionRow> & {
          full_name: string;
          email: string;
          work_title: string;
          logline: string;
          consent_terms: boolean;
        };
        Update: Partial<ScriptSubmissionRow>;
        Relationships: [];
      };
      assistant_knowledge: {
        Row: AssistantKnowledgeRow;
        Insert: Partial<AssistantKnowledgeRow> & { topic: string };
        Update: Partial<AssistantKnowledgeRow>;
        Relationships: [];
      };
      company_legacy: {
        Row: CompanyLegacyRow;
        Insert: Partial<CompanyLegacyRow>;
        Update: Partial<CompanyLegacyRow>;
        Relationships: [];
      };
    };
    Views: {
      expiring_licenses: {
        Row: {
          id: string;
          licensee_name: string;
          licensee_company: string | null;
          status: LicenseStatusEnum;
          starts_on: string | null;
          ends_on: string | null;
          reminder_days: number;
          reminder_ack: boolean;
          days_left: number;
          expired: boolean;
          series_slug: string | null;
          series_title: Json | null;
          movie_slug: string | null;
          movie_title: Json | null;
        };
        Relationships: [];
      };
      b2b_available_titles: {
        Row: Pick<
          SeriesRow,
          | 'id'
          | 'slug'
          | 'title'
          | 'synopsis'
          | 'genres'
          | 'year'
          | 'seasons_count'
          | 'episodes_count'
          | 'poster_url'
          | 'original_language'
        >;
        Relationships: [];
      };
    };
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRoleEnum };
      search_catalog: {
        Args: {
          q: string;
          lang?: string;
          types?: string[] | null;
          genre_filter?: string[] | null;
          year_from?: number | null;
          year_to?: number | null;
          max_results?: number;
          skip?: number;
        };
        Returns: SearchResultRow[];
      };
      expiring_license_count: { Args: Record<string, never>; Returns: number };
      search_people: {
        Args: { q: string; lang?: string; max_results?: number };
        Returns: { id: string; slug: string; name: string; photo_url: string | null; title_count: number }[];
      };
      search_suggest: {
        Args: { q: string; lang?: string; max_results?: number };
        Returns: { suggestion: string; sim: number }[];
      };
      normalize_search: { Args: { input: string }; Returns: string };
      latin_skeleton: { Args: { input: string }; Returns: string };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      new_submission_count: { Args: Record<string, never>; Returns: number };
      module_counts: { Args: Record<string, never>; Returns: Record<string, number> };
    };
    Enums: {
      app_role: AppRoleEnum;
      content_status: ContentStatusEnum;
      program_kind: ProgramKindEnum;
      license_status: LicenseStatusEnum;
      drm_system: DrmSystemEnum;
      submission_status: SubmissionStatusEnum;
      submission_kind: SubmissionKindEnum;
      library_kind: LibraryKindEnum;
      social_platform: SocialPlatformEnum;
      post_status: PostStatusEnum;
      notification_level: NotificationLevelEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
