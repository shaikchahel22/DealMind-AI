import { Target, MessageSquareQuote, Brain, Wallet, TrendingDown, ShieldCheck, Flame, Zap } from "lucide-react";
import type { NegotiationBrief as Brief } from "../types";
import { ConfidenceBadge, RiskBadge } from "./ui";

export default function NegotiationBriefCard({ brief }: { brief: Brief }) {
  const discount = brief.historical_avg
    ? ((brief.quoted_price - brief.historical_avg) / brief.quoted_price * 100).toFixed(1)
    : null;

  return (
    <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden shadow-card animate-slide-up">
      {/* Header */}
      <div className="border-b border-base-border bg-gradient-to-br from-brand-soft to-transparent px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
              🧠 AI Negotiation Brief
            </div>
            <div className="text-xl font-bold text-slate-100">{brief.vendor_name}</div>
            <div className="mt-0.5 text-sm text-slate-500">
              {brief.product} · {brief.quantity.toLocaleString()} units
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-500">Current quote</div>
            <div className="text-2xl font-bold tabular-nums text-slate-100">₹{brief.quoted_price}</div>
            {discount && (
              <div className="text-xs text-accent">Potential {discount}% savings</div>
            )}
          </div>
        </div>

        {/* Memory recap */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-2.5 py-1 text-xs font-semibold text-memory">
            <Brain size={12} />
            {brief.evidence_count} {brief.evidence_count === 1 ? "memory" : "memories"} recalled
          </span>
          <ConfidenceBadge level={brief.confidence} />
          <RiskBadge level={brief.delivery_risk} />
        </div>
      </div>

      {/* Strategy grid */}
      <div className="grid grid-cols-2 gap-3 p-5">
        <StratMetric
          icon={Target}
          label="AI Target Range"
          value={`₹${brief.target_min} – ₹${brief.target_max}`}
          tone="brand"
        />
        <StratMetric
          icon={MessageSquareQuote}
          label="Opening Counter"
          value={`₹${brief.opening_counter}`}
        />
        <StratMetric
          icon={Brain}
          label="Recommended Tactic"
          value={brief.recommended_tactic.replace(/_/g, " ")}
          accent={true}
        />
        <StratMetric
          icon={Wallet}
          label="Payment Suggestion"
          value={brief.payment_terms_suggestion}
        />
      </div>

      {/* Historical context */}
      {brief.historical_avg != null && (
        <div className="flex items-center gap-3 border-t border-base-border bg-accent-soft/40 px-5 py-3">
          <TrendingDown size={15} className="shrink-0 text-accent" />
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-accent">Historical average: ₹{brief.historical_avg}</span>
            <span className="text-slate-600 mx-2">·</span>
            Range ₹{brief.historical_min}–₹{brief.historical_max}
            <span className="text-slate-600 mx-2">·</span>
            Walk-away: ₹{brief.walk_away}
          </div>
        </div>
      )}

      {/* Rationale */}
      <div className="border-t border-base-border px-5 py-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          AI Reasoning
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{brief.rationale}</p>
      </div>

      {/* Memory Impact Section */}
      <div className="border-t border-base-border px-5 py-4">
        <MemoryImpactSection brief={brief} />
      </div>

      {/* Evidence / WHY section */}
      <div className="border-t border-base-border px-5 py-4">
        <EvidenceSection brief={brief} />
      </div>
    </div>
  );
}

function StratMetric({
  icon: Icon, label, value, tone, accent
}: {
  icon: any; label: string; value: string; tone?: "brand"; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? "border-warn/20 bg-warn-soft/50" : "border-base-border bg-base-surface2"}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={12} />
        {label}
      </div>
      <div className={`text-sm font-bold capitalize ${tone === "brand" ? "text-brand-hover" : accent ? "text-warn" : "text-slate-100"}`}>
        {value}
      </div>
    </div>
  );
}

function EvidenceSection({ brief }: { brief: Brief }) {
  if (brief.evidence_count === 0) {
    return (
      <div className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-slate-600" />
        <span>
          No prior negotiations with this vendor — this is a calibrated opening estimate.
          The next negotiation will use today's outcome as evidence.
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <ShieldCheck size={12} />
        Why this recommendation — DEALMIND memory
      </div>

      {brief.tactic_evidence && (
        <div className="mb-3 rounded-lg border border-warn/20 bg-warn-soft/50 px-3 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-warn mb-1">
            <Flame size={12} />
            Tactic Evidence: {brief.recommended_tactic.replace(/_/g, " ")}
          </div>
          <div className="text-slate-400">
            Succeeded in{" "}
            <span className="font-bold text-accent">{brief.tactic_evidence.wins}</span>
            {" "}of{" "}
            <span className="font-bold text-slate-300">{brief.tactic_evidence.total}</span>
            {" "}negotiations with this vendor
            {brief.tactic_evidence.total > 0 && (
              <span className="ml-1 text-accent">
                ({Math.round(brief.tactic_evidence.rate * 100)}% success rate)
              </span>
            )}
          </div>
        </div>
      )}

      {brief.memory_snippets.length > 0 && (
        <ul className="space-y-2">
          {brief.memory_snippets.map((s, i) => (
            <li key={i} className="rounded-lg border border-memory/15 bg-memory-soft/60 px-3 py-2 text-xs leading-relaxed text-slate-400">
              <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-memory">
                <Brain size={10} />
                Memory {i + 1}
              </div>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemoryImpactSection({ brief }: { brief: Brief }) {
  const hasHistory = brief.evidence_count > 0;
  const tev = brief.tactic_evidence;

  return (
    <div className="rounded-xl border border-memory/25 bg-memory-soft/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-memory">
          <Brain size={14} />
          🧠 MEMORY IMPACT
        </div>
        <span className="rounded-full border border-memory/30 bg-memory-soft px-2.5 py-0.5 text-[10px] font-bold text-memory">
          {hasHistory ? "Experiential Context Applied" : "Baseline Mode"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-base-border bg-base-surface p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            WITHOUT MEMORY
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">Generic negotiation strategy with default assumptions.</p>
        </div>

        <div className="rounded-lg border border-memory/30 bg-memory-soft/60 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-memory mb-1.5">
            WITH HINDSIGHT
          </div>
          {hasHistory ? (
            <div className="space-y-1 text-xs text-slate-300">
              <div>• <strong className="text-memory">{brief.evidence_count}</strong> relevant experiences recalled</div>
              {tev && (
                <div>• <strong className="text-accent">{tev.wins}</strong> successful outcomes on file</div>
              )}
              {brief.historical_avg && (
                <div>• Historical avg price: <strong className="text-slate-100">₹{brief.historical_avg}</strong></div>
              )}
              <div>• Successful tactic: <strong className="text-warn capitalize">{brief.recommended_tactic.replace(/_/g, " ")}</strong></div>
              <div>• Payment pattern: <strong className="text-slate-200">{brief.payment_terms_suggestion}</strong></div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">First negotiation with vendor — establishing baseline memory.</div>
          )}
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent-soft/50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1.5">
            STRATEGY ADAPTED
          </div>
          <p className="text-slate-200 text-xs leading-relaxed">
            {hasHistory
              ? `DEALMIND adapted this strategy using previous negotiation experience with ${brief.vendor_name}.`
              : `DEALMIND will adapt future strategies once this negotiation outcome is saved.`}
          </p>
        </div>
      </div>
    </div>
  );
}
