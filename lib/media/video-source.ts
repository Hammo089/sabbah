// lib/media/video-source.ts
// One field, two kinds of video.
//
// The operator pastes whatever they have — a YouTube link or a direct file URL —
// and this decides how to render it. Asking someone to know which box their
// link belongs in is a question the software can answer itself.

export type VideoSource =
  | { kind: 'youtube'; id: string }
  | { kind: 'file'; url: string }
  | null;

/**
 * Pulls the id out of every YouTube URL shape in the wild:
 *   youtube.com/watch?v=ID   ·  youtu.be/ID          ·  youtube.com/embed/ID
 *   youtube.com/shorts/ID    ·  youtube.com/live/ID  ·  a bare 11-char id
 *
 * Returns null for anything else, so a non-YouTube URL falls through to the
 * file branch rather than being mangled into a broken embed.
 */
export function youtubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // A bare id, pasted straight from the address bar.
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? '';
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com' && host !== 'm.youtube.com') {
    return null;
  }

  const v = url.searchParams.get('v');
  if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

  const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

/** Classifies a stored value so the component knows which player to mount. */
export function resolveVideo(input: string | null | undefined): VideoSource {
  if (!input) return null;

  const id = youtubeId(input);
  if (id) return { kind: 'youtube', id };

  const value = input.trim();
  // Only http(s) — never a javascript: or data: URL reaching an iframe or a
  // <video src>. The database has the same rule; this is the second gate.
  if (!/^https?:\/\//i.test(value)) return null;

  return { kind: 'file', url: value };
}

/**
 * Embed URL for a silent, looping, chrome-free background.
 *
 * `loop` needs `playlist` set to the same id — on its own it is ignored for a
 * single video, which is the usual reason a "looping" YouTube background plays
 * once and stops.
 */
export function backdropEmbedUrl(id: string): string {
  const safe = encodeURIComponent(id);
  return (
    `https://www.youtube-nocookie.com/embed/${safe}` +
    `?autoplay=1&mute=1&loop=1&playlist=${safe}` +
    '&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3' +
    '&disablekb=1&playsinline=1&fs=0&enablejsapi=1'
  );
}

/** Embed URL for the full film: sound on, controls on, starts from the top. */
export function filmEmbedUrl(id: string, origin?: string): string {
  const safe = encodeURIComponent(id);
  return (
    `https://www.youtube.com/embed/${safe}` +
    '?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=1' +
    (origin ? `&origin=${encodeURIComponent(origin)}` : '')
  );
}

/** YouTube's own still, used when no poster image was uploaded. */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg`;
}
