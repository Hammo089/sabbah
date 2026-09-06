'use client';

// components/site/submit-form.tsx — CLIENT COMPONENT
import * as React from 'react';
import { FileText, Loader2, ShieldCheck, UploadCloud, X, Check } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.txt,.rtf';

export type SubmitDict = {
  stepYou: string; stepWork: string; stepFile: string;
  fullName: string; email: string; phone: string; country: string; agent: string; portfolio: string;
  workTitle: string; kind: string; kindSeries: string; kindFilm: string; kindFormat: string;
  kindNovel: string; kindIdea: string; kindOther: string;
  language: string; episodes: string; logline: string; loglineHint: string;
  synopsis: string; synopsisHint: string;
  file: string; fileHint: string; consent: string;
  submitBtn: string; sending: string;
  successTitle: string; successBody: string; successAgain: string;
  errorRequired: string; errorFile: string; errorGeneric: string; privacyNote: string;
};

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border pt-8">
      <legend className="sr-only">{title}</legend>
      <p className="mb-6 flex items-baseline gap-3 text-[0.65rem] uppercase tracking-[0.24em] text-primary">
        <span className="tabular-nums">{step}</span>
        <span className="text-muted-foreground">{title}</span>
      </p>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ms-1 text-primary">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[0.7rem] leading-relaxed text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

