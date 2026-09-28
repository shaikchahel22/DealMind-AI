import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Brain, Zap, ArrowLeft, TrendingDown, CheckCircle2, Flame, Clock, ArrowRight, Building2 } from "lucide-react";
import { api } from "../services/api";
import type { Vendor, Negotiation, MemoryRecordOut } from "../types";
import { Button, OutcomeBadge, EmptyState, ProgressBar } from "../components/ui";
import MemoryCard from "../components/MemoryCard";

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendorId = Number(id);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [memory, setMemory] = useState<MemoryRecordOut[]>([]);

  useEffect(() => {
    api.vendor(vendorId).then(setVendor);
    api.negotiations(vendorId).then(setNegotiations);
    api.memory({ vendor_id: vendorId, limit: 20 }).then(setMemory);
  }, [vendorId]);

  if (!vendor) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Brain size={16} className="animate-ai-pulse text-memory" />
        Loading vendor intelligence…
      </div>
    </div>
  );

  const closed = negotiations.filter((n) => n.final_price != null);
  const successful = negotiations.filter((n) => n.outcome === "successful");
  const avgFinal = closed.length
    ? (closed.reduce((s, n) => s + (n.final_price || 0), 0) / closed.length)
    : null;
  const avgDiscount = closed.length && negotiations.length
    ? closed.reduce((s, n) => s + ((n.initial_price - (n.final_price || 0)) / n.initial_price), 0) / closed.length * 100
    : null;

  // Tactic performance from negotiations
  const tacticPerf: Record<string, { wins: number; total: number }> = {};
  negotiations.forEach((n) => {
    const t = n.tactic || "unknown";
    if (!tacticPerf[t]) tacticPerf[t] = { wins: 0, total: 0 };
    tacticPerf[t].total++;
    if (n.outcome === "successful") tacticPerf[t].wins++;
  });

  return (
    <div className="min-h-full bg-base-bg">
      {/* Header */}
      <div className="relative border-b border-base-border bg-base-surface overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hero-gradient opacity-50" />
        <div className="relative px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft size={14} />
              </Button>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
                  🧠 DEALMIND KNOWS THIS VENDOR
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">{vendor.name}</h1>
                <p className="mt-0.5 text-sm text-slate-500">{vendor.category}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {vendor.best_tactic && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-[11px] font-semibold text-warn">
                      <Flame size={11} />
                      Best tactic: {vendor.best_tactic.replace(/_/g, " ")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-2.5 py-1 text-[11px] font-semibold text-memory">
                    <Brain size={11} />
                    {memory.length} memories in Hindsight
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate(`/negotiate?vendor_id=${vendor.id}`)}>
              <Zap size={15} /> Start AI Negotiation
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 px-8 py-5 md:grid-cols-4">
        <VendorStat label="Total Negotiations" value={vendor.negotiation_count} icon="📊" />
        <VendorStat label="Successful" value={successful.length} icon="✓" color="text-accent" />
        <VendorStat
          label="Avg Final Price"
          value={avgFinal ? `₹${avgFinal.toFixed(0)}` : "—"}
          icon="₹"
          color="text-brand-hover"
        />
        <VendorStat
          label="Avg Discount"
          value={avgDiscount ? `${avgDiscount.toFixed(1)}%` : "—"}
          icon="↓"
          color="text-accent"
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-3">
        {/* Left: Profile + Tactics */}
        <div className="space-y-4 lg:col-span-1">
          {/* AI Vendor Profile */}
          <div className="rounded-xl border border-base-border bg-base-surface p-5">
            <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              AI Vendor Profile
            </div>

            <div className="space-y-3">
              <ProfileMetric
                label="Price Flexibility"
                value={vendor.price_flexibility}
                tone="brand"
              />
              <ProfileMetric
                label="Payment Flexibility"
                value={vendor.payment_flexibility}
                tone="brand"
              />
              <ProfileMetric
                label="Volume Sensitivity"
                value={vendor.volume_sensitivity}
                tone="warn"
              />
              <ProfileMetric
                label="Delivery Reliability"
                value={vendor.delivery_reliability}
                tone="accent"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-base-border bg-base-surface2 p-2.5 text-center">
                <div className="text-slate-500 mb-0.5">Quality</div>
                <div className="font-bold text-slate-200">{vendor.quality_score.toFixed(1)} / 5</div>
              </div>
              <div className="rounded-lg border border-accent/20 bg-accent-soft p-2.5 text-center">
                <div className="text-slate-500 mb-0.5">Reliability</div>
                <div className="font-bold text-accent">{Math.round(vendor.delivery_reliability * 100)}%</div>
              </div>
            </div>
          </div>

          {/* Tactic Performance */}
          {Object.keys(tacticPerf).length > 0 && (
            <div className="rounded-xl border border-base-border bg-base-surface p-5">
              <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Tactic Performance
              </div>
              <div className="space-y-3">
                {Object.entries(tacticPerf)
                  .filter(([k]) => k !== "unknown")
                  .sort((a, b) => b[1].wins / Math.max(b[1].total, 1) - a[1].wins / Math.max(a[1].total, 1))
                  .map(([tactic, { wins, total }]) => {
                    const rate = total > 0 ? wins / total : 0;
                    const tone = rate >= 0.7 ? "accent" : rate >= 0.4 ? "warn" : "danger";
                    return (
                      <div key={tactic}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="capitalize text-slate-400">{tactic.replace(/_/g, " ")}</span>
                          <span className={`font-bold ${tone === "accent" ? "text-accent" : tone === "warn" ? "text-warn" : "text-danger"}`}>
                            {wins}/{total} wins
                          </span>
                        </div>
                        <ProgressBar value={rate} tone={tone} />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* What DEALMIND has learned */}
          {memory.length > 0 && (
            <div className="rounded-xl border border-memory/20 bg-memory-soft p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-memory">
                <Brain size={12} /> What DEALMIND Has Learned
              </div>
              <ul className="space-y-2">
                {memory.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="mt-0.5 text-memory">🧠</span>
                    <span className="leading-relaxed">
                      {m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: History + Full Memories */}
        <div className="space-y-6 lg:col-span-2">
          {/* Negotiation Timeline */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
              <Clock size={15} className="text-brand" />
              Negotiation History
            </div>
            {negotiations.length === 0 ? (
              <EmptyState title="No negotiations yet" icon={<Zap size={32} />} />
            ) : (
              <div className="space-y-2">
                {negotiations.map((n) => (
                  <NegotiationHistoryRow key={n.id} n={n} />
                ))}
              </div>
            )}
          </section>

          {/* Memory cards */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
              <Brain size={15} className="text-memory" />
              Hindsight Memory
            </div>
            {memory.length === 0 ? (
              <EmptyState
                title="No memories yet"
                subtitle="Close a negotiation with this vendor to build history."
                icon={<Brain size={32} />}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {memory.map((m) => (
                  <MemoryCard key={m.id} record={m} />
                ))}
              </div>
            )}
          </section>

          {/* Learning Timeline */}
          {negotiations.filter((n) => n.outcome !== "in_progress").length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
                <Zap size={15} className="text-accent" />
                Learning Timeline
              </div>
              <LearningTimeline negotiations={negotiations.filter((n) => n.outcome !== "in_progress")} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function VendorStat({ label, value, icon, color = "text-slate-100" }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface px-4 py-3">
      <div className="text-[11px] text-slate-600">{label}</div>
      <div className={`mt-1 text-xl font-black tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ProfileMetric({ label, value, tone }: { label: string; value: number; tone: "brand" | "warn" | "accent" | "danger" }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-400">{Math.round(value * 100)}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}

function NegotiationHistoryRow({ n }: { n: Negotiation }) {
  const saved = n.final_price && n.initial_price
    ? ((n.initial_price - n.final_price) / n.initial_price * 100).toFixed(1)
    : null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-base-border bg-base-surface px-4 py-3 hover:border-base-border-light transition-colors">
      <div>
        <div className="text-sm font-semibold text-slate-200">{n.product}</div>
        <div className="text-xs text-slate-500">
          {n.quantity.toLocaleString()} units
          {n.tactic && (
            <span className="ml-2 text-warn">· {n.tactic.replace(/_/g, " ")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600 line-through">₹{n.initial_price}</span>
            <ArrowRight size={10} className="text-slate-700" />
            <span className="text-sm font-bold text-slate-200">
              {n.final_price ? `₹${n.final_price}` : "—"}
            </span>
          </div>
          {saved && n.outcome === "successful" && (
            <div className="text-[11px] text-accent text-right">−{saved}%</div>
          )}
        </div>
        <OutcomeBadge outcome={n.outcome} />
      </div>
    </div>
  );
}

function LearningTimeline({ negotiations }: { negotiations: Negotiation[] }) {
  return (
    <div className="space-y-3">
      {negotiations.slice(0, 5).map((n, i) => {
        const isSuccess = n.outcome === "successful";
        return (
          <div key={n.id} className={`relative rounded-xl border p-4 ${isSuccess ? "border-accent/20 bg-accent-soft/30" : "border-danger/20 bg-danger-soft/30"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSuccess ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"}`}>
                {isSuccess ? <CheckCircle2 size={16} /> : <span className="text-sm">✕</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-200">{n.product}</div>
                  <OutcomeBadge outcome={n.outcome} />
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {n.initial_price && n.final_price ? (
                    <>₹{n.initial_price} → ₹{n.final_price}</>
                  ) : (
                    `₹${n.initial_price} quoted`
                  )}
                  {n.tactic && <span className="ml-2 text-warn">· {n.tactic.replace(/_/g, " ")}</span>}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                  <Brain size={10} className="text-memory" />
                  <span className="text-slate-600">
                    {isSuccess
                      ? `Retained: ${n.tactic?.replace(/_/g, " ") || "outcome"} → success`
                      : "Retained as negative experience"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
