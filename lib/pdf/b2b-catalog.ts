// lib/pdf/b2b-catalog.ts
import 'server-only';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from 'pdf-lib';

// ---- Brand tokens -----------------------------------------------------------
const GOLD: RGB = rgb(0.792, 0.639, 0.259);
const INK: RGB = rgb(0.043, 0.043, 0.051);
const PAPER: RGB = rgb(1, 1, 1);
const MUTED: RGB = rgb(0.44, 0.43, 0.41);
const HAIRLINE: RGB = rgb(0.88, 0.87, 0.85);

const PAGE_W = 595.28; // A4 portrait
const PAGE_H = 841.89;
const MARGIN = 48;

export type CatalogTitle = {
  title: string;
  synopsis: string;
  year: number | null;
  genres: string[];
  seasons: number | null;
  episodes: number | null;
  language: string | null;
  territories: string[];
  rights: string[];
  drm: string;
  status: string;
  availableFrom: string | null;
  availableUntil: string | null;
};

export type CatalogInput = {
  generatedFor: string;
  generatedAt: Date;
  locale: string;
  titles: CatalogTitle[];
};

function sanitize(value: string): string {
  // WinAnsi-safe: standard fonts cannot encode Arabic glyphs.
  return value.replace(/[^\x20-\x7E -ÿ]/g, '').trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCover(page: PDFPage, fonts: { serif: PDFFont; sans: PDFFont; bold: PDFFont }, input: CatalogInput) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: INK });
  page.drawRectangle({ x: MARGIN, y: MARGIN, width: PAGE_W - MARGIN * 2, height: PAGE_H - MARGIN * 2, borderColor: GOLD, borderWidth: 0.75 });

  page.drawText('CEDARS ART PRODUCTION', {
    x: MARGIN + 28, y: PAGE_H - 170, size: 9, font: fonts.bold, color: GOLD, characterSpacing: 4.2,
  });

  page.drawText('SABBAH BROTHERS', {
    x: MARGIN + 28, y: PAGE_H - 188, size: 8, font: fonts.sans, color: rgb(0.62, 0.6, 0.57), characterSpacing: 3,
  });

  page.drawText('International', { x: MARGIN + 28, y: PAGE_H - 300, size: 40, font: fonts.serif, color: PAPER });
  page.drawText('Licensing Catalogue', { x: MARGIN + 28, y: PAGE_H - 348, size: 40, font: fonts.serif, color: GOLD });

  page.drawLine({
    start: { x: MARGIN + 28, y: PAGE_H - 380 },
    end: { x: MARGIN + 128, y: PAGE_H - 380 },
    thickness: 1.5,
    color: GOLD,
  });

  const meta = [
    `Prepared for   ${sanitize(input.generatedFor)}`,
    `Issued          ${input.generatedAt.toISOString().slice(0, 10)}`,
    `Titles          ${input.titles.length}`,
    'Confidential — not for redistribution',
  ];

  meta.forEach((line, i) => {
    page.drawText(line, {
      x: MARGIN + 28,
      y: 190 - i * 16,
      size: 9,
      font: fonts.sans,
      color: i === meta.length - 1 ? rgb(0.5, 0.48, 0.45) : rgb(0.78, 0.77, 0.75),
    });
  });

  page.drawText('Beirut  ·  Cairo  ·  Casablanca  ·  Dubai', {
    x: MARGIN + 28, y: MARGIN + 24, size: 8, font: fonts.sans, color: GOLD, characterSpacing: 1.6,
  });
}

function drawPageFurniture(page: PDFPage, sans: PDFFont, pageNumber: number) {
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 58 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 58 },
    thickness: 0.5,
    color: HAIRLINE,
  });
  page.drawText('CEDARS ART PRODUCTION  ·  LICENSING CATALOGUE', {
    x: MARGIN, y: PAGE_H - 50, size: 7, font: sans, color: MUTED, characterSpacing: 1.8,
  });
  page.drawText(String(pageNumber).padStart(2, '0'), {
    x: PAGE_W - MARGIN - 12, y: 32, size: 8, font: sans, color: MUTED,
  });
}

export async function buildB2BCatalogPdf(input: CatalogInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  pdf.setTitle('Cedars Art Production — International Licensing Catalogue');
  pdf.setAuthor('Cedars Art Production (Sabbah Brothers)');
  pdf.setSubject('DRM-protected series available for licensing');
  pdf.setProducer('sabbah.com');
  pdf.setCreationDate(input.generatedAt);

  const fonts = {
    serif: await pdf.embedFont(StandardFonts.TimesRoman),
    sans: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  drawCover(pdf.addPage([PAGE_W, PAGE_H]), fonts, input);

  const contentWidth = PAGE_W - MARGIN * 2;
  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let pageNumber = 2;
  let y = PAGE_H - 96;
  drawPageFurniture(page, fonts.sans, pageNumber);

  const newPage = () => {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pageNumber += 1;
    drawPageFurniture(page, fonts.sans, pageNumber);
    y = PAGE_H - 96;
  };

  for (const item of input.titles) {
    const synopsisLines = wrap(item.synopsis, fonts.sans, 9, contentWidth - 12).slice(0, 4);
    const blockHeight = 92 + synopsisLines.length * 12;

    if (y - blockHeight < 72) newPage();

    // Title
    page.drawText(sanitize(item.title) || 'Untitled', {
      x: MARGIN, y, size: 15, font: fonts.serif, color: INK,
    });

    // Year / language chip
    const chip = [item.year ?? '', (item.language ?? '').toUpperCase()].filter(Boolean).join('  ·  ');
    if (chip) {
      page.drawText(chip, {
        x: PAGE_W - MARGIN - fonts.sans.widthOfTextAtSize(chip, 8),
        y: y + 3,
        size: 8,
        font: fonts.sans,
        color: GOLD,
        characterSpacing: 1.2,
      });
    }
    y -= 16;

    // Meta line
    const metaLine = [
      item.seasons ? `${item.seasons} season${item.seasons > 1 ? 's' : ''}` : null,
      item.episodes ? `${item.episodes} episodes` : null,
      item.genres.length ? item.genres.slice(0, 3).join(', ') : null,
    ]
      .filter(Boolean)
      .join('   |   ');

    if (metaLine) {
      page.drawText(sanitize(metaLine), { x: MARGIN, y, size: 8, font: fonts.sans, color: MUTED });
      y -= 14;
    }

    // Synopsis
    for (const line of synopsisLines) {
      page.drawText(line, { x: MARGIN, y, size: 9, font: fonts.sans, color: rgb(0.24, 0.23, 0.22) });
      y -= 12;
    }
    y -= 6;

    // Rights block
    const rights = [
      `RIGHTS      ${item.rights.length ? item.rights.join(' / ').toUpperCase() : 'ON REQUEST'}`,
      `TERRITORY   ${item.territories.length ? item.territories.join(', ').toUpperCase() : 'WORLDWIDE'}`,
      `DRM         ${item.drm.toUpperCase()}   ·   STATUS  ${item.status.toUpperCase()}`,
      item.availableFrom || item.availableUntil
        ? `WINDOW      ${item.availableFrom ?? '—'}  to  ${item.availableUntil ?? 'open'}`
        : null,
    ].filter(Boolean) as string[];

    for (const line of rights) {
      page.drawText(sanitize(line), { x: MARGIN, y, size: 7.5, font: fonts.bold, color: rgb(0.32, 0.3, 0.28), characterSpacing: 0.6 });
      y -= 11;
    }

    y -= 10;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 24;
  }

  return pdf.save();
}
