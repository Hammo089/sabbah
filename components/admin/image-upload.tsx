// components/admin/image-upload.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, ImageOff, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export type Bucket = 'posters' | 'backdrops' | 'people' | 'broadcasters' | 'legacy' | 'gallery';

const LIMITS: Record<Bucket, number> = {
  posters: 10,
  backdrops: 15,
  people: 5,
  broadcasters: 2,
  legacy: 25,
  gallery: 15,
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml';

function extensionOf(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  return file.type.split('/')[1] ?? 'jpg';
}

/**
 * Drag-and-drop image field.
 *
 * Uploads go straight from the browser to Supabase Storage — a 15 MB backdrop
 * never passes through a serverless function, so there is no body-size ceiling
 * and no double transfer. The bucket's RLS policy is what authorises the write,
 * so a non-staff session is rejected by the database, not by the UI.
 *
 * The committed value is still a plain URL in a hidden input, so every existing
 * form action keeps working unchanged.
 */
export function ImageUpload({
  name,
  bucket,
  defaultValue,
  label,
  aspect = 'poster',
  dict,
}: {
  name: string;
  bucket: Bucket;
  defaultValue?: string | null;
  label: string;
  aspect?: 'poster' | 'wide' | 'square';
  dict: {
    drop: string;
    browse: string;
    uploading: string;
    remove: string;
    tooLarge: string;
    failed: string;
    orPaste: string;
  };
}) {
  const [url, setUrl] = React.useState(defaultValue ?? '');
  const [busy, setBusy] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [showUrlField, setShowUrlField] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = React.useCallback(
    async (file: File) => {
      const maxMb = LIMITS[bucket];
      if (file.size > maxMb * 1024 * 1024) {
        toast.error(dict.tooLarge.replace('{n}', String(maxMb)));
        return;
      }

      setBusy(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const path = `${crypto.randomUUID()}.${extensionOf(file)}`;

        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type,
        });

        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setUrl(data.publicUrl);
      } catch (error) {
        console.error('[upload]', error);
        toast.error(dict.failed, {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setBusy(false);
      }
    },
    [bucket, dict],
  );

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  // Paste an image straight from the clipboard while the field is focused.
  function onPaste(event: React.ClipboardEvent) {
    const file = Array.from(event.clipboardData.files)[0];
    if (file) {
      event.preventDefault();
      void upload(file);
    }
  }

  const ratio =
    aspect === 'poster' ? 'aspect-[2/3]' : aspect === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => setShowUrlField((v) => !v)}
          className="flex items-center gap-1 text-[0.65rem] text-muted-foreground transition-colors hover:text-primary"
        >
          <Link2 className="size-3" />
          {dict.orPaste}
        </button>
      </div>

      {/* The value the form actually submits */}
      <input type="hidden" name={name} value={url} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        tabIndex={0}
        role="button"
        aria-label={label}
        onClick={() => !url && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !url) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          'relative w-full overflow-hidden rounded-md border border-dashed transition-colors',
          ratio,
          'max-h-64',
          dragging ? 'border-primary bg-primary/5' : 'border-input',
          !url && 'cursor-pointer hover:border-primary/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {url ? (
          <>
            <Image src={url} alt="" fill sizes="320px" className="object-cover" unoptimized />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUrl('');
              }}
              aria-label={dict.remove}
              className="absolute end-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-black/70 text-white transition-colors hover:bg-destructive"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-4 text-center">
            {busy ? (
              <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                {dict.uploading}
              </span>
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <UploadCloud className="size-6" />
                <span>{dict.drop}</span>
                <span className="text-primary underline">{dict.browse}</span>
                <span className="text-[0.65rem] opacity-60">max {LIMITS[bucket]} MB</span>
              </span>
            )}
          </div>
        )}

        {busy && url && (
          <div className="absolute inset-0 grid place-items-center bg-black/60">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = '';
        }}
      />

      {showUrlField && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          dir="ltr"
          placeholder="https://…"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}

      {!url && !busy && (
        <p className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
          <ImageOff className="size-3" />
          —
        </p>
      )}
    </div>
  );
}
