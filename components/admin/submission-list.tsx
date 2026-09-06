'use client';

// components/admin/submission-list.tsx — CLIENT COMPONENT
import * as React from 'react';
import {
  ChevronDown, Download, Loader2, Mail, Phone, Globe, FileText, Sparkles, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  updateSubmission,
  getSubmissionFileUrl,
} from '@/app/[lang]/admin/(dashboard)/settings-actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type SubmissionRow = {
  id: string;
  ref: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  agent_or_company: string | null;
  portfolio_url: string | null;
  work_title: string;
  kind: string;
  language: string;
  episodes_planned: number | null;
  logline: string;
  synopsis: string | null;
  file_name: string | null;
  file_size: number | null;
  has_file: boolean;
  ai_summary: string | null;
  ai_genre: string | null;
  ai_themes: string[] | null;
  ai_audience: string | null;
  ai_comparables: string | null;
  ai_strength: string | null;
  ai_risk: string | null;
  ai_score: number | null;
  ai_error: string | null;
  status: string;
  staff_notes: string | null;
  created_at: string;
};

export type SubmissionDict = {
  aiSummary: string; downloadFile: string; noSubmissions: string; reference: string;
  applicant: string; received: string; notes: string; save: string; saved: string;
  statusNew: string; statusReviewing: string; statusShortlisted: string;
  statusRejected: string; statusOptioned: string;
};

const STATUS_TONE: Record<string, string> = {
  new: 'bg-primary/15 text-primary',
  reviewing: 'bg-amber-500/15 text-amber-500',
  shortlisted: 'bg-emerald-500/15 text-emerald-500',
  rejected: 'bg-destructive/15 text-destructive',
  optioned: 'bg-sky-500/15 text-sky-500',
};

function scoreTone(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 55) return 'text-amber-500';
  return 'text-muted-foreground';
}

function Card({ row, dict }: { row: SubmissionRow; dict: SubmissionDict }) {
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [downloading, setDownloading] = React.useState(false);

  const statusLabels: Record<string, string> = {
    new: dict.statusNew,
    reviewing: dict.statusReviewing,
    shortlisted: dict.statusShortlisted,
    rejected: dict.statusRejected,
    optioned: dict.statusOptioned,
  };

  async function download() {
    setDownloading(true);
    try {
      const res = await getSubmissionFileUrl(row.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      window.open(res.url, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  }

  function save(formData: FormData) {
    start(async () => {
      const res = await updateSubmission(null, formData);
      if (!res.ok) toast.error(res.error);
      else toast.success(dict.saved);
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-start transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[0.7rem] tracking-widest text-muted-foreground">{row.ref}</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider',
                STATUS_TONE[row.status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {statusLabels[row.status] ?? row.status}
            </span>
            {row.has_file && <FileText className="size-3.5 text-muted-foreground" />}
          </div>

          <p className="mt-1.5 truncate text-sm font-medium">{row.work_title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.full_name} · {row.kind} · {new Date(row.created_at).toLocaleDateString()}
          </p>
        </div>

        {row.ai_score !== null && row.ai_score > 0 && (
          <span className={cn('shrink-0 text-2xl font-light tabular-nums', scoreTone(row.ai_score))}>
            {row.ai_score}
          </span>
        )}

        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-6 border-t border-border p-5">
          {/* AI coverage */}
          {row.ai_summary ? (
            <section className="rounded-lg border border-primary/25 bg-primary/[0.05] p-5">
              <p className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                <Sparkles className="size-3.5" />
                {dict.aiSummary}
              </p>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{row.ai_summary}</p>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {row.ai_genre && (
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Genre</dt>
                    <dd className="mt-1 text-sm">{row.ai_genre}</dd>
                  </div>
                )}
                {row.ai_comparables && (
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Comparables</dt>
                    <dd className="mt-1 text-sm">{row.ai_comparables}</dd>
                  </div>
                )}
                {row.ai_audience && (
                  <div className="sm:col-span-2">
                    <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Audience</dt>
                    <dd className="mt-1 text-sm">{row.ai_audience}</dd>
                  </div>
                )}
                {row.ai_strength && (
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-emerald-500">Strength</dt>
                    <dd className="mt-1 text-sm">{row.ai_strength}</dd>
                  </div>
                )}
                {row.ai_risk && (
                  <div>
                    <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-amber-500">Risk</dt>
                    <dd className="mt-1 text-sm">{row.ai_risk}</dd>
                  </div>
                )}
              </dl>

              {row.ai_themes && row.ai_themes.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {row.ai_themes.map((t) => (
                    <span key={t} className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[0.7rem] text-primary">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>
          ) : row.ai_error ? (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {row.ai_error}
            </p>
          ) : null}

          {/* The submission itself */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Logline</p>
                <p className="mt-1.5 text-sm leading-relaxed">{row.logline}</p>
              </div>

              {row.synopsis && (
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">Synopsis</p>
                  <p className="mt-1.5 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {row.synopsis}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-5">
              <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">{dict.applicant}</p>
              <p className="text-sm font-medium">{row.full_name}</p>

              <a href={`mailto:${row.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline" dir="ltr">
                <Mail className="size-3.5" />
                {row.email}
              </a>

              {row.phone && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
                  <Phone className="size-3.5" />
                  {row.phone}
                </p>
              )}

              {row.portfolio_url && (
                <a href={row.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline" dir="ltr">
                  <Globe className="size-3.5" />
                  {row.portfolio_url}
                </a>
              )}

              {row.agent_or_company && <p className="text-sm text-muted-foreground">{row.agent_or_company}</p>}
              {row.country && <p className="text-sm text-muted-foreground">{row.country}</p>}
              {row.episodes_planned ? (
                <p className="text-sm text-muted-foreground">{row.episodes_planned} ep.</p>
              ) : null}

              {row.has_file && (
                <Button type="button" variant="outline" size="sm" onClick={download} disabled={downloading} className="mt-2 w-full">
                  {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                  {dict.downloadFile}
                </Button>
              )}
            </div>
          </section>

          {/* Workflow */}
          <form action={save} className="flex flex-wrap items-end gap-4 border-t border-border pt-5">
            <input type="hidden" name="id" value={row.id} />

            <div className="w-44 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <select
                name="status"
                defaultValue={row.status}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-background">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[18rem] flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">{dict.notes}</Label>
              <textarea
                name="staff_notes"
                rows={2}
                defaultValue={row.staff_notes ?? ''}
                className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" variant="gold" size="sm" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {dict.save}
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}

export function SubmissionList({ rows, dict }: { rows: SubmissionRow[]; dict: SubmissionDict }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{dict.noSubmissions}</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <Card key={row.id} row={row} dict={dict} />
      ))}
    </div>
  );
}
