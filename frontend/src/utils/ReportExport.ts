import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportOptions {
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  summary: { label: string; value: string }[];
  totalCount: number;
  mode: "List" | "Count";
}

const timestamp = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const criteriaLine = (summary: ExportOptions["summary"]) =>
  summary.length
    ? summary.map((s) => `${s.label}: ${s.value}`).join("   |   ")
    : "All records (no filters)";

const cell = (v: unknown) => (v == null || v === "" ? "" : String(v));

// ── XLSX ──────────────────────────────────────────────────────────────────
export function exportToXlsx({
  columns,
  rows,
  summary,
  totalCount,
  mode,
}: ExportOptions) {
  const aoa: (string | number)[][] = [];

  aoa.push(["Calgary Opera Archive — Report"]);
  aoa.push([criteriaLine(summary)]);
  aoa.push([]); // spacer

  if (mode === "List") {
    aoa.push(columns.map((c) => c.label));
    rows.forEach((r) => aoa.push(columns.map((c) => cell(r[c.key]))));
    aoa.push([]);
  }

  aoa.push(["Total", totalCount]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Rough auto-width based on longest cell per column.
  if (mode === "List") {
    ws["!cols"] = columns.map((c) => {
      const maxLen = Math.max(
        c.label.length,
        ...rows.map((r) => cell(r[c.key]).length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `co-archive-report-${timestamp()}.xlsx`);
}

// ── PDF ───────────────────────────────────────────────────────────────────
export function exportToPdf({
  columns,
  rows,
  summary,
  totalCount,
  mode,
}: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const marginX = 40;

  doc.setFontSize(16);
  doc.setTextColor(155, 28, 28); // #9B1C1C
  doc.text("Calgary Opera Archive — Report", marginX, 42);

  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(criteriaLine(summary), marginX, 60, {
    maxWidth: doc.internal.pageSize.getWidth() - marginX * 2,
  });

  if (mode === "List") {
    autoTable(doc, {
      startY: 78,
      head: [columns.map((c) => c.label)],
      body: rows.map((r) => columns.map((c) => cell(r[c.key]))),
      styles: { fontSize: 8, cellPadding: 4, textColor: 30 },
      headStyles: { fillColor: [155, 28, 28], textColor: 255, fontSize: 8 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: marginX, right: marginX },
    });
  }

  // Total — after the table (or just under the header in Count mode).
  const afterTableY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 78;
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(`Total: ${totalCount}`, marginX, afterTableY + 24);

  doc.save(`co-archive-report-${timestamp()}.pdf`);
}