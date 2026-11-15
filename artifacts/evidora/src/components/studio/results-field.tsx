import { useState } from "react";
import { ChevronDown, FlaskConical } from "lucide-react";

export const RESULTS_KINDS = new Set(["journal", "thesis"]);
const MAX = 20000;

/** Optional author-supplied experiment logs and results, written up as the authors' actual data. */
export function ResultsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(value.length > 0);
  return (
    <div className="rounded-lg border border-[hsl(90_14%_86%)] bg-white/60" data-testid="results-field">
      <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]" onClick={() => setOpen(o => !o)} aria-expanded={open} data-testid="button-toggle-results">
        <FlaskConical className="h-4 w-4 text-[hsl(var(--teal))]" />
        <span className="font-medium">My results</span>
        <span className="text-xs text-muted-foreground">{value.trim() ? `${value.trim().length.toLocaleString()} characters added` : "Optional · paste experiment logs, tables or numbers"}</span>
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-1.5 px-3 pb-3">
        <textarea className="sx-input min-h-[120px] resize-y font-mono text-[12.5px] leading-relaxed" maxLength={MAX} value={value} onChange={e => onChange(e.target.value)}
          placeholder={"e.g. Model A: accuracy 91.2% (±0.4) on test set, 5 runs\nBaseline: 87.5%\nAblation without module X: 89.0%\nObservation: error rises above 40 °C"} data-testid="input-results" />
        <p className="text-xs text-muted-foreground">The Results section and charts are built from this data exactly as given. Leave it empty and results stay marked as proposed.</p>
      </div>}
    </div>
  );
}
