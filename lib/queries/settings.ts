// lib/queries/settings.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseAnonClient } from '@/lib/supabase/server';

export type SiteSettings = {
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
  ticker_enabled: boolean;
  anniversary_enabled: boolean;
  anniversary_youtube: string;
  hero_backdrop_url: string | null;
  stat_years: string;
  stat_productions: string;
  stat_offices: string;
  stat_partners: string;
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
  hero_eyebrow: Record<string, string>;
  hero_headline: Record<string, string>;
  hero_highlight: Record<string, string>;
  hero_body: Record<string, string>;
  logo_url: string | null;
  logo_dark_url: string | null;
  anniversary_art_url: string | null;
  backdrop_mobile_url: string | null;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  theme_primary: '#2c845c',
  theme_accent: '#3aa877',
  theme_background: '#000000',
  theme_foreground: '#ffffff',
  theme_muted: '#767676',
  theme_radius: '0.375rem',
  header_style: 'transparent',
  hero_align: 'start',
  hero_show_strip: true,
  show_stats: true,
  show_marquee: true,
  show_showcase: true,
  show_rails: true,
  show_partners: true,
  ticker_enabled: true,
  anniversary_enabled: true,
  anniversary_youtube: 'R0J7ypYwiDI',
  hero_backdrop_url: null,
  stat_years: '70',
  stat_productions: '200',
  stat_offices: '5',
  stat_partners: '30',
  ticker_speed: 38,
  loader_enabled: true,
  loader_logo_url: null,
  loader_style: 'ring',
  loader_speed: 1400,
  bg_video_enabled: false,
  bg_video_youtube: 'R0J7ypYwiDI',
  bg_video_opacity: 18,
  bg_video_scope: 'home',
  submissions_open: true,
  assistant_enabled: true,
  backdrop_enabled: false,
  backdrop_loop_url: null,
  backdrop_webm_url: null,
  backdrop_poster_url: null,
  backdrop_scope: 'all',
  backdrop_brightness: 45,
  backdrop_blur: 0,
  backdrop_on_mobile: false,
  anniversary_url: null,
  anniversary_label: '71',
  anniversary_cta: true,
  glass_enabled: false,
  glass_blur: 18,
  glass_opacity: 6,
  glass_border: 14,
  hero_enabled: true,
  hero_eyebrow: {},
  hero_headline: {},
  hero_highlight: {},
  hero_body: {},
  logo_url: null,
  logo_dark_url: null,
  anniversary_art_url: null,
  backdrop_mobile_url: null,
};

/**
 * A jsonb column is typed `Json` by the generated types — it could be a string,
 * a number, or null as far as PostgREST is concerned. The hero copy columns are
 * always an object of language → text, but that is a schema guarantee (a
 * `default '{}'` and a not-null), not a type-system one, so it is asserted here
 * once, at the single point where a raw row enters the app.
 */
export function heroBag(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

/** Row → SiteSettings, with the jsonb copy columns narrowed to string maps. */
export function mergeSettings(row: Record<string, unknown>): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...(row as Partial<SiteSettings>),
    hero_eyebrow: heroBag(row.hero_eyebrow),
    hero_headline: heroBag(row.hero_headline),
    hero_highlight: heroBag(row.hero_highlight),
    hero_body: heroBag(row.hero_body),
  };
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEFAULT_SETTINGS;
  }

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase.from('site_settings').select('*').eq('id', true).maybeSingle();
    return data ? mergeSettings(data) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[settings]', error);
    return DEFAULT_SETTINGS;
  }
});
