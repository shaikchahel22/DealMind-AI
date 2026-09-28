import { useEffect, useState } from "react";
import { Brain, Search, Database, Filter, TrendingUp, Wallet, Target, Truck, Zap } from "lucide-react";
import { api } from "../services/api";
import type { MemoryRecordOut, Vendor } from "../types";
import { PageHeader, inputClass, EmptyState, Badge, ThinkingDots } from "../components/ui";
import MemoryCard from "../components/MemoryCard";

const KINDS = [
  { value: "negotiation_experience", label: "Negotiation Experience", icon: TrendingUp },
  { value: "payment_pattern", label: "Payment Pattern", icon: Wallet },
  { value: "outcome", label: "Outcome", icon: Truck },
  { value: "tactic", label: "Tactic Memory", icon: Target },
  { value: "vendor_knowledge", label: "Vendor Knowledge", icon: Brain },
];

export default function Memory() {
  const [records, setRecords] = useState<MemoryRecordOut[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState<{ backend: string; total_records: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.vendors().then(setVendors);
    api.memoryStatus().then(setStatus);
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.memory({
          q: q || undefined,
          vendor_id: vendorId ? Number(vendorId) : undefined,
          kind: kind || undefined,
          limit: 60,
        });
        setRecords(data);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, vendorId, kind]);

  const byKind = records
    ? KINDS.map((k) => ({
        ...k,
        count: records.filter((r) => r.kind === k.value).length,
      }))
    : [];

  const filteredRecords = records?.filter((r) => !kind || r.kind === kind) ?? [];

  return (
    <div className="min-h-full bg-base-bg">
      {/* Header */}
      <div className="border-b border-base-border bg-base-surface px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-memory">
              🧠 Hindsight Memory
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-100">Memory Explorer</h1>
            <p className="mt-1 text-sm text-slate-500">
              These are experiences retained in DEALMIND's Hindsight memory.
            </p>
          </div>
          {status && (
            <div className="flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-3 py-1 text-xs font-semibold text-memory">
                <span className="h-1.5 w-1.5 rounded-full bg-memory animate-ai-pulse" />
                {status.backend === "hindsight-cloud" ? "Hindsight Cloud" : "Local Store"}
              </span>
              <span className="text-[11px] text-slate-600">
                {status.total_records} memories recalled
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Kind filter pills */}
      <div className="border-b border-base-border bg-base-surface px-8 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setKind("")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              kind === ""
                ? "border-memory/40 bg-memory-soft text-memory"
                : "border-base-border bg-base-surface2 text-slate-500 hover:border-base-border-light hover:text-slate-300"
            }`}
          >
            <Database size={11} /> All types
            {records && <span className="ml-1 font-bold">{records.length}</span>}
          </button>
          {KINDS.map(({ value, label, icon: Icon }) => {
            const count = records?.filter((r) => r.kind === value).length ?? 0;
            return (
              <button
                key={value}
                onClick={() => setKind(kind === value ? "" : value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  kind === value
                    ? "border-brand/40 bg-brand-soft text-brand-hover"
                    : "border-base-border bg-base-surface2 text-slate-500 hover:border-base-border-light hover:text-slate-300"
                }`}
              >
                <Icon size={11} /> {label}
                {count > 0 && <span className="ml-1 font-bold">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-base-border px-8 py-3">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search memory…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} max-w-[200px]`}
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        {(q || vendorId || kind) && (
          <button
            onClick={() => { setQ(""); setVendorId(""); setKind(""); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Filter size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Memory grid */}
      <div className="px-8 py-6">
        {loading && !records ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Brain size={16} className="animate-ai-pulse text-memory" />
            Recalling from Hindsight…
            <ThinkingDots />
          </div>
        ) : !records || records.length === 0 ? (
          <EmptyState
            title="No memories found"
            subtitle={q || vendorId || kind
              ? "Try different search terms or clear the filters."
              : "Close a negotiation to create DEALMIND's first memory."
            }
            icon={<Brain size={40} />}
          />
        ) : (
          <div className="space-y-6">
            {/* Group by kind when no filter */}
            {!kind ? (
              KINDS.filter((k) => records.some((r) => r.kind === k.value)).map(({ value, label, icon: Icon }) => {
                const kindRecords = records.filter((r) => r.kind === value);
                if (kindRecords.length === 0) return null;
                return (
                  <section key={value}>
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                      <Icon size={13} />
                      {label}
                      <span className="rounded-full border border-base-border bg-base-surface2 px-2 py-0.5 text-[10px]">
                        {kindRecords.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {kindRecords.map((r) => (
                        <MemoryCard key={r.id} record={r} />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((r) => (
                  <MemoryCard key={r.id} record={r} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats bar */}
      {records && records.length > 0 && (
        <div className="sticky bottom-0 border-t border-base-border bg-base-surface/90 backdrop-blur-sm px-8 py-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Brain size={12} className="text-memory" />
              <span>
                Showing <strong className="text-slate-400">{filteredRecords.length}</strong> memories
                {q && <span> matching "<strong className="text-slate-400">{q}</strong>"</span>}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {byKind.filter((k) => k.count > 0).map((k) => (
                <span key={k.value}>
                  {k.label}: <strong className="text-slate-400">{k.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
