// app/[lang]/(auth)/login/login-form.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, LogIn } from 'lucide-react';
import { signIn, type LoginState } from './actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Locale } from '@/i18n/config';

type AuthDict = {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  submit: string;
  invalid: string;
  generic: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="gold" size="lg" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : <LogIn className="rtl:rotate-180" />}
      {label}
    </Button>
  );
}

export function LoginForm({
  lang,
  dict,
  next,
}: {
  lang: Locale;
  dict: AuthDict;
  next?: string;
}) {
  const [state, formAction] = useActionState<LoginState, FormData>(signIn, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">
          {dict.email}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="border-border bg-muted/60 text-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-muted-foreground">
          {dict.password}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="border-border bg-muted/60 text-foreground"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error === 'INVALID_CREDENTIALS' ? dict.invalid : dict.generic}
        </p>
      )}

      <SubmitButton label={dict.submit} />
    </form>
  );
}
