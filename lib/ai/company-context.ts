// lib/ai/company-context.ts
import 'server-only';
import { cache } from 'react';
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries/settings';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/**
 * Everything the public assistant is allowed to know, assembled from the same
 * tables the site renders. Two rules hold this together:
 *
 *  1. Only PUBLIC data. The anon client is used deliberately, so RLS makes it
 *     impossible for the assistant to quote a draft title, a licence, a fee or
 *     anyone's submission — even if a visitor asks it to.
 *  2. It is refreshed with the page cache, not hardcoded, so the assistant
 *     stays correct as the catalogue and the newsroom change.
 */
export const getCompanyContext = cache(async (lang: Locale): Promise<string> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return '';

  try {
    const supabase = createSupabaseAnonClient();
    const settings = await getSiteSettings();

    const [titles, legacy, news, partners, knowledge] = await Promise.all([
      supabase
        .from('series')
        .select('slug, title, subtitle, year, genres, kind, seasons_count, is_coming_soon')
        .eq('status', 'published')
        .order('year', { ascending: false, nullsFirst: false })
        .limit(80),
      supabase
        .from('company_legacy')
        .select('year, title, description')
        .order('year')
        .limit(40),
      supabase
        .from('news_ticker')
        .select('message')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(10),
      supabase.from('broadcasters').select('name').order('sort_order').limit(40),
      supabase
        .from('assistant_knowledge')
        .select('topic, question, answer')
        .eq('is_active', true)
        .order('sort_order')
        .limit(60),
    ]);

    const lines: string[] = [];

    lines.push('## Company');
    lines.push(
      `Cedars Art Production — Sabbah Brothers. Beirut, with offices in Cairo, Casablanca and Dubai. ` +
        `${settings.stat_years}+ years, ${settings.stat_productions}+ productions, ` +
        `${settings.stat_partners}+ broadcast partners.`,
    );

    const kb = knowledge.data ?? [];
    if (kb.length > 0) {
      lines.push('', '## Approved answers (prefer these, in the visitor\'s language)');
      for (const row of kb) {
        const q = t(row.question, lang, '');
        const a = t(row.answer, lang, '');
        if (q && a) lines.push(`Q: ${q}\nA: ${a}`);
      }
    }

    const cat = titles.data ?? [];
    if (cat.length > 0) {
      lines.push('', '## Catalogue (published titles only)');
      for (const row of cat) {
        const r = row as unknown as {
          slug: string;
          title: unknown;
          subtitle: unknown;
          year: number | null;
          genres: string[] | null;
          kind: string;
          seasons_count: number | null;
          is_coming_soon: boolean;
        };
        const bits = [
          t(r.title, lang, r.slug),
          r.year ? `(${r.year})` : '',
          r.kind,
          r.seasons_count && r.seasons_count > 1 ? `${r.seasons_count} seasons` : '',
          r.genres?.length ? r.genres.slice(0, 3).join('/') : '',
          r.is_coming_soon ? 'coming soon' : '',
        ].filter(Boolean);
        lines.push(`- ${bits.join(' · ')}`);
      }
    }

    const hist = legacy.data ?? [];
    if (hist.length > 0) {
      lines.push('', '## Company history');
      for (const row of hist) {
        const r = row as unknown as { year: number | null; title: unknown; description: unknown };
        lines.push(`- ${r.year ?? ''} ${t(r.title, lang, '')}: ${t(r.description, lang, '')}`.trim());
      }
    }

    const feed = news.data ?? [];
    if (feed.length > 0) {
      lines.push('', '## Latest news');
      for (const row of feed) {
        const text = t((row as unknown as { message: unknown }).message, lang, '');
        if (text) lines.push(`- ${text}`);
      }
    }

    const buyers = partners.data ?? [];
    if (buyers.length > 0) {
      lines.push('', '## Broadcast and platform partners');
      lines.push(buyers.map((b) => (b as unknown as { name: string }).name).join(', '));
    }

    lines.push('', '## Submissions');
    lines.push(
      settings.submissions_open
        ? 'Submissions are OPEN. The form is at /submit on this site. Uploads go to a private store only the reading team can open, and every submission gets a reference number immediately.'
        : 'Submissions are CLOSED right now. Invite the visitor to check back soon or use the contact page.',
    );

    return lines.join('\n');
  } catch (error) {
    console.error('[assistant-context]', error);
    return '';
  }
});
