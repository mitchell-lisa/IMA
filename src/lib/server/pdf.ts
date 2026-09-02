import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  CATEGORY_LABELS,
  CONFIDENCE_BAND_LABELS,
  EMPLOYEE_BAND_LABELS,
  NO_BENCHMARK_NOTE,
  PRICING_NOTE,
  RESULTS_DISCLAIMER,
  REVENUE_BAND_LABELS,
  SCORE_BAND_LABELS,
  getIndustry,
} from "@/lib/diagnostic";
import type { AssessmentRecord } from "./repo/types";
import { IMA_LOGO_JPG_BASE64 } from "./brandAssets";

/**
 * Standard PDF fonts only support WinAnsi. Map common typographic characters
 * to safe equivalents and strip anything else outside Latin-1.
 */
function safe(text: string): string {
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u00b7/g, "|")
    .replace(/\u2610/g, "[ ]")
    .replace(/\u2713|\u2714/g, "v")
    .replace(/[^\u0000-\u00ff]/g, "");
}

const PDF_BAND_SHORT: Record<string, string> = { strong: "Stronger practices", improve: "Improve consistency", priority: "Priority to investigate" };

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const NAVY = rgb(0, 0.2, 0.404); // IMA blue #003367
const INK = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.87, 0.9);

class Writer {
  doc: PDFDocument;
  page!: PDFPage;
  y = 0;
  font: PDFFont;
  bold: PDFFont;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const words = safe(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = w;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines;
  }

  text(text: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) {
    const size = opts.size ?? 10.5;
    const font = opts.bold ? this.bold : this.font;
    const indent = opts.indent ?? 0;
    const width = PAGE_W - MARGIN * 2 - indent;
    const lines = this.wrap(text, font, size, width);
    const lineH = size * 1.35;
    this.ensure(lineH * lines.length + (opts.gap ?? 4));
    for (const l of lines) {
      this.page.drawText(l, { x: MARGIN + indent, y: this.y - size, size, font, color: opts.color ?? INK });
      this.y -= lineH;
    }
    this.y -= opts.gap ?? 4;
  }

  heading(text: string) {
    this.ensure(30);
    this.y -= 6;
    this.text(text, { size: 13, bold: true, color: NAVY, gap: 2 });
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y }, thickness: 0.8, color: RULE });
    this.y -= 8;
  }

  bullet(text: string, prefix = "•") {
    const size = 10.5;
    const width = PAGE_W - MARGIN * 2 - 16;
    const lines = this.wrap(text, this.font, size, width);
    const lineH = size * 1.35;
    this.ensure(lineH * lines.length + 3);
    this.page.drawText(safe(prefix), { x: MARGIN, y: this.y - size, size, font: this.font, color: INK });
    for (const l of lines) {
      this.page.drawText(l, { x: MARGIN + 16, y: this.y - size, size, font: this.font, color: INK });
      this.y -= lineH;
    }
    this.y -= 3;
  }

  bar(label: string, score: number | null, band: string | null) {
    const size = 10;
    this.ensure(22);
    const labelW = 190;
    const barX = MARGIN + labelW;
    const barW = PAGE_W - MARGIN - barX - 140;
    this.page.drawText(safe(label), { x: MARGIN, y: this.y - size, size, font: this.font, color: INK });
    this.page.drawRectangle({ x: barX, y: this.y - size - 1, width: barW, height: 9, color: rgb(0.93, 0.94, 0.96) });
    if (score !== null) {
      this.page.drawRectangle({ x: barX, y: this.y - size - 1, width: Math.max(2, (barW * score) / 100), height: 9, color: NAVY });
    }
    const valueText = score === null ? "Insufficient data" : `${score}  ${band ? PDF_BAND_SHORT[band] ?? "" : ""}`;
    this.page.drawText(safe(valueText), { x: barX + barW + 8, y: this.y - size, size: 8.5, font: this.font, color: MUTED });
    this.y -= 18;
  }
}

