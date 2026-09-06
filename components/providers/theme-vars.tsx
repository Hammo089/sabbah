// components/providers/theme-vars.tsx — SERVER COMPONENT
import type { SiteSettings } from '@/lib/queries/settings';

const HEX = /^#[0-9a-fA-F]{6}$/;

/** #2c845c -> "154 50% 34%" so it drops into the existing hsl(var(--x)) tokens. */
function hexToHsl(hex: string): string | null {
  if (!HEX.test(hex)) return null;

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Writes the staff-chosen palette over the design tokens.
 *
 * Every value is re-validated here even though the database has a CHECK
 * constraint: this string is injected into a <style> tag, so a second gate
 * costs nothing and removes any path from a stored value to CSS injection.
 */
function serialise(pairs: [string, string | null][]): string {
  return pairs
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([key, value]) => `${key}:${value};`)
    .join('');
}

export function ThemeVars({ settings }: { settings: SiteSettings }) {
  const radius = /^[\d.]+(rem|px)$/.test(settings.theme_radius) ? settings.theme_radius : null;

  // Brand hues are theme-independent — they must land on :root so LIGHT mode
  // gets them too. Ground/ink/dim are dark-mode specific: pushing a #000000
  // background onto :root would black out light mode entirely.
  const root = serialise([
    ['--primary', hexToHsl(settings.theme_primary)],
    ['--ring', hexToHsl(settings.theme_primary)],
    ['--accent', hexToHsl(settings.theme_accent)],
    ...(radius ? ([['--radius', radius]] as [string, string][]) : []),
  ]);

  const dark = serialise([
    ['--background', hexToHsl(settings.theme_background)],
    ['--foreground', hexToHsl(settings.theme_foreground)],
    ['--muted-foreground', hexToHsl(settings.theme_muted)],
  ]);

  // Glass knobs. Clamped here as well as in the database so a value can never
  // reach the stylesheet as anything but a plain number.
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(Math.round(Number(value) || 0), min), max);

  const glass = settings.glass_enabled
    ? `--glass-blur:${clamp(settings.glass_blur, 0, 40)}px;` +
      `--glass-bg:${clamp(settings.glass_opacity, 0, 40)};` +
      `--glass-border:${clamp(settings.glass_border, 0, 60)};`
    : '';

  const rootBody = `${root}${glass}`;

  if (!rootBody && !dark) return null;

  return (
    <style>{`${rootBody ? `:root{${rootBody}}` : ''}${dark ? `.dark{${dark}}` : ''}`}</style>
  );
}
