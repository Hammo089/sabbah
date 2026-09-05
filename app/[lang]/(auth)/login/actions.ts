// app/[lang]/(auth)/login/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isLocale, i18n } from '@/i18n/config';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  lang: z.string(),
  next: z.string().optional(),
});

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    lang: formData.get('lang'),
    next: formData.get('next') || undefined,
  });

  if (!parsed.success) return { error: 'INVALID_INPUT' };

  const lang = isLocale(parsed.data.lang) ? parsed.data.lang : i18n.defaultLocale;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Never leak which half was wrong — that turns the form into an account oracle.
  if (error) return { error: 'INVALID_CREDENTIALS' };

  revalidatePath('/', 'layout');

  const target = parsed.data.next?.startsWith(`/${lang}`) ? parsed.data.next : `/${lang}/admin`;
  redirect(target);
}

export async function signOut(lang: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(`/${isLocale(lang) ? lang : i18n.defaultLocale}/login`);
}
