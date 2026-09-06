// lib/ai/read-script.ts
import 'server-only';
import { askAi, extractJson, AI_MODEL } from './client';

export type ScriptReading = {
  summary: string;
  genre: string;
  themes: string[];
  audience: string;
  comparables: string;
  strength: string;
  risk: string;
  score: number;
  model: string;
};

const SYSTEM = `You are the senior reader at Cedars Art Production (Sabbah Brothers), a Beirut
production and distribution house working in Arabic drama, film and formats since the 1950s.

You receive an unsolicited submission and write the internal coverage note the
head of development will read. Be a professional reader: specific, unsentimental,
and useful. Never flatter, never pad, and never invent material that is not in
the text — if the material is too thin to judge, say exactly that.

Reply with ONLY a JSON object, no prose around it, using these keys:
{
  "summary":     "6-10 sentences. What actually happens, the shape of the story, the world, the main characters and the ending if given. Written in the language of the submission.",
  "genre":       "one short genre label",
  "themes":      ["3 to 6 short theme labels"],
  "audience":    "one sentence on who this is for and which window or platform it suits",
  "comparables": "two or three comparable titles, Arabic where possible",
  "strength":    "the single strongest thing about it, one or two sentences",
  "risk":        "the single biggest production, legal or market risk, one or two sentences",
  "score":       0
}

"score" is 0-100 for production potential for this company. Be honest and use the
full range: 30 is weak, 55 is competent but unremarkable, 75 is worth a meeting,
90+ is exceptional. Write "summary" in the same language as the submitted text.`;

export async function readScript({
  title,
  kind,
  logline,
  body,
  signal,
}: {
  title: string;
  kind: string;
  logline: string;
  body: string;
  signal?: AbortSignal;
}): Promise<ScriptReading> {
  const material = body.trim();

  const prompt = [
    `TITLE: ${title}`,
    `TYPE: ${kind}`,
    `LOGLINE: ${logline}`,
    '',
    'SUBMITTED MATERIAL:',
    material.length > 0 ? material : '(no file text — judge from the logline alone and say so)',
  ].join('\n');

  const raw = await askAi({
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2000,
    temperature: 0.2,
    signal,
  });

  const parsed = extractJson<Partial<ScriptReading>>(raw);

  if (!parsed?.summary) {
    // The model answered, just not as JSON — keep the prose rather than lose it.
    return {
      summary: raw.slice(0, 4000),
      genre: '',
      themes: [],
      audience: '',
      comparables: '',
      strength: '',
      risk: '',
      score: 0,
      model: AI_MODEL,
    };
  }

  const score = Number(parsed.score);

  return {
    summary: String(parsed.summary).slice(0, 6000),
    genre: String(parsed.genre ?? '').slice(0, 80),
    themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 8).map((t) => String(t).slice(0, 60)) : [],
    audience: String(parsed.audience ?? '').slice(0, 500),
    comparables: String(parsed.comparables ?? '').slice(0, 300),
    strength: String(parsed.strength ?? '').slice(0, 600),
    risk: String(parsed.risk ?? '').slice(0, 600),
    score: Number.isFinite(score) ? Math.min(Math.max(Math.round(score), 0), 100) : 0,
    model: AI_MODEL,
  };
}
