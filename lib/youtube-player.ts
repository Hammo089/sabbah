// lib/youtube-player.ts
/**
 * Shared YouTube IFrame API plumbing.
 *
 * Both the title theatre and the home hero embed players, and each one loading
 * its own copy of the API would race the global `onYouTubeIframeAPIReady`
 * callback — whichever registered last would win and the other player would
 * never be built. One module-level promise, one script tag, every caller
 * awaits the same resolution.
 */

export type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;

export const UNSTARTED: PlayerState = -1;
export const ENDED: PlayerState = 0;
export const PLAYING: PlayerState = 1;
export const PAUSED: PlayerState = 2;
export const BUFFERING: PlayerState = 3;

export type YTPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (id: string) => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, options: Record<string, unknown>) => YTPlayer;
      loaded?: number;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

/** Loads the IFrame API once per page, no matter how many players exist. */
export function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  apiPromise ??= new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
}

/**
 * iOS and Android refuse unmuted autoplay far more often than desktop, so a
 * touch device gets a muted first frame plus a visible unmute control rather
 * than a player that silently never starts.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/** "1:42" / "1:02:07" — null duration renders nothing rather than "0:00". */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
