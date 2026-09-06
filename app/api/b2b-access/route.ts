// app/api/b2b-access/route.ts
// Buyers identify themselves here instead of registering. No account, no
// password, no confirmation e-mail — four fields and they are in.
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { limitRequest, tooMany } from '@/lib/security/rate-limit';
import { issueToken, setAccessCookie } from '@/lib/b2b/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  full_name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  position: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  interest: z.string().trim().max(400).optional().or(z.literal('')),
  company_website: z.string().max(0).optional(), // honeypot
});

export async function POST(request: NextRequest) {
  const gate = limitRequest(request, 'b2b-access', 10, 600_000);
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

  if (parsed.data.company_website) {
    return NextResponse.json({ ok: true });
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: 'UNAVAILABLE' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('b2b_leads')
    .insert({
      full_name: parsed.data.full_name,
      company: parsed.data.company,
      position: parsed.data.position,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      country: parsed.data.country || null,
      interest: parsed.data.interest || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[b2b-access]', error);
    return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 500 });
  }

  const token = issueToken(data.id);
  if (!token) {
    return NextResponse.json({ error: 'ACCESS_SECRET_MISSING' }, { status: 503 });
  }

  await setAccessCookie(token);

  return NextResponse.json({ ok: true });
}
