import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { site } from "@/lib/site";

export type ReportLine = { label: string; amount: number };

export type FinancialReportData = {
  periodLabel: string; // e.g. "June 2026" / "2026" / "19 Jun 2026"
  scope: string; // "Daily statement" | "Monthly statement" | "Annual statement"
  generatedAt: Date;
  income: ReportLine[]; // fee income, other income (by category)
  expenses: ReportLine[]; // expenses by category + salaries
  totalIncome: number;
  totalExpense: number;
  net: number;
};

// Brand palette (mirrors the receipt / salary slip PDFs).
const NAVY = rgb(13 / 255, 27 / 255, 62 / 255);
const GOLD = rgb(201 / 255, 162 / 255, 39 / 255);
const IVORY = rgb(0.98, 0.97, 0.94);
const GRAY = rgb(0.45, 0.47, 0.55);
const DARK = rgb(0.15, 0.18, 0.27);
const GREEN = rgb(0.18, 0.55, 0.34);
const RED = rgb(0.7, 0.18, 0.18);

// pdf-lib standard fonts use WinAnsi encoding (no ₹ glyph) → use "Rs.".
const money = (n: number) => "Rs. " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export async function buildFinancialReportPdf(d: FinancialReportData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  draw(page, { font, bold }, d);
  return pdf.save();
}

function draw(page: PDFPage, fonts: { font: PDFFont; bold: PDFFont }, d: FinancialReportData) {
  const { font, bold } = fonts;
  const { width, height } = page.getSize();
  const M = 40;
  const right = width - M;
  let y = height - M;

  // ---- Header band -------------------------------------------------------
  const headerH = 84;
  page.drawRectangle({ x: M, y: y - headerH, width: width - 2 * M, height: headerH, color: NAVY });
  page.drawRectangle({ x: M + 16, y: y - headerH + 22, width: 40, height: 40, color: GOLD });
  page.drawText("TE", { x: M + 24, y: y - headerH + 33, size: 18, font: bold, color: NAVY });
  page.drawText(site.name, { x: M + 68, y: y - 34, size: 20, font: bold, color: IVORY });
  page.drawText(site.tagline, { x: M + 68, y: y - 52, size: 10, font, color: GOLD });
  const addr = [site.address.full, site.address.city, site.phoneDisplay];
  addr.forEach((lin_, i) => {
    const w = font.widthOfTextAtSize(lin_, 8);
    page.drawText(lin_, { x: right - 16 - w, y: y - 30 - i * 12, size: 8, font, color: IVORY });
  });
  y -= headerH;

  // ---- Doc title band ----------------------------------------------------
  const bandH = 30;
  page.drawRectangle({ x: M, y: y - bandH, width: width - 2 * M, height: bandH, color: rgb(0.97, 0.94, 0.85) });
  page.drawText("Financial Statement", { x: M + 14, y: y - 20, size: 13, font: bold, color: NAVY });
  const pW = bold.widthOfTextAtSize(d.periodLabel, 11);
  page.drawText(d.periodLabel, { x: right - 14 - pW, y: y - 20, size: 11, font: bold, color: NAVY });
  y -= bandH;
  page.drawText(d.scope, { x: M, y: y - 18, size: 9, font: bold, color: GOLD });
  y -= 40;

  // ---- Section renderer --------------------------------------------------
  const section = (heading: string, rows: ReportLine[], total: number, totalColor = DARK) => {
    page.drawText(heading, { x: M + 4, y, size: 10, font: bold, color: NAVY });
    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: right, y }, thickness: 0.8, color: rgb(0.85, 0.85, 0.9) });
    y -= 18;
    if (rows.length === 0) {
      page.drawText("—", { x: M + 14, y, size: 10, font, color: GRAY });
      y -= 20;
    }
    for (const r of rows) {
      page.drawText(r.label, { x: M + 14, y, size: 10, font, color: GRAY });
      const v = money(r.amount);
      const vW = font.widthOfTextAtSize(v, 10);
      page.drawText(v, { x: right - 14 - vW, y, size: 10, font, color: DARK });
      y -= 19;
    }
    y -= 2;
    page.drawLine({ start: { x: M + 14, y: y + 8 }, end: { x: right - 14, y: y + 8 }, thickness: 0.6, color: GRAY });
    page.drawText(`Total ${heading.toLowerCase()}`, { x: M + 14, y, size: 10, font: bold, color: NAVY });
    const tv = money(total);
    const tvW = bold.widthOfTextAtSize(tv, 11);
    page.drawText(tv, { x: right - 14 - tvW, y, size: 11, font: bold, color: totalColor });
    y -= 34;
  };

  section("Income", d.income, d.totalIncome, GREEN);
  section("Expenditure", d.expenses, d.totalExpense, RED);

  // ---- Net profit / loss box --------------------------------------------
  const boxH = 56;
  page.drawRectangle({ x: M, y: y - boxH, width: width - 2 * M, height: boxH, color: NAVY });
  const netLabel = d.net >= 0 ? "NET PROFIT" : "NET LOSS";
  page.drawText(netLabel, { x: M + 16, y: y - 22, size: 9, font: bold, color: GOLD });
  page.drawText("Income minus expenditure for the period", { x: M + 16, y: y - 40, size: 9, font, color: IVORY });
  const amtText = money(Math.abs(d.net));
  const amtW = bold.widthOfTextAtSize(amtText, 22);
  page.drawText(amtText, { x: right - 16 - amtW, y: y - 38, size: 22, font: bold, color: GOLD });
  y -= boxH + 36;

  // ---- Signature + footer ------------------------------------------------
  const sigR = "Authorised signatory";
  const sigRW = font.widthOfTextAtSize(sigR, 9);
  page.drawText(sigR, { x: right - sigRW, y, size: 9, font, color: GRAY });
  page.drawLine({ start: { x: right - 150, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.7, color: GRAY });
  page.drawText(`For ${site.name}`, { x: right - sigRW, y: y + 18, size: 8, font, color: GRAY });

  page.drawText("This is a computer-generated financial statement.", { x: M, y: M + 4, size: 8, font, color: GRAY });
  const dText = `Generated ${d.generatedAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  const dW = font.widthOfTextAtSize(dText, 8);
  page.drawText(dText, { x: right - dW, y: M + 4, size: 8, font, color: GRAY });
}