export function SubmitForm({ lang, dict }: { lang: Locale; dict: SubmitDict }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ref, setRef] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  function pickFile(next: File | null) {
    setError(null);
    if (!next) return setFile(null);

    const ext = next.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext) || next.size > MAX_BYTES) {
      setError(dict.errorFile);
      return;
    }
    setFile(next);
  }

  async function uploadFile(): Promise<{
    file_path: string; file_name: string; file_size: number; file_mime: string;
  } | null> {
    if (!file) return null;

    const res = await fetch(
      `/api/submissions?name=${encodeURIComponent(file.name)}&size=${file.size}`,
      { method: 'PUT' },
    );
    if (!res.ok) throw new Error('upload-target');

    const { path, token } = (await res.json()) as { path: string; token: string };

    // Straight from the browser into the private bucket — a 25 MB script never
    // passes through a serverless function.
    const supabase = createSupabaseBrowserClient();
    const { error: upErr } = await supabase.storage
      .from('submissions')
      .uploadToSignedUrl(path, token, file, { contentType: file.type || 'application/octet-stream' });

    if (upErr) throw upErr;

    return {
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      file_mime: file.type || 'application/octet-stream',
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();

    if (!value('full_name') || !value('email') || !value('work_title') || value('logline').length < 10) {
      setError(dict.errorRequired);
      return;
    }
    if (form.get('consent_terms') !== 'on') {
      setError(dict.errorRequired);
      return;
    }

    setPending(true);

    try {
      let fileFields = {};
      if (file) {
        setProgress(dict.sending);
        fileFields = (await uploadFile()) ?? {};
      }

      setProgress(dict.sending);

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: value('full_name'),
          email: value('email'),
          phone: value('phone'),
          country: value('country'),
          agent_or_company: value('agent_or_company'),
          portfolio_url: value('portfolio_url'),
          work_title: value('work_title'),
          kind: value('kind') || 'series',
          language: value('language') || lang,
          episodes_planned: value('episodes_planned') || undefined,
          logline: value('logline'),
          synopsis: value('synopsis'),
          consent_terms: true,
          company_website: value('company_website'),
          ...fileFields,
        }),
      });

      if (!res.ok) throw new Error(`status-${res.status}`);

      const json = (await res.json()) as { ref: string };
      setRef(json.ref);
      formRef.current?.reset();
      setFile(null);
    } catch {
      setError(dict.errorGeneric);
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  if (ref) {
    return (
      <div className="mt-12 rounded-lg border border-primary/30 bg-primary/[0.06] p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15">
          <Check className="size-6 text-primary" />
        </span>
        <h2 className="mt-6 text-display text-2xl font-light">{dict.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {dict.successBody}
        </p>
        <p className="mt-7 select-all font-mono text-2xl tracking-[0.2em] text-primary">{ref}</p>
        <Button variant="outline" className="mt-8" onClick={() => setRef(null)}>
          {dict.successAgain}
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-12 max-w-3xl space-y-10" noValidate>
      {/* Honeypot — off-screen, never focusable, invisible to a real visitor. */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
      />

      <Section step="01" title={dict.stepYou}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dict.fullName} required>
            <Input name="full_name" required maxLength={120} autoComplete="name" />
          </Field>
          <Field label={dict.email} required>
            <Input name="email" type="email" required maxLength={160} autoComplete="email" dir="ltr" />
          </Field>
          <Field label={dict.phone}>
            <Input name="phone" type="tel" maxLength={40} autoComplete="tel" dir="ltr" />
          </Field>
          <Field label={dict.country}>
            <Input name="country" maxLength={80} autoComplete="country-name" />
          </Field>
          <Field label={dict.agent}>
            <Input name="agent_or_company" maxLength={160} />
          </Field>
          <Field label={dict.portfolio}>
            <Input name="portfolio_url" type="url" maxLength={400} dir="ltr" placeholder="https://" />
          </Field>
        </div>
      </Section>

      <Section step="02" title={dict.stepWork}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={dict.workTitle} required>
            <Input name="work_title" required maxLength={200} />
          </Field>

          <Field label={dict.kind}>
            <select
              name="kind"
              defaultValue="series"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="series" className="bg-background">{dict.kindSeries}</option>
              <option value="film" className="bg-background">{dict.kindFilm}</option>
              <option value="format" className="bg-background">{dict.kindFormat}</option>
              <option value="novel" className="bg-background">{dict.kindNovel}</option>
              <option value="idea" className="bg-background">{dict.kindIdea}</option>
              <option value="other" className="bg-background">{dict.kindOther}</option>
            </select>
          </Field>

          <Field label={dict.language}>
            <select
              name="language"
              defaultValue={lang}
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ar" className="bg-background">العربية</option>
              <option value="en" className="bg-background">English</option>
              <option value="fr" className="bg-background">Français</option>
              <option value="other" className="bg-background">—</option>
            </select>
          </Field>

          <Field label={dict.episodes}>
            <Input name="episodes_planned" type="number" min={0} max={500} dir="ltr" />
          </Field>
        </div>

        <div className="mt-5 space-y-5">
          <Field label={dict.logline} hint={dict.loglineHint} required>
            <textarea
              name="logline"
              required
              rows={3}
              maxLength={600}
              className="w-full rounded-md border border-input bg-transparent p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>

          <Field label={dict.synopsis} hint={dict.synopsisHint}>
            <textarea
              name="synopsis"
              rows={8}
              maxLength={20000}
              className="w-full rounded-md border border-input bg-transparent p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </div>
      </Section>

      <Section step="03" title={dict.stepFile}>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        {file ? (
          <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/[0.05] p-5">
            <FileText className="size-6 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              'flex w-full flex-col items-center gap-3 rounded-lg border border-dashed p-10 transition-colors',
              dragging ? 'border-primary bg-primary/[0.06]' : 'border-border hover:border-primary/50',
            )}
          >
            <UploadCloud className={cn('size-7', dragging ? 'text-primary' : 'text-muted-foreground')} />
            <span className="text-sm">{dict.file}</span>
            <span className="text-xs text-muted-foreground">{dict.fileHint}</span>
          </button>
        )}

        <label className="mt-6 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consent_terms"
            required
            className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">{dict.consent}</span>
        </label>
      </Section>

      <div className="flex flex-wrap items-center gap-5 border-t border-border pt-8">
        <Button type="submit" variant="gold" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {pending ? (progress ?? dict.sending) : dict.submitBtn}
        </Button>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          {dict.privacyNote}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
