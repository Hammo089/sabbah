'use client';

// components/site/assistant-chat.tsx — CLIENT COMPONENT
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

export type AssistantDict = {
  title: string; subtitle: string; open: string; placeholder: string; send: string;
  thinking: string; greeting: string; error: string; disclaimer: string;
  suggest1: string; suggest2: string; suggest3: string; clear: string;
};

type Message = { role: 'user' | 'assistant'; content: string };

export function AssistantChat({
  lang,
  dict,
  variant = 'floating',
}: {
  lang: Locale;
  dict: AssistantDict;
  /** `inline` renders the panel in the page flow; `floating` is a corner bubble. */
  variant?: 'floating' | 'inline';
}) {
  const [open, setOpen] = React.useState(variant === 'inline');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [draft, setDraft] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname();

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const send = React.useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || pending) return;

      const next: Message[] = [...messages, { role: 'user', content: question }];
      setMessages(next);
      setDraft('');
      setPending(true);
      setFailed(false);

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lang, messages: next.slice(-12) }),
        });

        if (!res.ok) throw new Error(`status-${res.status}`);

        const json = (await res.json()) as { reply: string };
        setMessages((prev) => [...prev, { role: 'assistant', content: json.reply }]);
      } catch {
        setFailed(true);
      } finally {
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [lang, messages, pending],
  );

  const suggestions = [dict.suggest1, dict.suggest2, dict.suggest3];

  const panel = (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-card',
        variant === 'floating' ? 'h-[min(70dvh,560px)] w-[min(92vw,400px)] shadow-2xl' : 'h-[560px] w-full',
      )}
    >
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12">
          <Sparkles className="size-4 text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{dict.title}</p>
          <p className="truncate text-xs text-muted-foreground">{dict.subtitle}</p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setFailed(false);
            }}
            className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary"
          >
            {dict.clear}
          </button>
        )}

        {variant === 'floating' && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="flex gap-3">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">{dict.greeting}</p>
        </div>

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed',
              message.role === 'user'
                ? 'ms-auto bg-primary/12 text-foreground'
                : 'bg-muted/60 text-foreground',
            )}
          >
            {message.content.split('\n').map((line, j) => (
              <p key={j} className={j > 0 ? 'mt-2' : undefined}>
                {line}
              </p>
            ))}
          </div>
        ))}

        {pending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            {dict.thinking}
          </p>
        )}

        {failed && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {dict.error}
          </p>
        )}

        {messages.length === 0 && !pending && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={dict.placeholder}
          maxLength={2000}
          className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          aria-label={dict.send}
          className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-35"
        >
          <Send className="size-4 rtl-flip" />
        </button>
      </form>

      <p className="border-t border-border px-5 py-2.5 text-[0.65rem] text-muted-foreground/70">
        {dict.disclaimer}
      </p>
    </div>
  );

  if (variant === 'inline') return panel;

  // /submit already renders the panel inline — never show two of them.
  if (pathname?.endsWith('/submit')) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 end-5 z-[120]"
            style={{ paddingInlineEnd: 'env(safe-area-inset-right)' }}
          >
            {panel}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.open}
        className={cn(
          'fixed bottom-6 end-5 z-[120] grid size-14 place-items-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </>
  );
}
