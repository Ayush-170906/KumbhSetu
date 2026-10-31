"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { CSV_TEMPLATE, parseVolunteerCsv, type ParsedVolunteerRow, type CsvRowError } from "@/lib/volunteerOps";
import { Field, VmsBanner } from "./vmsUi";

export function VmsBulk() {
  const store = useAppStore();
  const [selectedNgoId, setSelectedNgoId] = useState(store.ngos[0]?.id || "");
  const [fileName, setFileName] = useState<string | null>(null);

  const [parsedRows, setParsedRows] = useState<ParsedVolunteerRow[]>([]);
  const [errors, setErrors] = useState<CsvRowError[]>([]);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kumbh-volunteer-bulk-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseVolunteerCsv(text, store.volunteers, selectedNgoId);
      setParsedRows(res.rows);
      setErrors(res.errors);
    };
    reader.readAsText(file);
  }

  function executeImport() {
    if (parsedRows.length === 0) return;
    const inputs = parsedRows.map((r) => r.input);
    const res = store.bulkImportVolunteers(inputs);
    setImportSummary({ imported: res.created.length, skipped: res.skipped.length });
    setParsedRows([]);
    setFileName(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Batch Ingestion</p>
          <h1 className="font-editorial text-2xl text-ink">Bulk Volunteer Registration</h1>
          <p className="text-xs text-ink-muted">
            Upload CSV rosters submitted by verified partner NGOs or municipal ward offices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Icon name="log" className="mr-1.5 h-3.5 w-3.5" />
          Download CSV Template
        </Button>
      </div>

      <VmsBanner />

      {importSummary && (
        <div className="rounded-sm border border-status-green-border bg-status-green-bg p-4 text-xs text-status-green space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <Icon name="check" className="h-4 w-4" />
            <span>Bulk Import Completed Successfully!</span>
          </div>
          <p>
            Successfully imported <strong className="font-mono-num">{importSummary.imported}</strong> new volunteers into the roster.
            {importSummary.skipped > 0 && ` (${importSummary.skipped} duplicates/invalid rows skipped).`}
          </p>
        </div>
      )}

      {/* Upload Box */}
      <div className="border border-border bg-surface p-5 shadow-card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target NGO Association" hint="Defaults all imported volunteers to this accredited NGO">
            <select
              value={selectedNgoId}
              onChange={(e) => setSelectedNgoId(e.target.value)}
              className="h-10 w-full border border-border bg-surface px-3 text-xs text-ink"
            >
              {store.ngos.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name} ({ngo.status.toUpperCase()})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Upload CSV File" hint="UTF-8 formatted CSV with required fullName header">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="h-10 w-full border border-border bg-surface p-1.5 text-xs text-ink"
            />
          </Field>
        </div>

        {fileName && (
          <div className="flex items-center justify-between rounded bg-surface-muted px-3 py-2 text-xs text-ink">
            <span>
              Selected file: <strong>{fileName}</strong>
            </span>
            <span className="font-mono-num text-[11px] text-ink-soft">
              {parsedRows.length} valid rows · {errors.length} errors
            </span>
          </div>
        )}
      </div>

      {/* Error Report */}
      {errors.length > 0 && (
        <div className="rounded-sm border border-status-red-border bg-status-red-bg p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-status-red">
            <Icon name="warning" className="h-4 w-4" />
            <span>Row-Level Validation Errors Detected ({errors.length})</span>
          </div>
          <ul className="max-h-40 overflow-y-auto space-y-1 text-xs text-status-red divide-y divide-status-red-border/40">
            {errors.map((err, i) => (
              <li key={i} className="pt-1">
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Import Preview Table */}
      {parsedRows.length > 0 && (
        <div className="border border-border bg-surface shadow-card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-ink">
              Import Preview ({parsedRows.length} Volunteers)
            </h3>
            <Button variant="primary" size="sm" onClick={executeImport}>
              Confirm & Ingest {parsedRows.length} Volunteers
            </Button>
          </div>

          <div className="max-h-72 overflow-x-auto overflow-y-auto border border-border text-xs">
            <table className="w-full text-left">
              <thead className="bg-surface-muted text-ink-soft uppercase text-[10px] font-semibold sticky top-0">
                <tr>
                  <th className="p-2">Row</th>
                  <th className="p-2">Full Name</th>
                  <th className="p-2">Mobile</th>
                  <th className="p-2">YOB</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Skills</th>
                  <th className="p-2">Duplicate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsedRows.map((r) => (
                  <tr key={r.row} className="hover:bg-surface-muted/40">
                    <td className="p-2 font-mono-num">{r.row}</td>
                    <td className="p-2 font-medium text-ink">{r.input.name}</td>
                    <td className="p-2 font-mono-num">{r.input.phone || "—"}</td>
                    <td className="p-2 font-mono-num">{r.input.yearOfBirth || "—"}</td>
                    <td className="p-2 capitalize">{r.input.category.replace("_", " ")}</td>
                    <td className="p-2">{r.input.skills.join(", ")}</td>
                    <td className="p-2">
                      {r.duplicateOf ? (
                        <span className="rounded bg-status-amber-bg border border-status-amber-border px-1.5 py-0.5 text-[10px] text-status-amber font-semibold">
                          Duplicate of {r.duplicateOf}
                        </span>
                      ) : (
                        <span className="rounded bg-status-green-bg border border-status-green-border px-1.5 py-0.5 text-[10px] text-status-green">
                          New
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
