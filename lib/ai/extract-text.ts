// lib/ai/extract-text.ts
import 'server-only';

/**
 * Pulls readable text out of an uploaded script.
 *
 * Everything here runs on the Node runtime and is loaded lazily, so a plain
 * .txt submission never pays the cost of the PDF or DOCX parser.
 */
const MAX_CHARS = 120_000;

export type Extraction = { text: string; pages: number | null; note?: string };

export async function extractText(
  buffer: ArrayBuffer,
  mime: string,
  filename: string,
): Promise<Extraction> {
  const lower = filename.toLowerCase();

  if (mime === 'application/pdf' || lower.endsWith('.pdf')) {
    const { extractText: pdfText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text, totalPages } = await pdfText(pdf, { mergePages: true });
    return { text: clamp(String(text)), pages: totalPages };
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return { text: clamp(value), pages: null };
  }

  if (mime.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.rtf')) {
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    // Strip RTF control words so the model reads prose, not markup.
    const cleaned = lower.endsWith('.rtf')
      ? raw.replace(/\\[a-z]+-?\d*\s?/gi, ' ').replace(/[{}]/g, ' ')
      : raw;
    return { text: clamp(cleaned), pages: null };
  }

  // Legacy .doc is a binary format; we keep the file but cannot read it here.
  return { text: '', pages: null, note: 'unsupported-format' };
}

function clamp(input: string): string {
  const normalised = input.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return normalised.length > MAX_CHARS
    ? `${normalised.slice(0, MAX_CHARS)}\n\n[...truncated for length...]`
    : normalised;
}
