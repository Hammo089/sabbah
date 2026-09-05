// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Safely reads a localized value out of a jsonb {ar,en,fr} column. */
export function t(field: unknown, lang: string, fallback = ''): string {
  if (!field || typeof field !== 'object') return fallback;
  const rec = field as Record<string, unknown>;
  return (rec[lang] as string) || (rec.en as string) || (rec.ar as string) || fallback;
}
