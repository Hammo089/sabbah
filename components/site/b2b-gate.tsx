'use client';

// components/site/b2b-gate.tsx — CLIENT COMPONENT
import * as React from 'react';
import { Download, Loader2, Lock, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

export type GateDict = {
  download: string;
  title: string;
  lead: string;
  fullName: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  interest: string;
  submit: string;
  cancel: string;
  error: string;
  note: string;
};

/**
 * The catalogue gate.
 *
 * Buyers are NOT asked to register. There is no password, no confirmation
 * e-mail and no account to manage — an acquisitions head will type four fields
 * to see a rights list, and will abandon a signup form. They identify
 * themselves once, the answer is stored as a lead, and a signed cookie keeps
 * the catalogue open for thirty days.
 */
export function B2BGate({ lang, dict }: { lang: Locale; dict: GateDict }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState(false);
  const reduce = useReducedMotion();

  async function download() {
    setPending(true);
    setError(false);

    try {
      const res = await fetch(`/api/generate-b2b-pdf?lang=${lang}&status=available`, {
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        setOpen(true);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cap-catalog-${lang}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  async function identify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);

    const form = new FormData(event.currentTarget);
    const value = (k: string) => String(form.get(k) ?? '').trim();

    try {
      const res = await fetch('/api/b2b-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: value('full_name'),
          company: value('company'),
          position: value('position'),
          phone: value('phone'),
          email: value('email'),
          interest: value('interest'),
          company_website: value('company_website'),
        }),
      });

      if (!res.ok) {
        setError(true);
        return;
      }

      setOpen(false);
      await download();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="gold" onClick={download} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Download />}
        {dict.download}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={dict.title}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-7"
            >
              <header className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/12">
                  <Lock className="size-4 text-primary" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-display text-lg font-light">{dict.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{dict.lead}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={dict.cancel}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </header>

              <form onSubmit={identify} className="mt-7 space-y-4">
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{dict.fullName} *</Label>
                    <Input name="full_name" required maxLength={120} autoComplete="name" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{dict.company} *</Label>
                    <Input name="company" required maxLength={160} autoComplete="organization" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{dict.position} *</Label>
                    <Input name="position" required maxLength={120} autoComplete="organization-title" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{dict.phone} *</Label>
                    <Input name="phone" type="tel" required maxLength={40} autoComplete="tel" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{dict.email}</Label>
                  <Input name="email" type="email" maxLength={160} autoComplete="email" dir="ltr" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{dict.interest}</Label>
                  <textarea
                    name="interest"
                    rows={2}
                    maxLength={400}
                    className="w-full rounded-md border border-input bg-transparent p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {dict.error}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <Button type="submit" variant="gold" disabled={pending}>
                    {pending ? <Loader2 className="animate-spin" /> : <Download />}
                    {dict.submit}
                  </Button>
                  <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{dict.note}</p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
