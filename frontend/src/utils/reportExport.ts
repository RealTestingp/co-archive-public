/* reportExport.ts
   Turns a finished report into a downloadable file, either Excel or PDF.

   Both exports are generated in the browser rather than on the server. That
   means no round trip and no server work per export, and the file appears
   instantly. The tradeoff is that layout control is weaker than server side
   rendering would give, and a very large report is limited by browser memory.

   Both formats are built from the same ExportOptions, so the two files always
   contain the same data. Only the presentation differs.
*/
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportOptions {
  /** Column order and headings. Drives both exports, so they cannot disagree. */
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  /** The filters that produced this report, printed at the top of the file so
      the export is self describing once it leaves the app. */
  summary: { label: string; value: string }[];
  totalCount: number;
  /** List prints every row. Count prints only the total, no table. */
  mode: "List" | "Count";
}

// ISO slice gives YYYY-MM-DD, which sorts correctly in a file listing.
const timestamp = () => new Date().toISOString().slice(0, 10);

/* One line describing what was filtered. Says so explicitly when nothing was,
   so a reader can tell "no filters" apart from "the filters were not recorded". */
const criteriaLine = (summary: ExportOptions["summary"]) =>
  summary.length
    ? summary.map((s) => `${s.label}: ${s.value}`).join("   |   ")
    : "All records (no filters)";

/* Normalises a value for output. null, undefined and empty all become an empty
   string, so the file never shows the word "null" in a cell. */
const cell = (v: unknown) => (v == null || v === "" ? "" : String(v));

/* ── XLSX ────────────────────────────────────────────────────────────────────
   Built as an array of arrays, which is SheetJS's simplest input: one inner
   array per row, so the sheet is assembled top to bottom in reading order. */
export function exportToXlsx({
  columns,
  rows,
  summary,
  totalCount,
  mode,
}: ExportOptions) {
  const aoa: (string | number)[][] = [];

  // Title block, then a blank row so the header row is visually separate.
  aoa.push(["Calgary Opera Archive — Report"]);
  aoa.push([criteriaLine(summary)]);
  aoa.push([]);

  // Count mode skips the table entirely and just reports the number.
  if (mode === "List") {
    aoa.push(columns.map((c) => c.label));
    rows.forEach((r) => aoa.push(columns.map((c) => cell(r[c.key]))));
    aoa.push([]);
  }

  aoa.push(["Total", totalCount]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  /* Column widths. Excel has no auto fit on generated files, so without this
     every column comes out the default width and long values render as ####.
     Measures the longest value in each column, adds padding, then clamps
     between 10 and 40 characters so one long cell cannot blow out the sheet. */
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
  // writeFile triggers the browser download directly, no server involved.
  XLSX.writeFile(wb, `co-archive-report-${timestamp()}.xlsx`);
}

/* ── PDF ─────────────────────────────────────────────────────────────────────
   Landscape because reports are wide, and points as the unit because that is
   what jsPDF's text positioning expects, so no conversion is needed. */
export function exportToPdf({
  columns,
  rows,
  summary,
  totalCount,
  mode,
}: ExportOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  const marginX = 40;

  // Title, in the Calgary Opera red used throughout the app.
  doc.setFontSize(16);
  doc.setTextColor(155, 28, 28); // #9B1C1C
  doc.text("Calgary Opera Archive — Report", marginX, 42);

  /* Filter line. maxWidth makes jsPDF wrap it rather than running off the page,
     which it will happily do otherwise. */
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(criteriaLine(summary), marginX, 60, {
    maxWidth: doc.internal.pageSize.getWidth() - marginX * 2,
  });

  /* autoTable handles pagination, so a report longer than one page breaks
     across pages and repeats the header row automatically. Doing that by hand
     is the main reason for the plugin. */
  if (mode === "List") {
    autoTable(doc, {
      startY: 78,
      head: [columns.map((c) => c.label)],
      body: rows.map((r) => columns.map((c) => cell(r[c.key]))),
      styles: { fontSize: 8, cellPadding: 4, textColor: 30 },
      headStyles: { fillColor: [155, 28, 28], textColor: 255, fontSize: 8 },
      // Banded rows, so a wide table stays readable across the page.
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: marginX, right: marginX },
    });
  }

  /* The total goes below the table, so we need to know where the table ended.
     autoTable records that on the doc as lastAutoTable.finalY, but it is added
     at runtime and is not in jsPDF's types, hence the cast. The ?? 78 fallback
     covers Count mode, where no table was drawn and the property is absent. */
  const afterTableY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 78;
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(`Total: ${totalCount}`, marginX, afterTableY + 24);

  // save() triggers the download in the browser.
  doc.save(`co-archive-report-${timestamp()}.pdf`);
}