/** Renders the prospect-facing PDF report. */
export async function renderResultsPdf(assessment: AssessmentRecord, opts: { resultsUrl: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new Writer(doc, font, bold);
  const p = assessment.profile;
  const r = assessment.result;
  const industry = getIndustry(p.industry);

  const rawBrand = process.env.NEXT_PUBLIC_BRAND_NAME?.trim();
  const brand = rawBrand === "none" ? "" : rawBrand || "IMA Financial Group";
  if (brand === "IMA Financial Group") {
    // Wordmark top-right in the header band, beside the title only (above the subtitle line).
    const logo = await doc.embedJpg(Buffer.from(IMA_LOGO_JPG_BASE64, "base64"));
    const lw = 72;
    const lh = (logo.height / logo.width) * lw;
    w.page.drawImage(logo, { x: PAGE_W - MARGIN - lw, y: PAGE_H - 30 - lh, width: lw, height: lh });
  }
  w.text("MarketReady Risk Diagnostic", { size: 20, bold: true, color: NAVY, gap: 0 });
  w.text(`${brand ? `${brand} | ` : ""}Confidential self-assessment report | For discussion purposes only`, { size: 11, color: MUTED, gap: 10 });
  w.text(`${p.companyName}`, { size: 14, bold: true, gap: 0 });
  w.text(
    `${industry.label} · ${EMPLOYEE_BAND_LABELS[p.employeeBand]} employees · ${REVENUE_BAND_LABELS[p.revenueBand]} revenue · ZIP ${p.zip}`,
    { size: 10, color: MUTED, gap: 2 },
  );
  w.text(`Completed ${new Date(assessment.completedAt ?? assessment.updatedAt).toLocaleDateString("en-US")} · ${opts.resultsUrl}`, { size: 9, color: MUTED, gap: 10 });

  if (!r) {
    w.text("This assessment has not been completed.");
    return doc.save();
  }

  w.heading("Overall readiness");
  const overallLabel = r.scores.overallBand ? SCORE_BAND_LABELS[r.scores.overallBand].label : "Insufficient data";
  w.text(`${r.scores.overall ?? "n/a"} / 100 — ${overallLabel}`, { size: 16, bold: true, gap: 2 });
  w.text(
    `${CONFIDENCE_BAND_LABELS[r.scores.confidenceBand]} (${r.scores.confidence}% of applicable questions answered). "Not sure" answers reduce confidence; they do not lower the score.`,
    { size: 9.5, color: MUTED, gap: 8 },
  );
  w.text(NO_BENCHMARK_NOTE, { size: 9, color: MUTED, gap: 8 });

  w.heading("Category scores");
  for (const c of r.scores.categories) w.bar(CATEGORY_LABELS[c.category].label, c.score, c.band);
  w.y -= 4;

  if (r.scores.criticalFlags.length) {
    w.heading("Critical control flags");
    for (const f of r.scores.criticalFlags) w.bullet(f.message, "!");
  }

  w.heading("Three areas to investigate");
  r.findings.forEach((f, i) => {
    w.text(`${i + 1}. ${f.title}`, { bold: true, gap: 1 });
    w.text(f.body, { indent: 14, size: 10, gap: 1 });
    if (f.detail) w.text(f.detail, { indent: 14, size: 10, color: MUTED, gap: 6 });
  });

  if (r.strengths.length) {
    w.heading("Underwriting-story strengths");
    for (const s of r.strengths) w.bullet(`${s.title}: ${s.body}`);
  }

  if (r.scores.consistencyNotes.length) {
    w.heading("Answers worth reconciling");
    for (const n of r.scores.consistencyNotes) w.bullet(n.message);
  }

  w.heading("Renewal timing");
  w.text(r.renewal.message, { gap: 6 });
  w.text(PRICING_NOTE, { size: 9.5, color: MUTED, gap: 6 });

  w.heading("Preparation checklist");
  for (const item of r.checklist) w.bullet(item, "☐");

  w.y -= 6;
  w.text(RESULTS_DISCLAIMER, { size: 8.5, color: MUTED });

  return doc.save();
}
