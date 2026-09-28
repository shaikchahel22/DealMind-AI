import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, Zap, ArrowRight, Database, CheckCircle2, XCircle,
  TrendingDown, Sparkles, Activity, Building2, Clock, Clapperboard,
} from "lucide-react";
import { api } from "../services/api";
import type { DashboardStats } from "../types";
import { Button, OutcomeBadge, EmptyState } from "../components/ui";
import MemoryCard from "../components/MemoryCard";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Awaited<ReturnType<typeof api.integrationsStatus>> | null>(null);

  useEffect(() => {
    api.dashboard().then(setStats).catch((e) => setError(String(e)));
    api.integrationsStatus().then(setIntegrations).catch(() => setIntegrations(null));
  }, []);

  if (error) return <ApiError error={error} />;
  if (!stats) return <DashboardSkeleton />;

  const successfulNeg = stats.recent_negotiations.filter((n) => n.outcome === "successful");

  return (
    <div className="min-h-full bg-base-bg">
      {/* ── Hero Section ── */}
      <div className="relative border-b border-base-border bg-base-surface overflow-hidden">
        {/* Background radial glow */}
        <div className="pointer-events-none absolute inset-0 hero-gradient" />
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />

        <div className="relative px-8 py-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-hover">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-ai-pulse" />
              AI Procurement Intelligence
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-100 max-w-xl">
            Your procurement intelligence,
            <span className="gradient-text-brand"> with a memory.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            DEALMIND learns from every negotiation and uses past outcomes to guide the next one.
            Every closed deal makes the next strategy smarter.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/negotiate">
              <Button size="lg">
                <Zap size={16} /> Start AI Negotiation
              </Button>
            </Link>
            <Link to="/memory">
              <Button variant="secondary" size="lg">
                <Brain size={16} /> Explore Memory
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary" size="lg" className="border-warn/30 text-warn hover:bg-warn-soft/30">
                <Clapperboard size={16} /> Demo Mode
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {integrations && (
        <div className="mx-8 mb-6 rounded-xl border border-base-border bg-base-surface px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Intelligence Status</div>
            <span className={"text-[10px] font-bold uppercase " + (integrations.overall === "ok" ? "text-accent" : "text-warn")}>
              {integrations.overall === "ok" ? "Healthy" : "Check configuration"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <StatusPill label="Memory" value={integrations.hindsight.mode === "hindsight-cloud" && integrations.hindsight.active ? "Hindsight Cloud" : "Local SQLite"} />
            <StatusPill label="Language" value={integrations.llm.active ? "Groq · " + integrations.llm.model : "Deterministic rules/templates"} />
            <StatusPill label="Database" value={integrations.database.status === "connected" ? "SQLite connected" : "Database error"} />
          </div>
        </div>
      )}

      {/* ── Intelligence Metrics ── */}
      <div className="grid grid-cols-2 gap-3 px-8 py-6 md:grid-cols-4">
        <IntelligenceMetric
          icon={<Brain size={15} />}
          label="Memories Retained"
          value={stats.memory_insight_count}
          tone="memory"
          sub="via Hindsight"
        />
        <IntelligenceMetric
          icon={<Activity size={15} />}
          label="Negotiations Learned"
          value={stats.negotiation_count}
          tone="brand"
          sub={`${stats.active_negotiations} active`}
        />
        <IntelligenceMetric
          icon={<Building2 size={15} />}
          label="Vendors Tracked"
          value={stats.vendor_count}
          tone="default"
          sub="with memory profiles"
        />
        <IntelligenceMetric
          icon={<CheckCircle2 size={15} />}
          label="Outcomes Stored"
          value={stats.successful_negotiation_count}
          tone="accent"
          sub={stats.success_rate + "% success rate"}
        />
      </div>

      {/* ── Intelligence Loop Visual ── */}
      <div className="px-8 pb-4">
        <IntelligenceLoop />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-2">
        {/* Recent Negotiations */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Activity size={15} className="text-brand" />
              Recent Negotiations
            </h2>
            <Link
              to="/vendors"
              className="flex items-center gap-1 text-xs text-brand-hover hover:underline"
            >
              View vendors <ArrowRight size={12} />
            </Link>
          </div>

          {stats.recent_negotiations.length === 0 ? (
            <EmptyState
              title="No negotiations yet"
              subtitle="Start your first negotiation to see it here."
              icon={<Zap size={32} />}
            />
          ) : (
            <div className="space-y-2">
              {stats.recent_negotiations.map((n) => (
                <NegotiationRow key={n.id} n={n} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Memory / Learning */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
              <Brain size={15} className="text-memory" />
              Recent AI Learning
            </h2>
            <Link
              to="/memory"
              className="flex items-center gap-1 text-xs text-memory hover:underline"
            >
              Explore memory <ArrowRight size={12} />
            </Link>
          </div>

          {stats.recent_learnings.length === 0 ? (
            <EmptyState
              title="No memories yet"
              subtitle="Close a negotiation to teach DEALMIND something."
              icon={<Brain size={32} />}
            />
          ) : (
            <div className="space-y-2">
              {stats.recent_learnings.map((m) => (
                <MemoryCard key={m.id} record={m} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Memory Impact Demo Component ── */}
      <div className="px-8 pb-4">
        <MemoryImpactCard stats={stats} />
      </div>

      {/* ── Demo Mode Card ── */}
      <div className="px-8 pb-8">
        <DemoModeCard />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function IntelligenceMetric({
  icon, label, value, tone, sub
}: {
  icon: React.ReactNode; label: string; value: number; tone: string; sub?: string;
}) {
  const toneMap: Record<string, string> = {
    memory: "text-memory border-memory/20 bg-memory-soft",
    brand: "text-brand-hover border-brand/20 bg-brand-soft",
    accent: "text-accent border-accent/20 bg-accent-soft",
    default: "text-slate-300 border-base-border bg-base-surface",
    warn: "text-warn border-warn/20 bg-warn-soft",
  };
  const cls = toneMap[tone] || toneMap.default;

  return (
    <div className={`rounded-xl border px-5 py-4 ${cls}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-70 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] opacity-50">{sub}</div>}
    </div>
  );
}

function IntelligenceLoop() {
  const steps = [
    { icon: "🔄", label: "Negotiate", color: "text-brand-hover" },
    { icon: "💾", label: "Retain", color: "text-memory" },
    { icon: "🧠", label: "Recall", color: "text-brand-hover" },
    { icon: "📊", label: "Analyze", color: "text-warn" },
    { icon: "✨", label: "Strategize", color: "text-accent" },
    { icon: "📈", label: "Improve", color: "text-accent" },
  ];

  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Intelligence Loop — How DEALMIND Gets Smarter
      </div>
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1 px-3 py-1">
              <span className="text-lg">{s.icon}</span>
              <span className={`text-[10px] font-bold ${s.color}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={12} className="text-slate-700 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NegotiationRow({ n }: { n: any }) {
  const hasPrice = n.final_price != null;
  const saved = hasPrice ? (n.initial_price - n.final_price) : null;
  const pctSaved = saved && n.initial_price ? ((saved / n.initial_price) * 100).toFixed(1) : null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-base-border bg-base-surface px-4 py-3 transition-colors hover:border-base-border-light">
      <div>
        <div className="text-sm font-semibold text-slate-200">{n.vendor_name}</div>
        <div className="text-xs text-slate-500">
          {n.product} · {n.quantity.toLocaleString()} units
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          {hasPrice ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600 line-through">₹{n.initial_price}</span>
                <span className="text-sm font-bold text-slate-100">₹{n.final_price}</span>
              </div>
              {pctSaved && n.outcome === "successful" && (
                <div className="text-[11px] text-accent">−{pctSaved}% saved</div>
              )}
            </>
          ) : (
            <span className="text-sm tabular-nums text-slate-400">₹{n.initial_price}</span>
          )}
        </div>
        <OutcomeBadge outcome={n.outcome} />
      </div>
    </div>
  );
}

function MemoryImpactCard({ stats }: { stats: DashboardStats }) {
  const hasData = stats.negotiation_count > 0;

  return (
    <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden">
      <div className="border-b border-base-border bg-gradient-to-r from-brand-soft to-transparent px-6 py-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-hover mb-0.5">
          ✨ Memory Impact
        </div>
        <div className="text-sm font-bold text-slate-200">
          How memory changes DEALMIND's strategy
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-base-border">
        <div className="p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-600">
            Before Memory
          </div>
          <ul className="space-y-2">
            {["Generic opening strategy", "No vendor price history", "No tactic evidence", "Calibrated estimate only"].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                <XCircle size={12} className="text-danger/50 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center p-5 text-center bg-brand-soft/30">
          <div className="text-3xl mb-2">🧠</div>
          <div className="text-[11px] font-bold text-brand-hover uppercase tracking-wide">DEALMIND</div>
          <div className="text-[11px] text-slate-600 mt-1">Recalls & Analyzes</div>
          <ArrowRight size={20} className="mt-3 text-brand/40 rotate-90 md:rotate-0" />
        </div>

        <div className="p-5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-accent">
            After Memory
          </div>
          <ul className="space-y-2">
            {[
              `${stats.negotiation_count} negotiations recalled`,
              `${stats.memory_insight_count} memories applied`,
              `${stats.vendor_count} vendor profiles built`,
              "Evidence-backed strategy",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 size={12} className="text-accent mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DemoModeCard() {
  return (
    <div className="rounded-xl border border-warn/25 bg-base-surface overflow-hidden shadow-card">
      <div className="border-b border-warn/20 bg-gradient-to-r from-warn-soft/40 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-warn/30 bg-warn-soft">
              <Clapperboard size={18} className="text-warn" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-warn">🎬 Demo Mode</div>
              <div className="text-sm font-bold text-slate-200">DEALMIND Hindsight Learning Loop</div>
            </div>
          </div>
          <Link to="/demo">
            <Button variant="secondary" size="sm" className="border-warn/30 text-warn hover:bg-warn-soft/30">
              Start Demo <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Show how DEALMIND learns from one negotiation and uses that experience in the next.
          A guided 5-step live demo with real Hindsight memory integration.
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {["Before Memory", "→", "Negotiate", "→", "Retain", "→", "Recall", "→", "Personalized Strategy"].map((t, i) => (
            <span key={i} className={t === "→" ? "text-slate-700 text-xs" : "text-[10px] font-bold text-slate-400 bg-base-surface2 border border-base-border rounded px-1.5 py-0.5"}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-base-border bg-base-surface2 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-0.5 font-semibold text-slate-300">{value}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-base-bg animate-pulse">
      <div className="border-b border-base-border bg-base-surface px-8 py-10">
        <div className="h-3 w-32 rounded bg-base-surface3 mb-3" />
        <div className="h-8 w-96 rounded bg-base-surface3 mb-2" />
        <div className="h-4 w-72 rounded bg-base-surface3" />
      </div>
      <div className="grid grid-cols-4 gap-3 px-8 py-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-base-surface" />
        ))}
      </div>
    </div>
  );
}

function ApiError({ error }: { error: string }) {
  return (
    <div className="p-8">
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-danger mb-2">
          <XCircle size={16} />
          Couldn't reach the DEALMIND API
        </div>
        <p className="text-sm text-slate-500">
          Make sure the backend is running (see README) and VITE_API_URL is correct.
        </p>
        <div className="mt-3 rounded-lg bg-base-surface p-3 font-mono text-xs text-slate-600">
          {error}
        </div>
      </div>
    </div>
  );
}
