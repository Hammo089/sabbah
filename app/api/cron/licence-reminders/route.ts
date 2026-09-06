// app/api/cron/licence-reminders/route.ts
// Daily sweep: e-mail every super_admin about licences entering their reminder
// window or already expired. Triggered by Vercel Cron (see vercel.json).
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Row = {
  id: string;
  licensee_name: string | null;
  licensee_company: string | null;
  ends_on: string;
  days_left: number;
  expired: boolean;
  series_slug: string | null;
  series_title: Record<string, string> | null;
  movie_slug: string | null;
  movie_title: Record<string, string> | null;
};

function titleOf(r: Row): string {
  const j = r.series_title ?? r.movie_title;
  return j?.en ?? j?.ar ?? j?.fr ?? r.series_slug ?? r.movie_slug ?? '—';
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

function renderEmail(rows: Row[]): string {
  const items = rows
    .map((r) => {
      const state = r.expired
        ? `<strong style="color:#e5484d">EXPIRED ${Math.abs(r.days_left)}d ago</strong>`
        : `<strong style="color:#2c845c">${r.days_left} days left</strong>`;

      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #222">${titleOf(r)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #222">${r.licensee_company ?? r.licensee_name ?? '—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #222">${r.ends_on}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #222">${state}</td>
      </tr>`;
    })
    .join('');

  return `<div style="background:#000;color:#fff;font-family:system-ui,sans-serif;padding:32px">
    <h1 style="font-weight:300;font-size:22px;margin:0 0 6px">Licence expiry report</h1>
    <p style="color:#767676;font-size:13px;margin:0 0 24px">${rows.length} contract(s) need attention.</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <thead><tr style="color:#767676;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.12em">
        <th style="padding:0 14px 8px">Title</th><th style="padding:0 14px 8px">Licensee</th>
        <th style="padding:0 14px 8px">Ends</th><th style="padding:0 14px 8px">Status</th>
      </tr></thead>
      <tbody>${items}</tbody>
    </table>
  </div>`;
}

async function sendEmail(to: string[], html: string, count: number): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LICENCE_ALERT_FROM;
  if (!key || !from || to.length === 0) return false;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `[CAP] ${count} licence contract(s) expiring`,
      html,
    }),
  });

  return res.ok;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ error: 'SERVICE_ROLE_MISSING' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('expiring_licenses')
    .select('*')
    .eq('reminder_ack', false)
    .order('days_left', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'QUERY_FAILED', detail: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as Row[];
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, expiring: 0, emailed: false });
  }

  const { data: admins } = await supabase
    .from('users_profiles')
    .select('email')
    .eq('role', 'super_admin')
    .eq('is_active', true);

  const recipients = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];
  const emailed = await sendEmail(recipients, renderEmail(rows), rows.length);

  if (!emailed) {
    console.warn('[licence-reminders] %d expiring, e-mail not sent (provider not configured)', rows.length);
  }

  return NextResponse.json({ ok: true, expiring: rows.length, emailed, recipients: recipients.length });
}
