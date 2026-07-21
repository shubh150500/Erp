import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { site } from "@/lib/site";
import { amountInWords } from "@/lib/words";

export type SalarySlipData = {
  slipNo: string; // payment id / reference
  payeeName: string;
  payeeType: string; // "Teacher" | "Staff"
  designation: string; // subject / designation, "-" if none
  forMonth: string; // "2026-06"
  status: string; // PAID | PENDING | PARTIAL
  mode: string;
  gross: number;
  bonus: number;
  deductions: number;
  advance: number;
  net: number;
  paidAmount: number; // actually paid (== net for PAID)
  bankName: string; // "-" if none
  bankAccount: string; // "-" if none
  date: Date;
};

// Brand palette (mirrors the on-screen receipt / fee slip).
const NAVY = rgb(13 / 255, 27 / 255, 62 / 255);
const GOLD = rgb(201 / 255, 162 / 255, 39 / 255);
const IVORY = rgb(0.98, 0.97, 0.94);
const GRAY = rgb(0.45, 0.47, 0.55);
const DARK = rgb(0.15, 0.18, 0.27);
const GREEN = rgb(0.18, 0.55, 0.34);
const RED = rgb(0.7, 0.18, 0.18);

// pdf-lib standard fonts use WinAnsi encoding (no ₹ glyph) → use "Rs.".
const money = (n: number) => "Rs. " + n.toLocaleString("en-IN");

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  if (!y || !mo) return m;
  return new Date(y, mo - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export async function buildSalarySlipPdf(d: SalarySlipData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const qrPayload = [
    site.name,
    "Salary Slip",
    `Ref:${d.slipNo}`,
    `Payee:${d.payeeName}`,
    `Month:${d.forMonth}`,
    `Net:${d.net}`,
    `Status:${d.status}`,
  ].join(" | ");
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 });
  const qrPng = await pdf.embedPng(qrDataUrl);

  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  drawSlip(page, { font, bold }, qrPng, d);
  return pdf.save();
}

