import { useEffect, useState } from "react";
import { Brain, TrendingDown, Flame, Zap, CheckCircle2, BarChart2, Building2, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { DashboardStats, Vendor } from "../types";
import { ProgressBar, Button } from "../components/ui";

export default function Insights() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    api.dashboard().then(setStats);
    api.vendors().then(setVendors);
  }, []);

  const totalNeg = stats?.negotiation_count ?? 0;
  const successful = stats?.recent_negotiations.filter((n) => n.outcome === "successful").length ?? 0;
  const memories = stats?.memory_insight_count ?? 0;

  // Vendor intelligence summaries
  const topVendors = [...vendors].sort((a, b) => b.negotiation_count - a.negotiation_count).slice(0, 5);

  return (
    <div className="min-h-full bg-base-bg">
      {/* Header */}
      <div className="border-b border-base-border bg-base-surface px-8 py-5">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-warn">
          ✨ AI Intelligence
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-100">Insights</h1>
        <p className="mt-1 text-sm text-slate-500">
          Patterns DEALMIND has discovered across all negotiations.
        </p>
      </div>

      {!stats ? (
        <div className="flex items-center gap-2 px-8 py-12 text-sm text-slate-500">
          <Brain size={16} className="animate-ai-pulse text-memory" />
          Analyzing negotiation patterns…
        </div>
      ) : (
        <div className="px-8 py-6 space-y-6">
          {/* Intelligence summary */}
          <div className="rounded-xl border border-brand/20 bg-gradient-to-br from-brand-soft to-base-surface p-6">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
              🧠 AI Intelligence Summary
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              DEALMIND has learned from{" "}
              <span className="font-bold text-slate-200">{totalNeg} negotiations</span>
              {" "}across{" "}
              <span className="font-bold text-slate-200">{vendors.length} vendors</span>
              {" "}and has{" "}
              <span className="font-bold text-memory">{memories} experiences available</span>
              {" "}in Hindsight.
              {totalNeg > 0 && (
                <> Every future negotiation will benefit from this accumulated experience.</>
              )}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
              <InsightStat value={totalNeg} label="Negotiations" color="text-brand-hover" />
              <InsightStat value={memories} label="Memories" color="text-memory" />
              <InsightStat value={vendors.length} label="Vendors" color="text-slate-300" />
              <InsightStat value={vendors.filter((v) => v.best_tactic).length} label="Tactics Found" color="text-warn" />
            </div>
          </div>

          {/* Vendor Intelligence Cards */}
          {topVendors.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
                <Building2 size={15} className="text-brand" />
                Vendor Intelligence Profiles
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topVendors.map((v) => (
                  <VendorIntelCard key={v.id} vendor={v} />
                ))}
              </div>
            </section>
          )}

          {/* Memory Impact */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
              <Brain size={15} className="text-memory" />
              Memory-to-Strategy Pipeline
            </div>
            <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden">
              <div className="grid grid-cols-5 divide-x divide-base-border text-center">
                {[
                  { step: "1", label: "Negotiate", icon: "🤝", desc: "User enters quote" },
                  { step: "2", label: "Recall", icon: "🧠", desc: "Hindsight queried" },
                  { step: "3", label: "Analyze", icon: "📊", desc: "Patterns identified" },
                  { step: "4", label: "Strategize", icon: "✨", desc: "Brief generated" },
                  { step: "5", label: "Learn", icon: "📈", desc: "Outcome retained" },
                ].map((step) => (
                  <div key={step.step} className="p-5">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <div className="text-xs font-bold text-slate-300">{step.label}</div>
                    <div className="mt-1 text-[11px] text-slate-600">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent learnings */}
          {stats.recent_learnings.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Brain size={15} className="text-memory" />
                  Recent Hindsight Memories
                </div>
                <Link to="/memory" className="flex items-center gap-1 text-xs text-memory hover:underline">
                  Explore all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.recent_learnings.slice(0, 6).map((m) => (
                  <div key={m.id} className="rounded-xl border border-memory/15 bg-memory-soft/40 p-4">
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-memory">
                      {m.kind.replace(/_/g, " ")}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {m.content.length > 120 ? m.content.slice(0, 120) + "…" : m.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-brand/20 bg-brand-soft/30 p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">
                Ready to put memory to work?
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Start a negotiation and watch DEALMIND recall relevant experiences.
              </p>
            </div>
            <Link to="/negotiate">
              <Button>
                <Zap size={15} /> Start AI Negotiation
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-surface px-4 py-3">
      <div className={`text-xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-600">{label}</div>
    </div>
  );
}

function VendorIntelCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link to={`/vendors/${vendor.id}`}>
      <div className="rounded-xl border border-base-border bg-base-surface p-4 hover:border-brand/30 hover:shadow-card-brand transition-all">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-200">{vendor.name}</div>
            <div className="text-xs text-slate-500">{vendor.category}</div>
          </div>
          <div className="text-[11px] font-bold text-slate-500">
            {vendor.negotiation_count} deals
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <ProgressBar value={vendor.price_flexibility} tone="brand" label="Price flex" showPct />
          <ProgressBar value={vendor.delivery_reliability} tone="accent" label="Reliability" showPct />
        </div>

        {vendor.best_tactic && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <Flame size={11} className="text-warn" />
            <span className="text-slate-600">Best tactic:</span>
            <span className="font-semibold text-warn capitalize">{vendor.best_tactic.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
