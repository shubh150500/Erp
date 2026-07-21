import * as XLSX from "xlsx";

export type Sheet = {
  name: string; // tab name (max 31 chars; Excel limit)
  rows: Record<string, string | number>[];
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Build an .xlsx workbook from one or more sheets and return it as a
 * downloadable Response (attachment). Used by the export route handlers.
 */
export function xlsxResponse(filename: string, sheets: Sheet[]): Response {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