function drawSlip(
  page: PDFPage,
  fonts: { font: PDFFont; bold: PDFFont },
  qrPng: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  d: SalarySlipData
) {
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
  addr.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, 8);
    page.drawText(line, { x: right - 16 - w, y: y - 30 - i * 12, size: 8, font, color: IVORY });
  });
  y -= headerH;

  // ---- Doc title band ----------------------------------------------------
  const bandH = 30;
  page.drawRectangle({ x: M, y: y - bandH, width: width - 2 * M, height: bandH, color: rgb(0.97, 0.94, 0.85) });
  page.drawText("Salary Slip", { x: M + 14, y: y - 20, size: 13, font: bold, color: NAVY });
  const idText = monthLabel(d.forMonth);
  const idW = bold.widthOfTextAtSize(idText, 11);
  page.drawText(idText, { x: right - 14 - idW, y: y - 20, size: 11, font: bold, color: NAVY });
  y -= bandH;

  page.drawText(`Ref: ${d.slipNo}`, { x: M, y: y - 18, size: 9, font: bold, color: GOLD });
  y -= 34;

  // ---- Employee details (left) + QR (right) ------------------------------
  const rowX = M + 4;
  const rowGap = 38;
  const ry = y;
  const rows: [string, string][] = [
    ["EMPLOYEE", d.payeeName],
    ["ROLE", `${d.payeeType}${d.designation && d.designation !== "-" ? " · " + d.designation : ""}`],
    ["PAY MONTH", monthLabel(d.forMonth)],
    ["PAYMENT MODE", d.mode],
    ["BANK", d.bankName],
    ["ACCOUNT", d.bankAccount],
  ];
  rows.forEach(([label, value], i) => {
    const col = i % 2;
    const line = Math.floor(i / 2);
    const x = rowX + col * 250;
    const cy = ry - line * rowGap;
    page.drawText(label, { x, y: cy, size: 8, font: bold, color: GRAY });
    page.drawText(value || "-", { x, y: cy - 15, size: 12, font, color: DARK });
  });
  const qrSize = 96;
  page.drawImage(qrPng, { x: right - qrSize, y: ry - qrSize + 8, width: qrSize, height: qrSize });
  const scanW = font.widthOfTextAtSize("Scan to verify", 7);
  page.drawText("Scan to verify", { x: right - qrSize / 2 - scanW / 2, y: ry - qrSize - 6, size: 7, font, color: GRAY });

  y = ry - Math.ceil(rows.length / 2) * rowGap - 18;

  // ---- Earnings / deductions breakdown ----------------------------------
  const line = (label: string, value: number, color = DARK, isBold = false) => {
    page.drawText(label, { x: M + 14, y: y, size: 10, font: isBold ? bold : font, color: GRAY });
    const v = money(value);
    const vW = (isBold ? bold : font).widthOfTextAtSize(v, 10);
    page.drawText(v, { x: right - 14 - vW, y: y, size: 10, font: isBold ? bold : font, color });
    y -= 20;
  };

  const tableTop = y + 6;
  page.drawText("EARNINGS & DEDUCTIONS", { x: M + 14, y: y, size: 9, font: bold, color: NAVY });
  y -= 22;
  line("Gross salary", d.gross);
  line("Bonus / allowance", d.bonus, GREEN);
  line("Deductions", -d.deductions, RED);
  line("Advance adjusted", -d.advance, RED);
  // divider
  page.drawLine({ start: { x: M + 14, y: y + 6 }, end: { x: right - 14, y: y + 6 }, thickness: 0.6, color: GRAY });
  y -= 6;
  line("Net payable", d.net, NAVY, true);
  page.drawRectangle({
    x: M,
    y: y - 4,
    width: width - 2 * M,
    height: tableTop - y + 4,
    borderColor: rgb(0.85, 0.85, 0.9),
    borderWidth: 0.8,
  });
  y -= 24;

  // ---- Net pay box -------------------------------------------------------
  const boxH = 56;
  page.drawRectangle({ x: M, y: y - boxH, width: width - 2 * M, height: boxH, color: NAVY });
  const netLabel = d.status === "PARTIAL" ? "AMOUNT PAID (PARTIAL)" : "NET PAID";
  page.drawText(netLabel, { x: M + 16, y: y - 22, size: 9, font: bold, color: GOLD });
  page.drawText(amountInWords(d.paidAmount), { x: M + 16, y: y - 40, size: 9, font, color: IVORY });
  const amtText = money(d.paidAmount);
  const amtW = bold.widthOfTextAtSize(amtText, 22);
  page.drawText(amtText, { x: right - 16 - amtW, y: y - 38, size: 22, font: bold, color: GOLD });
  y -= boxH + 40;

  // ---- Signatures --------------------------------------------------------
  page.drawText("Employee's signature", { x: M, y: y, size: 9, font, color: GRAY });
  page.drawLine({ start: { x: M, y: y + 14 }, end: { x: M + 150, y: y + 14 }, thickness: 0.7, color: GRAY });
  const sigR = "Authorised signatory";
  const sigRW = font.widthOfTextAtSize(sigR, 9);
  page.drawText(sigR, { x: right - sigRW, y: y, size: 9, font, color: GRAY });
  page.drawLine({ start: { x: right - 150, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.7, color: GRAY });
  page.drawText(`For ${site.name}`, { x: right - sigRW, y: y + 18, size: 8, font, color: GRAY });

  // ---- Footer note -------------------------------------------------------
  page.drawText("This is a computer-generated salary slip.", { x: M, y: M + 4, size: 8, font, color: GRAY });
  const dText = `Issued ${d.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  const dW = font.widthOfTextAtSize(dText, 8);
  page.drawText(dText, { x: right - dW, y: M + 4, size: 8, font, color: GRAY });
}
