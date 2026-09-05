// components/site/news-ticker.tsx — SERVER COMPONENT
import Link from 'next/link';
import { createSupabaseAnonClient } from '@/lib/supabase/server';
import { t } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

export const revalidate = 300;

export async function NewsTicker({ lang }: { lang: Locale }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  let rows: { id: string; message: unknown; link_url: string | null }[] = [];

  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase
      .from('news_ticker')
      .select('id, message, link_url')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(8);
    rows = data ?? [];
  } catch (error) {
    console.error('[ticker]', error);
    return null;
  }

  if (rows.length === 0) return null;

  const items = rows.map((r) => ({ id: r.id, text: t(r.message, lang, ''), href: r.link_url }));
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-primary/[0.07]">
      <div className="flex w-max animate-[marquee-x_38s_linear_infinite] gap-10 py-2 hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span key={`${item.id}-${i}`} className="flex shrink-0 items-center gap-3 text-xs text-neutral-300">
            <span className="size-1 rounded-full bg-primary" />
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-primary">
                {item.text}
              </Link>
            ) : (
              item.text
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
