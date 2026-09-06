// components/admin/appearance-form.tsx
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { saveTheme } from '@/app/[lang]/admin/(dashboard)/settings-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import type { SiteSettings } from '@/lib/queries/settings';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/admin/image-upload';
import { cn } from '@/lib/utils';

const PRESETS = [
  { name: 'Sabbah', primary: '#2c845c', accent: '#3aa877', background: '#000000', foreground: '#ffffff', muted: '#767676' },
  { name: 'Gold',   primary: '#c9a84c', accent: '#e8c96a', background: '#080808', foreground: '#e8e0d4', muted: '#8a8278' },
  { name: 'Crimson',primary: '#9e2b2b', accent: '#c74444', background: '#0a0808', foreground: '#f5efef', muted: '#8a7d7d' },
  { name: 'Steel',  primary: '#3f6f9e', accent: '#5b8fc4', background: '#06080a', foreground: '#eaf0f5', muted: '#79838c' },
];

type Dict = {
  title: string; hint: string; colors: string; presets: string; layout: string; sections: string;
  primary: string; accent: string; background: string; foreground: string; muted: string;
  radius: string; headerStyle: string; transparent: string; solid: string;
  heroAlign: string; alignStart: string; alignCenter: string; filmStrip: string;
  stats: string; marquee: string; showcase: string; rails: string; partners: string;
  preview: string; reset: string;
  chrome: string; tickerSpeed: string; tickerSlower: string;
  loader: string; loaderStyle: string; loaderRing: string; loaderSweep: string;
  loaderPulse: string; loaderNone: string; loaderSpeed: string; loaderLogo: string;
  bgVideo: string; bgVideoOn: string; bgVideoId: string; bgVideoOpacity: string;
  bgVideoScope: string; scopeHome: string; scopeAll: string; bgVideoNote: string;
  publicPages: string; submissionsOpen: string; assistantOn: string;
  backdrop: string; backdropOn: string; backdropNote: string; loopUrl: string;
  webmUrl: string; posterUrl: string; brightness: string; blurAmount: string;
  onMobile: string; onMobileNote: string; anniversaryFilm: string;
  filmUrl: string; filmLabel: string; showButton: string;
  glass: string; glassOn: string; glassBlur: string; glassOpacity: string;
  glassBorder: string; glassNote: string;
};

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

function ColorField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-1"
          aria-label={label}
        />
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          pattern="#[0-9a-fA-F]{6}"
          className="h-10 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

