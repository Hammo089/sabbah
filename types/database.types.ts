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
  licensee_name: string;
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

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

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
      company_legacy: {
        Row: CompanyLegacyRow;
        Insert: Partial<CompanyLegacyRow>;
        Update: Partial<CompanyLegacyRow>;
        Relationships: [];
      };
    };
    Views: {
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
    };
    Enums: {
      app_role: AppRoleEnum;
      content_status: ContentStatusEnum;
      program_kind: ProgramKindEnum;
      license_status: LicenseStatusEnum;
      drm_system: DrmSystemEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
