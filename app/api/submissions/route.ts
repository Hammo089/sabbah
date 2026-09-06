// app/api/submissions/route.ts
// Public endpoint. Writes with the service-role client so the submission row is
// never readable from the browser — the anon key cannot SELECT this table at
// all, which is the confidentiality guarantee the page promises.
import { NextResponse, type NextRequest } from 'next/server';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { limitRequest, tooMany, clientIp } from '@/lib/security/rate-limit';
import { extractText } from '@/lib/ai/extract-text';
import { readScript } from '@/lib/ai/read-script';
import { aiConfigured } from '@/lib/ai/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BUCKET = 'submissions';

const Body = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  agent_or_company: z.string().trim().max(160).optional().or(z.literal('')),
  portfolio_url: z.string().trim().url().max(400).optional().or(z.literal('')),

  work_title: z.string().trim().min(2).max(200),
  kind: z.enum(['series', 'film', 'format', 'novel', 'idea', 'other']).default('series'),
  language: z.enum(['ar', 'en', 'fr', 'other']).default('ar'),
  episodes_planned: z.coerce.number().int().min(0).max(500).optional(),
  logline: z.string().trim().min(10).max(600),
  synopsis: z.string().trim().max(20000).optional().or(z.literal('')),

  file_path: z.string().trim().max(400).optional().or(z.literal('')),
  file_name: z.string().trim().max(260).optional().or(z.literal('')),
  file_size: z.coerce.number().int().min(0).max(26_214_400).optional(),
  file_mime: z.string().trim().max(120).optional().or(z.literal('')),

  consent_terms: z.literal(true),
  // Honeypot: a real person never fills this in.
  company_website: z.string().max(0).optional(),
});

function blank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: NextRequest) {
  const gate = limitRequest(request, 'submission', 5, 600_000);
  if (!gate.ok) return tooMany(gate.retryAfter);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_BODY', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Silent success for bots: never tell a scraper which check it failed.
  if (data.company_website) {
    return NextResponse.json({ ok: true, ref: `CAP-${new Date().getFullYear() % 100}-000000` });
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 });
  }

  // The submitter's IP is kept only as a salted hash — enough to spot a flood,
  // useless as personal data.
  const salt = process.env.SUBMISSION_IP_SALT ?? '';
  const ipHash = salt
    ? createHash('sha256').update(`${salt}:${clientIp(request)}`).digest('hex').slice(0, 32)
    : null;

  const { data: inserted, error } = await supabase
    .from('script_submissions')
    .insert({
      full_name: data.full_name,
      email: data.email,
      phone: blank(data.phone),
      country: blank(data.country),
      agent_or_company: blank(data.agent_or_company),
      portfolio_url: blank(data.portfolio_url),
      work_title: data.work_title,
      kind: data.kind,
      language: data.language,
      episodes_planned: data.episodes_planned ?? null,
      logline: data.logline,
      synopsis: blank(data.synopsis),
      file_path: blank(data.file_path),
      file_name: blank(data.file_name),
      file_size: data.file_size ?? null,
      file_mime: blank(data.file_mime),
      consent_terms: true,
      source_ip_hash: ipHash,
    })
    .select('id, ref')
    .single();

  if (error || !inserted) {
    console.error('[submissions] insert failed', error);
    return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 500 });
  }

  // The applicant gets their reference immediately; the AI reading happens
  // after the response is on the wire so a slow model never blocks the form.
  const job = runReading(inserted.id).catch((err) =>
    console.error('[submissions] reading failed', err),
  );

  // Vercel kills pending work once the response is sent unless it is awaited or
  // registered — waitUntil when available, otherwise await.
  const ctx = (
    globalThis as { waitUntil?: (p: Promise<unknown>) => void }
  ).waitUntil;

  if (typeof ctx === 'function') ctx(job);
  else await job;

  return NextResponse.json({ ok: true, ref: inserted.ref });
}

/** Downloads the file, extracts its text and stores the coverage note. */
async function runReading(id: string): Promise<void> {
  if (!aiConfigured()) return;

  const supabase = createSupabaseAdminClient();

  const { data: row } = await supabase
    .from('script_submissions')
    .select('id, work_title, kind, logline, synopsis, file_path, file_name, file_mime')
    .eq('id', id)
    .single();

  if (!row) return;

  let body = row.synopsis ?? '';

  if (row.file_path) {
    try {
      const { data: file } = await supabase.storage.from(BUCKET).download(row.file_path);
      if (file) {
        const extracted = await extractText(
          await file.arrayBuffer(),
          row.file_mime ?? '',
          row.file_name ?? '',
        );
        if (extracted.text) body = `${body}\n\n${extracted.text}`.trim();
      }
    } catch (err) {
      console.error('[submissions] extract failed', err);
    }
  }

  try {
    const reading = await readScript({
      title: row.work_title,
      kind: row.kind,
      logline: row.logline,
      body,
    });

    await supabase
      .from('script_submissions')
      .update({
        ai_summary: reading.summary,
        ai_genre: reading.genre,
        ai_themes: reading.themes,
        ai_audience: reading.audience,
        ai_comparables: reading.comparables,
        ai_strength: reading.strength,
        ai_risk: reading.risk,
        ai_score: reading.score,
        ai_model: reading.model,
        ai_processed_at: new Date().toISOString(),
        ai_error: null,
      })
      .eq('id', id);
  } catch (err) {
    await supabase
      .from('script_submissions')
      .update({
        ai_error: err instanceof Error ? err.message.slice(0, 500) : 'unknown error',
        ai_processed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }
}

/** Signed upload target so the browser sends the file straight to storage. */
export async function PUT(request: NextRequest) {
  const gate = limitRequest(request, 'submission-upload', 8, 600_000);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const Query = z.object({
    name: z.string().trim().min(1).max(260),
    size: z.coerce.number().int().min(1).max(26_214_400),
  });

  const parsed = Query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_QUERY' }, { status: 400 });

  const ext = (parsed.data.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const allowed = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  if (!allowed.includes(ext)) return NextResponse.json({ error: 'BAD_TYPE' }, { status: 400 });

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: 'STORAGE_UNAVAILABLE' }, { status: 503 });
  }

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    console.error('[submissions] signed upload failed', error);
    return NextResponse.json({ error: 'UPLOAD_UNAVAILABLE' }, { status: 500 });
  }

  return NextResponse.json({ path, token: data.token });
}
