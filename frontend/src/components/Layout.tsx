import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Brain, LayoutDashboard, Building2, Handshake,
  Database, Lightbulb, Zap, Clock, Activity, Clapperboard,
} from "lucide-react";
import { api } from "../services/api";

const nav = [
  { to: "/", label: "Command Center", icon: LayoutDashboard, end: true },
  { to: "/negotiate", label: "AI Negotiator", icon: Zap },
  { to: "/vendors", label: "Vendors", icon: Building2 },
  { to: "/memory", label: "Memory", icon: Database },
  { to: "/insights", label: "Insights", icon: Lightbulb },
];

export default function Layout() {
  const [memStatus, setMemStatus] = useState<{ backend: string; total_records: number } | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    api.memoryStatus()
      .then(setMemStatus)
      .catch(() => setStatusError(true));
  }, []);

  return (
    <div className="flex h-screen w-full bg-base-bg overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-base-border bg-base-surface">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-base-border">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <Brain size={18} className="text-white" strokeWidth={2.2} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-surface bg-accent" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-100">DEALMIND</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                AI Procurement Strategist
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand/12 text-brand-hover border border-brand/20 shadow-sm"
                    : "text-slate-500 hover:bg-base-surface2 hover:text-slate-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={isActive ? "text-brand" : "text-slate-600 group-hover:text-slate-400"}
                  />
                  {label}
                  {to === "/negotiate" && (
                    <span className="ml-auto rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-hover">
                      AI
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Demo Mode button — visually distinct */}
          <Link
            to="/demo"
            className="mt-2 flex items-center gap-3 rounded-lg border border-warn/20 bg-warn-soft/30 px-3 py-2.5 text-sm font-semibold text-warn transition-all hover:border-warn/40 hover:bg-warn-soft/50"
          >
            <Clapperboard size={16} strokeWidth={1.8} className="text-warn" />
            Demo Mode
            <span className="ml-auto rounded-full bg-warn/20 px-1.5 py-0.5 text-[10px] font-bold text-warn">🎬</span>
          </Link>
        </nav>

        {/* Loop Reminder */}
        <div className="mx-3 mb-3 rounded-lg border border-base-border bg-base-surface2 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Intelligence Loop
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            {["REMEMBER", "→", "RECALL", "→", "REASON", "→", "LEARN"].map((t, i) => (
              <span key={i} className={t === "→" ? "text-slate-700" : "text-slate-500"}>{t}</span>
            ))}
          </div>
        </div>

        {/* Hindsight Memory Status */}
        <div className="border-t border-base-border p-4">
          <div className="rounded-lg border border-memory/20 bg-memory-soft p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Brain size={13} className="text-memory" />
                <span className="text-[11px] font-semibold text-memory">Hindsight Memory</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ai-pulse" />
                LIVE
              </span>
            </div>
            {memStatus ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Memories recalled</span>
                  <span className="font-bold text-slate-300">{memStatus.total_records}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Backend</span>
                  <span className="text-memory font-medium text-[10px]">
                    {memStatus.backend === "hindsight-cloud" ? "Cloud ✓" : "Local"}
                  </span>
                </div>
              </div>
            ) : statusError ? (
              <div className="text-[11px] text-slate-600">Backend offline</div>
            ) : (
              <div className="text-[11px] text-slate-600 animate-ai-pulse">Connecting…</div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-base-bg">
        <Outlet />
      </main>
    </div>
  );
}
