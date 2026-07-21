import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { site } from "@/lib/site";
import { amountInWords } from "@/lib/words";

export type ReceiptData = {
  docTitle: string; // "Official Fee Receipt" | "Fee Deposit Slip"
  docId: string; // receipt no or slip no
  slipNo: string;
  status: string; // PENDING | PAID | REJECTED
  studentName: string;
  rollNo: string;
  parentName: string;
  className: string;
  batch: string;
  feeType: string; // forMonth / note
  amount: number;
  mode: string;
  date: Date;
};

// Brand palette (mirrors the on-screen receipt).
const NAVY = rgb(13 / 255, 27 / 255, 62 / 255);
const GOLD = rgb(201 / 255, 162 / 255, 39 / 255);
const IVORY = rgb(0.98, 0.97, 0.94);
const GRAY = rgb(0.45, 0.47, 0.55);
const DARK = rgb(0.15, 0.18, 0.27);

// pdf-lib standard fonts use WinAnsi encoding (no ₹ glyph) → use "Rs.".
const money = (n: number) => "Rs. " + n.toLocaleString("en-IN");

export async function buildReceiptPdf(data: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // QR encodes the same verification payload as the web receipt.
  const qrPayload = [
    site.name,
    data.docTitle,
    `ID:${data.docId}`,
    `Slip:${data.slipNo}`,
    `Amt:${data.amount}`,
    `Status:${data.status}`,
  ].join(" | ");
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 });
  const qrPng = await pdf.embedPng(qrDataUrl);

  for (const copy of ["STUDENT COPY", "INSTITUTE COPY"]) {
    const page = pdf.addPage([595.28, 841.89]); // A4 portrait
    drawPage(page, { font, bold }, qrPng, data, copy);
  }

  return pdf.save();
}

function drawPage(
  page: PDFPage,
  fonts: { font: PDFFont; bold: PDFFont },
  qrPng: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  d: ReceiptData,
  copyLabel: string
) {
  const { font, bold } = fonts;
  const { width, height } = page.getSize();
  const M = 40; // margin
  const right = width - M;
  let y = height - M;

  // ---- Header band -------------------------------------------------------
  const headerH = 84;
  page.drawRectangle({ x: M, y: y - headerH, width: width - 2 * M, height: headerH, color: NAVY });

  // TE monogram
  page.drawRectangle({ x: M + 16, y: y - headerH + 22, width: 40, height: 40, color: GOLD });
  page.drawText("TE", { x: M + 24, y: y - headerH + 33, size: 18, font: bold, color: NAVY });

  page.drawText(site.name, { x: M + 68, y: y - 34, size: 20, font: bold, color: IVORY });
  page.drawText(site.tagline, { x: M + 68, y: y - 52, size: 10, font, color: GOLD });

  // Address (right-aligned)
  const addr = [site.address.full, site.address.city, site.phoneDisplay];
  addr.forEach((line, i) => {
    const size = 8;
    const w = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: right - 16 - w, y: y - 30 - i * 12, size, font, color: IVORY });
  });

  y -= headerH;

  // ---- Doc title band ----------------------------------------------------
  const bandH = 30;
  page.drawRectangle({
    x: M,
    y: y - bandH,
    width: width - 2 * M,
    height: bandH,
    color: rgb(0.97, 0.94, 0.85),
  });
  page.drawText(d.docTitle, { x: M + 14, y: y - 20, size: 13, font: bold, color: NAVY });
  const idText = `${d.docId}`;
  const idW = bold.widthOfTextAtSize(idText, 11);
  page.drawText(idText, { x: right - 14 - idW, y: y - 20, size: 11, font: bold, color: NAVY });
  y -= bandH;

  // Copy label badge
  page.drawText(copyLabel, { x: M, y: y - 18, size: 9, font: bold, color: GOLD });
  y -= 34;

  // ---- Body: detail rows (left) + QR (right) -----------------------------
  const rowX = M + 4;
  const valSize = 12;
  const labelSize = 8;
  const rowGap = 38;
  let ry = y;

  const rows: [string, string][] = [
    ["STUDENT NAME", d.studentName],
    ["PARENT / GUARDIAN", d.parentName],
    ["ROLL NO", d.rollNo],
    ["CLASS", d.className],
    ["BATCH", d.batch],
    ["FEE TYPE", d.feeType],
    ["PAYMENT MODE", d.mode],
    [
      "DATE & TIME",
      d.date.toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ],
  ];

  // Two-column detail grid (left block), keeping QR clear on the right.
  rows.forEach(([label, value], i) => {
    const col = i % 2;
    const line = Math.floor(i / 2);
    const x = rowX + col * 250;
    const cy = ry - line * rowGap;
    page.drawText(label, { x, y: cy, size: labelSize, font: bold, color: GRAY });
    page.drawText(value || "-", { x, y: cy - 15, size: valSize, font, color: DARK });
  });

  // QR (top-right of body)
  const qrSize = 96;
  page.drawImage(qrPng, { x: right - qrSize, y: ry - qrSize + 8, width: qrSize, height: qrSize });
  const scanW = font.widthOfTextAtSize("Scan to verify", 7);
  page.drawText("Scan to verify", {
    x: right - qrSize / 2 - scanW / 2,
    y: ry - qrSize - 6,
    size: 7,
    font,
    color: GRAY,
  });

  y = ry - Math.ceil(rows.length / 2) * rowGap - 18;

  // ---- Amount box --------------------------------------------------------
  const boxH = 56;
  page.drawRectangle({ x: M, y: y - boxH, width: width - 2 * M, height: boxH, color: NAVY });
  page.drawText("AMOUNT", { x: M + 16, y: y - 22, size: 9, font: bold, color: GOLD });
  page.drawText(amountInWords(d.amount), { x: M + 16, y: y - 40, size: 9, font, color: IVORY });
  const amtText = money(d.amount);
  const amtW = bold.widthOfTextAtSize(amtText, 22);
  page.drawText(amtText, { x: right - 16 - amtW, y: y - 38, size: 22, font: bold, color: GOLD });
  y -= boxH + 40;

  // ---- Signatures --------------------------------------------------------
  page.drawText("Depositor's signature", { x: M, y: y, size: 9, font, color: GRAY });
  page.drawLine({ start: { x: M, y: y + 14 }, end: { x: M + 150, y: y + 14 }, thickness: 0.7, color: GRAY });

  const sigR = "Authorised signatory";
  const sigRW = font.widthOfTextAtSize(sigR, 9);
  page.drawText(sigR, { x: right - sigRW, y: y, size: 9, font, color: GRAY });
  page.drawLine({ start: { x: right - 150, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 0.7, color: GRAY });
  page.drawText(`For ${site.name}`, { x: right - sigRW, y: y + 18, size: 8, font, color: GRAY });

  // ---- Footer note -------------------------------------------------------
  const note =
    d.status === "PAID"
      ? "This is a computer-generated official receipt."
      : "Deposit this slip with payment at the office. Valid after verification.";
  page.drawText(note, { x: M, y: M + 4, size: 8, font, color: GRAY });
}
