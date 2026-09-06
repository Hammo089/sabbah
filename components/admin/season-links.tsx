'use client';

// components/admin/season-links.tsx — CLIENT COMPONENT
// The "Watch" tab: where this season can be seen, and the links that go with it.
import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveSeasonLinks } from '@/app/[lang]/admin/(dashboard)/season-actions';
import type { ActionResult } from '@/app/[lang]/admin/(dashboard)/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

function SaveBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="gold" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {label}
    </Button>
  );
}

export function SeasonLinks({
  values,
  dict,
}: {
  values: {
    id: string;
    youtube_id: string | null;
    watch_url: string | null;
    website_url: string | null;
    press_kit_url: string | null;
  };
  dict: { youtube: string; watch: string; website: string; pressKit: string; save: string; saved: string };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveSeasonLinks, null);
  const [youtube, setYoutube] = React.useState(values.youtube_id ?? '');

  React.useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(dict.saved);
    else toast.error(state.error);
  }, [state, dict.saved]);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <input type="hidden" name="id" value={values.id} />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{dict.youtube}</Label>
        <Input
          name="youtube_id"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value.trim())}
          maxLength={32}
          pattern="[A-Za-z0-9_-]*"
          dir="ltr"
          placeholder="R0J7ypYwiDI"
        />
      </div>

      {youtube && /^[A-Za-z0-9_-]{6,}$/.test(youtube) && (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtube}`}
            title="preview"
            allow="encrypted-media"
            className="size-full border-0"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{dict.watch}</Label>
        <Input name="watch_url" type="url" defaultValue={values.watch_url ?? ''} dir="ltr" placeholder="https://" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{dict.website}</Label>
        <Input name="website_url" type="url" defaultValue={values.website_url ?? ''} dir="ltr" placeholder="https://" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{dict.pressKit}</Label>
        <Input name="press_kit_url" type="url" defaultValue={values.press_kit_url ?? ''} dir="ltr" placeholder="https://" />
      </div>

      <SaveBtn label={dict.save} />
    </form>
  );
}
