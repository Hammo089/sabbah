'use client';

// components/site/b2b-pdf-button.tsx — CLIENT COMPONENT
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

export function B2BPdfButton({
  lang,
  labels,
}: {
  lang: Locale;
  labels: { download: string; hint: string; signIn: string };
}) {
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();

  function download() {
    start(async () => {
      const res = await fetch(`/api/generate-b2b-pdf?lang=${lang}&status=available`, {
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        setLocked(true);
        return;
      }
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cap-catalog-${lang}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (locked) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4 text-primary" />
          {labels.hint}
        </p>
        <Button asChild variant="gold">
          <Link href={`/${lang}/login`}>{labels.signIn}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Button variant="gold" onClick={download} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Download />}
      {labels.download}
    </Button>
  );
}
