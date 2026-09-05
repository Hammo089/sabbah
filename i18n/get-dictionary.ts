// i18n/get-dictionary.ts
import 'server-only';
import type { Locale } from './config';

export type Dictionary = typeof import('./dictionaries/en.json');

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ar: () => import('./dictionaries/ar.json').then((m) => m.default as Dictionary),
  en: () => import('./dictionaries/en.json').then((m) => m.default as Dictionary),
  fr: () => import('./dictionaries/fr.json').then((m) => m.default as Dictionary),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  (dictionaries[locale] ?? dictionaries.en)();
