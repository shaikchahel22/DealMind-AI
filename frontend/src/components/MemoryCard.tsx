import { Brain, Wallet, TrendingUp, Truck, Target, Zap, CheckCircle, XCircle } from "lucide-react";
import type { MemoryRecordOut } from "../types";
import { Card } from "./ui";

const KIND_META: Record<string, { icon: any; label: string; color: string; border: string; bg: string }> = {
  negotiation_experience: {
    icon: TrendingUp, label: "Negotiation Experience",
    color: "text-brand-hover", border: "border-brand/25", bg: "bg-brand-soft",
  },
  payment_pattern: {
    icon: Wallet, label: "Payment Pattern",
    color: "text-warn", border: "border-warn/25", bg: "bg-warn-soft",
  },
  outcome: {
    icon: Truck, label: "Outcome Memory",
    color: "text-accent", border: "border-accent/25", bg: "bg-accent-soft",
  },
  tactic: {
    icon: Target, label: "Tactic Memory",
    color: "text-fuchsia-400", border: "border-fuchsia-500/25", bg: "bg-fuchsia-950/30",
  },
  vendor_knowledge: {
    icon: Brain, label: "Vendor Knowledge",
    color: "text-memory", border: "border-memory/25", bg: "bg-memory-soft",
  },
};

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function isSuccessfulContent(content: string): boolean {
  return /success|achieved|discount|closed|agreed|net 45|effective/i.test(content);
}

export default function MemoryCard({ record }: { record: MemoryRecordOut }) {
  const meta = KIND_META[record.kind] || {
    icon: Brain, label: record.kind.replace(/_/g, " "),
    color: "text-slate-400", border: "border-base-border", bg: "bg-base-surface2",
  };
  const Icon = meta.icon;
  const isSuccess = isSuccessfulContent(record.content);

  return (
    <div className={`animate-slide-up rounded-xl border ${meta.border} ${meta.bg} p-4 transition-all hover:shadow-card-brand`}>
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
          <Icon size={12} />
          {meta.label}
        </div>
        {record.kind === "outcome" && (
          <span className={isSuccess ? "text-accent" : "text-danger"}>
            {isSuccess ? <CheckCircle size={13} /> : <XCircle size={13} />}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed text-slate-300">{record.content}</p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-600">
          <Brain size={11} />
          Hindsight Memory
        </div>
        <span className="text-[11px] text-slate-600">{timeAgo(record.created_at)}</span>
      </div>
    </div>
  );
}
