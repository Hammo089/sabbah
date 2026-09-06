// components/site/brand-logo.tsx — SERVER COMPONENT
// The real Cedars Art Production mark, replacing the "CAP" text placeholder
// that was standing in for it everywhere.
//
// Three variants because one file cannot serve every slot:
//   `mark`     the CA symbol alone — the header, where width is scarce
//   `lockup`   symbol + wordmark — the footer and the loader
//   `wordmark` type only, for a line of text that must not carry a symbol
//
// The bundled files live in /public/brand and are the default. An operator can
// override the URL from /admin/appearance without a deploy, which is what makes
// a rebrand a settings change rather than a release.
import Image from 'next/image';
import { cn } from '@/lib/utils';

const DEFAULTS = {
  mark: '/brand/cap-mark.png',
  lockup: '/brand/cap-lockup.png',
} as const;

export function BrandLogo({
  variant = 'mark',
  className,
  src,
  alt = 'Cedars Art Production — Sabbah Brothers',
  priority = false,
  width,
  height,
}: {
  variant?: 'mark' | 'lockup';
  className?: string;
  /** Overrides the bundled asset — set from the dashboard. */
  src?: string | null;
  alt?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const source = src || DEFAULTS[variant];

  // The lockup is wider than it is tall; the mark is close to square. Giving
  // each its own intrinsic ratio stops Next from reserving the wrong box and
  // shifting the header on load.
  const [w, h] =
    variant === 'lockup' ? [width ?? 200, height ?? 164] : [width ?? 64, height ?? 52];

  return (
    <Image
      src={source}
      alt={alt}
      width={w}
      height={h}
      priority={priority}
      className={cn('h-auto w-auto object-contain', className)}
    />
  );
}
