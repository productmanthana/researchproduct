import { useState } from "react";
import type { DocumentDetails } from "@workspace/api-client-react";
import { ChevronDown, IdCard } from "lucide-react";
import { cleanDetails, fieldsFor } from "@/lib/studio";

/** Optional title-page details. Collapsed by default so nontechnical users are never blocked by it. */
export function DocumentDetailsFields({ kind, value, onChange, defaultOpen, disabled, note }: {
  kind: string; value: DocumentDetails; onChange: (d: DocumentDetails) => void; defaultOpen?: boolean; disabled?: boolean; note?: string;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const filled = Object.keys(cleanDetails(value)).length;
  const fields = fieldsFor(kind);
  return (
    <div className="rounded-lg border bg-[hsl(52_40%_98%)]" data-testid="panel-document-details">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="button-toggle-details">
        <IdCard className="h-4 w-4 text-[hsl(var(--teal))]" />
        <span className="font-medium">Title-page details</span>
        <span className="text-xs text-muted-foreground">{filled ? `${filled} of ${fields.length} filled` : "optional"}</span>
        <ChevronDown className={`ml-auto h-4 w-4 opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-2 border-t px-3 pb-3 pt-2.5 sm:grid-cols-2">
          {fields.map(f => (
            <label key={f.key} className={`text-xs font-medium ${f.key === "author" || f.key === "affiliation" ? "sm:col-span-2" : ""}`}>
              {f.label}
              <input className="sx-input mt-1 text-sm font-normal" value={value[f.key] ?? ""} maxLength={f.max} disabled={disabled}
                placeholder={f.hint} onChange={e => onChange({ ...value, [f.key]: e.target.value })} data-testid={`input-detail-${f.key}`} />
            </label>
          ))}
          <p className="text-[11px] text-muted-foreground sm:col-span-2">{note ?? "Used on the title page of exported files. Leave blank to skip."}</p>
        </div>
      )}
    </div>
  );
}
