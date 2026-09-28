import { ShieldCheck } from "lucide-react";
import type { NegotiationBrief } from "../types";

export default function EvidencePanel({ brief }: { brief: NegotiationBrief }) {
  if (brief.evidence_count === 0) {
    return (
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        No negotiation history with this vendor yet — this brief is a calibrated opening estimate, not proven evidence.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <ShieldCheck size={13} />
        Why this recommendation — DEALMIND memory
      </div>
      <ul className="space-y-2">
        {brief.memory_snippets.map((s, i) => (
          <li key={i} className="rounded-lg border border-base-border bg-base-surface2 px-3 py-2 text-xs leading-relaxed text-slate-400">
            {s}
          </li>
        ))}
      </ul>
      {brief.tactic_evidence && (
        <div className="mt-2 text-[11px] text-slate-600">
          '{brief.recommended_tactic.replace(/_/g, " ")}' succeeded in {brief.tactic_evidence.wins}/{brief.tactic_evidence.total} past negotiations with this vendor.
        </div>
      )}
    </div>
  );
}
