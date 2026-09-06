// lib/queries/licences.ts
import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Count of licences inside their reminder window (or already expired) that the
 * operator has not acknowledged. The RPC is gated on is_super_admin() in SQL,
 * so a non-super_admin session always reads 0 — no row-count leak.
 */
export async function getExpiringLicenceCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('expiring_license_count');
    if (error) return 0;
    return typeof data === 'number' ? data : 0;
  } catch {
    return 0;
  }
}

/**
 * Count of unread script submissions. Gated on is_staff() in SQL, so a signed-in
 * non-staff session reads 0 rather than learning how much material is in flight.
 */
export async function getNewSubmissionCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('new_submission_count');
    if (error) return 0;
    return typeof data === 'number' ? data : 0;
  } catch {
    return 0;
  }
}

export type ExpiringLicence = {
  id: string;
  licensee_name: string | null;
  licensee_company: string | null;
  status: string;
  starts_on: string | null;
  ends_on: string;
  reminder_days: number;
  reminder_ack: boolean;
  days_left: number;
  expired: boolean;
  series_slug: string | null;
  series_title: unknown;
  movie_slug: string | null;
  movie_title: unknown;
};

export async function getExpiringLicences(): Promise<ExpiringLicence[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('expiring_licenses')
      .select('*')
      .eq('reminder_ack', false)
      .order('days_left', { ascending: true });
    if (error) return [];
    return (data ?? []) as unknown as ExpiringLicence[];
  } catch {
    return [];
  }
}
