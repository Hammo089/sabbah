// lib/admin/search.ts

/**
 * Builds a PostgREST `or=` filter that searches a slug column plus every
 * language of a jsonb column.
 *
 * The admin list pages searched `slug` only, so an operator typing an Arabic or
 * English title got "no results" for a record that plainly exists — the slug is
 * usually a transliteration nobody remembers.
 *
 * The term is sanitised rather than escaped: PostgREST parses the `or` value as
 * a comma-separated list with parenthesised groups, and there is no escape
 * sequence for a comma inside it. A term containing `,` `(` `)` or `.` would
 * silently change the filter's shape, so those characters are dropped. `%` and
 * `_` are dropped too — they are ILIKE wildcards, and a user typing `%` means
 * the literal character, not "match everything".
 */
export function localizedSearchFilter(
  term: string,
  jsonColumn: string,
  langs: readonly string[] = ['ar', 'en', 'fr'],
  slugColumn = 'slug',
): string | null {
  const safe = term.trim().replace(/[,().%_*\\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!safe) return null;

  const pattern = `*${safe}*`;
  return [
    `${slugColumn}.ilike.${pattern}`,
    ...langs.map((lang) => `${jsonColumn}->>${lang}.ilike.${pattern}`),
  ].join(',');
}
