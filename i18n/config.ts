// i18n/config.ts
export const i18n = {
  defaultLocale: 'ar',
  locales: ['ar', 'en', 'fr'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
  fr: 'ltr',
};

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
};

export const openGraphLocale: Record<Locale, string> = {
  ar: 'ar_LB',
  en: 'en_US',
  fr: 'fr_FR',
};

export function isLocale(value: string): value is Locale {
  return (i18n.locales as readonly string[]).includes(value);
}
