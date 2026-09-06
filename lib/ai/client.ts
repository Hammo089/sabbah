// lib/ai/client.ts
import 'server-only';

/**
 * Minimal Anthropic Messages client over fetch — no SDK, so nothing extra is
 * bundled into the serverless function.
 *
 * The model is an environment variable on purpose: model names move, and a
 * hardcoded one turns into a 404 the day the account's roster changes.
 */
export const AI_MODEL = process.env.AI_MODEL ?? 'claude-sonnet-4-5';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type AiMessage = { role: 'user' | 'assistant'; content: string };

export class AiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export async function askAi({
  system,
  messages,
  maxTokens = 1024,
  temperature = 0.3,
  signal,
}: {
  system: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new AiError('ANTHROPIC_API_KEY is not set');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': VERSION,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AiError(`AI request failed (${res.status}): ${detail.slice(0, 400)}`, res.status);
  }

  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };

  return (json.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
}

/** Pulls the first JSON object out of a model reply, tolerating code fences. */
export function extractJson<T>(raw: string): T | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
