// app/[lang]/admin/(dashboard)/submissions/page.tsx — SERVER COMPONENT
// Staff-only. RLS already refuses anon and the file path is never sent to the
// browser — downloads go through a short-lived signed URL instead.
import { notFound, redirect } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaff } from '@/lib/auth/rbac';
import { SubmissionList, type SubmissionRow } from '@/components/admin/submission-list';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const profile = await getCurrentProfile();
  if (!isStaff(profile)) redirect(`/${locale}/403`);

  const dict = await getDictionary(locale);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('script_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);

  const rows: SubmissionRow[] = (data ?? []).map((r) => ({
    id: r.id,
    ref: r.ref,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    country: r.country,
    agent_or_company: r.agent_or_company,
    portfolio_url: r.portfolio_url,
    work_title: r.work_title,
    kind: r.kind,
    language: r.language,
    episodes_planned: r.episodes_planned,
    logline: r.logline,
    synopsis: r.synopsis,
    file_name: r.file_name,
    file_size: r.file_size,
    has_file: Boolean(r.file_path),
    ai_summary: r.ai_summary,
    ai_genre: r.ai_genre,
    ai_themes: r.ai_themes,
    ai_audience: r.ai_audience,
    ai_comparables: r.ai_comparables,
    ai_strength: r.ai_strength,
    ai_risk: r.ai_risk,
    ai_score: r.ai_score,
    ai_error: r.ai_error,
    status: r.status,
    staff_notes: r.staff_notes,
    created_at: r.created_at,
  }));

  const newCount = rows.filter((r) => r.status === 'new').length;

  return (
    <div>
      <h1 className="text-display text-2xl font-light">{dict.admin.submissions}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} · {newCount} {dict.admin.statusNew}
      </p>

      <div className="mt-8 max-w-5xl">
        <SubmissionList
          rows={rows}
          dict={{
            aiSummary: dict.admin.aiSummary,
            downloadFile: dict.admin.downloadFile,
            noSubmissions: dict.admin.noSubmissions,
            reference: dict.admin.reference,
            applicant: dict.admin.applicant,
            received: dict.admin.received,
            notes: dict.admin.notes,
            save: dict.admin.save,
            saved: dict.admin.saved,
            statusNew: dict.admin.statusNew,
            statusReviewing: dict.admin.statusReviewing,
            statusShortlisted: dict.admin.statusShortlisted,
            statusRejected: dict.admin.statusRejected,
            statusOptioned: dict.admin.statusOptioned,
          }}
        />
      </div>
    </div>
  );
}
