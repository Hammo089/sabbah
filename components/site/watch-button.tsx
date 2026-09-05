// components/site/watch-button.tsx
'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import { YouTubeTheatre } from './youtube-theatre';
import { cn } from '@/lib/utils';

/** Opens the theatre for a YouTube id; falls back to a plain link otherwise. */
export function WatchButton({
  youtubeId,
  fallbackUrl,
  label,
  title,
}: {
  youtubeId: string | null;
  fallbackUrl: string | null;
  label: string;
  title: string;
}) {
  const [open, setOpen] = React.useState(false);

  const classes = cn(
    'inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3',
    'text-sm font-medium text-primary-foreground transition-all hover:brightness-110',
  );

  if (!youtubeId) {
    return fallbackUrl ? (
      <a href={fallbackUrl} target="_blank" rel="noreferrer" className={classes}>
        <Play className="size-4 fill-current" />
        {label}
      </a>
    ) : null;
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={classes}>
        <Play className="size-4 fill-current" />
        {label}
      </button>

      <YouTubeTheatre videoId={youtubeId} open={open} onClose={() => setOpen(false)} title={title} />
    </>
  );
}
