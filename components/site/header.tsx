import Link from 'next/link';
import type { Locale } from '@/i18n/config';

interface HeaderProps {
  lang: Locale;
  dict: any;
  headerStyle?: string;
  glass?: boolean;
}

export function SiteHeader({ lang, dict, headerStyle, glass }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-black/60 border-b border-white/10 shadow-lg">
      {/* شعار سيدرز الأصلي المرفوع على Supabase */}
      <Link href={`/${lang}`} className="flex items-center gap-3">
        <img 
          src="https://rpzrafhjjpqmukbutaaj.supabase.co/storage/v1/object/public/video/10%20x%2010%20cedars%20without%20passion%20logo.png" 
          alt="Cedars Art Production - Sabbah Brothers" 
          className="h-10 w-auto object-contain brightness-110 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
        />
      </Link>

      {/* زر الـ 71 المتحرك سينمائياً */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-emerald-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <div className="relative px-4 py-2 bg-black/80 rounded-lg border border-amber-500/30 flex items-center space-x-2 space-x-reverse">
            <span className="text-amber-400 font-bold tracking-wider text-base">71</span>
            <span className="text-gray-200 text-xs font-medium hidden sm:inline">عاماً من الإبداع</span>
          </div>
        </div>
      </div>
    </header>
  );
}