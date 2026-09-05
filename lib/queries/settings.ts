// lib/queries/settings.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseAnonClient } from '@/lib/supabase/server';

export type SiteSettings = {
  ticker_enabled: boolean;
  anniversary_enabled: boolean;
  anniversary_youtube: string;
  hero_backdrop_url: string | null;
  stat_years: string;
  stat_productions: string;
  stat_offices: string;
  stat_partners: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  ticker_enabled: true,
  anniversary_enabled: true,
  anniversary_youtube: 'R0J7ypYwiDI',
  hero_backdrop_url: null,
  stat_years: '70',
  stat_productions: '200',
  stat_offices: '5',
  stat_partners: '30',
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return DEFAULT_SETTINGS;
  }

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase.from('site_settings').select('*').eq('id', true).maybeSingle();
    return data ? ({ ...DEFAULT_SETTINGS, ...data } as SiteSettings) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('[settings]', error);
    return DEFAULT_SETTINGS;
  }
});