const SELECT_CLASS =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function AppearanceForm({
  values,
  dict,
  labels,
  uploadDict,
}: {
  values: SiteSettings;
  dict: Dict;
  labels: { save: string; saved: string };
  uploadDict: React.ComponentProps<typeof ImageUpload>['dict'];
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveTheme, null);

  const [primary, setPrimary] = React.useState(values.theme_primary);
  const [accent, setAccent] = React.useState(values.theme_accent);
  const [background, setBackground] = React.useState(values.theme_background);
  const [foreground, setForeground] = React.useState(values.theme_foreground);
  const [muted, setMuted] = React.useState(values.theme_muted);
  const [radius, setRadius] = React.useState(values.theme_radius);
  const [tickerSpeed, setTickerSpeed] = React.useState(values.ticker_speed);

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(labels.saved);
    else toast.error(state.error);
  }, [state, labels.saved]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setPrimary(p.primary);
    setAccent(p.accent);
    setBackground(p.background);
    setForeground(p.foreground);
    setMuted(p.muted);
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {/* Colours */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.colors}</p>

          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs text-muted-foreground">{dict.presets}:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/50"
              >
                <span className="size-3 rounded-full" style={{ background: p.primary }} />
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ColorField name="theme_primary" label={dict.primary} value={primary} onChange={setPrimary} />
            <ColorField name="theme_accent" label={dict.accent} value={accent} onChange={setAccent} />
            <ColorField name="theme_background" label={dict.background} value={background} onChange={setBackground} />
            <ColorField name="theme_foreground" label={dict.foreground} value={foreground} onChange={setForeground} />
            <ColorField name="theme_muted" label={dict.muted} value={muted} onChange={setMuted} />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.radius}</Label>
              <select
                name="theme_radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="0rem" className="bg-background">0 — sharp</option>
                <option value="0.25rem" className="bg-background">4px</option>
                <option value="0.375rem" className="bg-background">6px</option>
                <option value="0.5rem" className="bg-background">8px</option>
                <option value="0.75rem" className="bg-background">12px</option>
                <option value="1rem" className="bg-background">16px</option>
              </select>
            </div>
          </div>
        </section>

        {/* Layout */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.layout}</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.headerStyle}</Label>
              <select name="header_style" defaultValue={values.header_style}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="transparent" className="bg-background">{dict.transparent}</option>
                <option value="solid" className="bg-background">{dict.solid}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.heroAlign}</Label>
              <select name="hero_align" defaultValue={values.hero_align}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="start" className="bg-background">{dict.alignStart}</option>
                <option value="center" className="bg-background">{dict.alignCenter}</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">{dict.filmStrip}</span>
            <Switch name="hero_show_strip" defaultChecked={values.hero_show_strip} />
          </label>
        </section>

        {/* Sections */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.sections}</p>

          {([
            ['show_stats', dict.stats],
            ['show_marquee', dict.marquee],
            ['show_showcase', dict.showcase],
            ['show_rails', dict.rails],
            ['show_partners', dict.partners],
          ] as const).map(([name, label]) => (
            <label key={name} className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm">{label}</span>
              <Switch name={name} defaultChecked={values[name]} />
            </label>
          ))}
        </section>

        {/* Motion & chrome */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.chrome}</p>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{dict.tickerSpeed}</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={240}
                step={2}
                value={tickerSpeed}
                onChange={(e) => setTickerSpeed(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer accent-[hsl(var(--primary))]"
                aria-label={dict.tickerSpeed}
              />
              <input
                name="ticker_speed"
                type="number"
                min={10}
                max={240}
                value={tickerSpeed}
                onChange={(e) => setTickerSpeed(Number(e.target.value))}
                dir="ltr"
                className="h-10 w-20 rounded-md border border-input bg-transparent px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <p className="text-[0.7rem] text-muted-foreground/70">{dict.tickerSlower}</p>
          </div>

          <div className="border-t border-border pt-5">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm">{dict.loader}</span>
              <Switch name="loader_enabled" defaultChecked={values.loader_enabled} />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{dict.loaderStyle}</Label>
                <select name="loader_style" defaultValue={values.loader_style} className={SELECT_CLASS}>
                  <option value="ring" className="bg-background">{dict.loaderRing}</option>
                  <option value="sweep" className="bg-background">{dict.loaderSweep}</option>
                  <option value="pulse" className="bg-background">{dict.loaderPulse}</option>
                  <option value="none" className="bg-background">{dict.loaderNone}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{dict.loaderSpeed}</Label>
                <input
                  name="loader_speed"
                  type="number"
                  min={400}
                  max={6000}
                  step={100}
                  defaultValue={values.loader_speed}
                  dir="ltr"
                  className={SELECT_CLASS}
                />
              </div>
            </div>

            <div className="mt-4">
              <ImageUpload
                name="loader_logo_url"
                bucket="broadcasters"
                defaultValue={values.loader_logo_url}
                label={dict.loaderLogo}
                aspect="square"
                dict={uploadDict}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm">{dict.bgVideoOn}</span>
              <Switch name="bg_video_enabled" defaultChecked={values.bg_video_enabled} />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{dict.bgVideoId}</Label>
                <input
                  name="bg_video_youtube"
                  defaultValue={values.bg_video_youtube}
                  dir="ltr"
                  pattern="[A-Za-z0-9_-]*"
                  className={SELECT_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{dict.bgVideoOpacity}</Label>
                <input
                  name="bg_video_opacity"
                  type="number"
                  min={0}
                  max={60}
                  defaultValue={values.bg_video_opacity}
                  dir="ltr"
                  className={SELECT_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{dict.bgVideoScope}</Label>
                <select name="bg_video_scope" defaultValue={values.bg_video_scope} className={SELECT_CLASS}>
                  <option value="home" className="bg-background">{dict.scopeHome}</option>
                  <option value="all" className="bg-background">{dict.scopeAll}</option>
                </select>
              </div>
            </div>

            <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70">{dict.bgVideoNote}</p>
          </div>
        </section>

        {/* Backdrop film */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.backdrop}</p>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">{dict.backdropOn}</span>
            <Switch name="backdrop_enabled" defaultChecked={values.backdrop_enabled} />
          </label>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{dict.loopUrl}</Label>
            <input
              name="backdrop_loop_url"
              type="url"
              defaultValue={values.backdrop_loop_url ?? ''}
              dir="ltr"
              placeholder="https://….supabase.co/storage/v1/object/public/video/71th-bg.mp4"
              className={SELECT_CLASS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.webmUrl}</Label>
              <input name="backdrop_webm_url" type="url" defaultValue={values.backdrop_webm_url ?? ''} dir="ltr" className={SELECT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.posterUrl}</Label>
              <input name="backdrop_poster_url" type="url" defaultValue={values.backdrop_poster_url ?? ''} dir="ltr" className={SELECT_CLASS} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.brightness}</Label>
              <input name="backdrop_brightness" type="number" min={10} max={100} defaultValue={values.backdrop_brightness} dir="ltr" className={SELECT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.blurAmount}</Label>
              <input name="backdrop_blur" type="number" min={0} max={20} defaultValue={values.backdrop_blur} dir="ltr" className={SELECT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.bgVideoScope}</Label>
              <select name="backdrop_scope" defaultValue={values.backdrop_scope} className={SELECT_CLASS}>
                <option value="all" className="bg-background">{dict.scopeAll}</option>
                <option value="home" className="bg-background">{dict.scopeHome}</option>
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-start justify-between gap-4 border-t border-border pt-4">
            <span className="min-w-0">
              <span className="block text-sm">{dict.onMobile}</span>
              <span className="mt-1 block text-[0.7rem] leading-relaxed text-muted-foreground/70">
                {dict.onMobileNote}
              </span>
            </span>
            <Switch name="backdrop_on_mobile" defaultChecked={values.backdrop_on_mobile} />
          </label>

          <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70">{dict.backdropNote}</p>
        </section>

        {/* The 71 film */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.anniversaryFilm}</p>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{dict.filmUrl}</Label>
            <input
              name="anniversary_url"
              type="url"
              defaultValue={values.anniversary_url ?? ''}
              dir="ltr"
              placeholder="https://….supabase.co/storage/v1/object/public/video/71th-full.mp4"
              className={SELECT_CLASS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.filmLabel}</Label>
              <input name="anniversary_label" maxLength={8} defaultValue={values.anniversary_label} dir="ltr" className={SELECT_CLASS} />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4 self-end pb-2">
              <span className="text-sm">{dict.showButton}</span>
              <Switch name="anniversary_cta" defaultChecked={values.anniversary_cta} />
            </label>
          </div>
        </section>

        {/* Glass */}
        <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.glass}</p>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">{dict.glassOn}</span>
            <Switch name="glass_enabled" defaultChecked={values.glass_enabled} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.glassBlur}</Label>
              <input name="glass_blur" type="number" min={0} max={40} defaultValue={values.glass_blur} dir="ltr" className={SELECT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.glassOpacity}</Label>
              <input name="glass_opacity" type="number" min={0} max={40} defaultValue={values.glass_opacity} dir="ltr" className={SELECT_CLASS} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.glassBorder}</Label>
              <input name="glass_border" type="number" min={0} max={60} defaultValue={values.glass_border} dir="ltr" className={SELECT_CLASS} />
            </div>
          </div>

          <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70">{dict.glassNote}</p>
        </section>

        {/* Public pages */}
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.publicPages}</p>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">{dict.submissionsOpen}</span>
            <Switch name="submissions_open" defaultChecked={values.submissions_open} />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm">{dict.assistantOn}</span>
            <Switch name="assistant_enabled" defaultChecked={values.assistant_enabled} />
          </label>
        </section>

        <div className="flex gap-3">
          <SaveBtn label={labels.save} />
          <Button type="button" variant="ghost" onClick={() => applyPreset(PRESETS[0]!)}>
            <RotateCcw />
            {dict.reset}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-primary">{dict.preview}</p>

        <div
          className="overflow-hidden rounded-lg border border-border"
          style={{ background, color: foreground, borderRadius: radius }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${muted}33` }}>
            <span className="text-sm font-semibold" style={{ color: primary }}>CAP</span>
            <span className="text-[0.6rem] uppercase tracking-[0.2em]" style={{ color: muted }}>Series · Company</span>
          </div>

          <div className="px-4 py-8">
            <p className="mb-2 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em]" style={{ color: primary }}>
              <span className="block h-px w-6" style={{ background: primary }} />
              Est. 1954
            </p>
            <p className="text-2xl font-medium uppercase leading-none">
              Great<br />
              <span style={{ color: primary }}>Stories</span><br />
              Start Here
            </p>
            <p className="mt-3 text-xs" style={{ color: muted }}>
              Seventy years of Arabic storytelling.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <span
                className="px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em]"
                style={{ background: primary, color: background, borderRadius: radius }}
              >
                Explore
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: muted }}>
                Our story
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px" style={{ background: `${muted}22` }}>
            {['70+', '200+', '5'].map((n) => (
              <div key={n} className="py-4 text-center" style={{ background }}>
                <p className="text-lg font-semibold" style={{ color: primary }}>{n}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 text-center text-[0.6rem] uppercase tracking-[0.25em]"
            style={{ background: primary, color: background }}>
            Al Hayba ✦ Ruby ✦ Tango
          </div>
        </div>

        <p className={cn('mt-3 text-xs', 'text-muted-foreground')}>{dict.hint}</p>
      </aside>
    </form>
  );
}
