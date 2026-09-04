// types/database.types.ts
// Regenerate with:
//   npx supabase gen types typescript --project-id <ref> --schema public > types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LocalizedText = { ar?: string; en?: string; fr?: string };

export type Database = {
  public: {
    Tables: {
      users_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: Database['public']['Enums']['app_role'];
          company_name: string | null;
          country_code: string | null;
          phone: string | null;
          locale: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users_profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['users_profiles']['Row']>;
        Relationships: [];
      };
      series: {
        Row: {
          id: string;
          slug: string;
          title: Json;
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
          status: Database['public']['Enums']['content_status'];
          is_featured_slider: boolean;
          sort_order: number;
          seo: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['series']['Row']> & { slug: string };
        Update: Partial<Database['public']['Tables']['series']['Row']>;
        Relationships: [];
      };
      movies: {
        Row: Omit<Database['public']['Tables']['series']['Row'], 'seasons_count' | 'episodes_count' | 'production_country'> & {
          duration_minutes: number | null;
          video_url: string | null;
        };
        Insert: Partial<Database['public']['Tables']['movies']['Row']> & { slug: string };
        Update: Partial<Database['public']['Tables']['movies']['Row']>;
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          slug: string;
          kind: Database['public']['Enums']['program_kind'];
          title: Json;
          synopsis: Json;
          genres: string[];
          year: number | null;
          duration_minutes: number | null;
          poster_url: string | null;
          backdrop_url: string | null;
          trailer_url: string | null;
          status: Database['public']['Enums']['content_status'];
          is_featured_slider: boolean;
          sort_order: number;
          seo: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['programs']['Row']> & { slug: string };
        Update: Partial<Database['public']['Tables']['programs']['Row']>;
        Relationships: [];
      };
      episodes: {
        Row: {
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
          status: Database['public']['Enums']['content_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['episodes']['Row']> & { series_id: string; episode_number: number };
        Update: Partial<Database['public']['Tables']['episodes']['Row']>;
        Relationships: [];
      };
      drm_licenses: {
        Row: {
          id: string;
          series_id: string | null;
          movie_id: string | null;
          licensee_name: string;
          licensee_email: string | null;
          territory: string[] | null;
          rights: string[] | null;
          exclusivity: boolean;
          drm: Database['public']['Enums']['drm_system'];
          license_key_id: string | null;
          license_server_url: string | null;
          contract_ref: string | null;
          fee_usd: number | null;
          status: Database['public']['Enums']['license_status'];
          starts_on: string | null;
          ends_on: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['drm_licenses']['Row']> & { licensee_name: string };
        Update: Partial<Database['public']['Tables']['drm_licenses']['Row']>;
        Relationships: [];
      };
      news_ticker: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['news_ticker']['Row']>;
        Update: Partial<Database['public']['Tables']['news_ticker']['Row']>;
        Relationships: [];
      };
      company_legacy: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['company_legacy']['Row']>;
        Update: Partial<Database['public']['Tables']['company_legacy']['Row']>;
        Relationships: [];
      };
    };
    Views: {
      b2b_available_titles: {
        Row: Pick<
          Database['public']['Tables']['series']['Row'],
          'id' | 'slug' | 'title' | 'synopsis' | 'genres' | 'year' | 'seasons_count' | 'episodes_count' | 'poster_url' | 'original_language'
        >;
        Relationships: [];
      };
    };
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: Database['public']['Enums']['app_role'] };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      app_role: 'super_admin' | 'admin' | 'editor' | 'b2b_client' | 'viewer';
      content_status: 'draft' | 'in_review' | 'published' | 'archived';
      program_kind: 'show' | 'documentary' | 'format' | 'special';
      license_status: 'available' | 'optioned' | 'licensed' | 'expired' | 'withdrawn';
      drm_system: 'widevine' | 'fairplay' | 'playready' | 'none';
    };
    CompositeTypes: Record<string, never>;
  };
};
