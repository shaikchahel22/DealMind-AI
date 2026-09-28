import type { ReactNode } from "react";

// ─── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children, className = "", glow, variant = "default"
}: {
  children: ReactNode; className?: string; glow?: boolean;
  variant?: "default" | "brand" | "accent" | "memory" | "warn" | "danger";
}) {
  const variantClass = {
    default: "border-base-border bg-base-surface",
    brand: "border-brand/30 bg-brand-soft",
    accent: "border-accent/30 bg-accent-soft",
    memory: "border-memory/30 bg-memory-soft",
    warn: "border-warn/30 bg-warn-soft",
    danger: "border-danger/30 bg-danger-soft",
  }[variant];

  return (
    <div className={`rounded-xl border shadow-card ${variantClass} ${glow ? "shadow-card-brand" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, action, eyebrow
}: {
  title: string; subtitle?: string; action?: ReactNode; eyebrow?: string;
}) {
  return (
    <div className="flex items-start justify-between border-b border-base-border px-8 py-5">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand-hover">
            {eyebrow}
          </div>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, tone = "default", icon, sub
}: {
  label: string; value: string | number; tone?: "default" | "brand" | "accent" | "memory" | "warn";
  icon?: ReactNode; sub?: string;
}) {
  const toneClass = {
    default: "text-slate-100",
    brand: "text-brand-hover",
    accent: "text-accent",
    memory: "text-memory",
    warn: "text-warn",
  }[tone];

  const bgClass = {
    default: "bg-base-surface border-base-border",
    brand: "bg-brand-soft border-brand/20",
    accent: "bg-accent-soft border-accent/20",
    memory: "bg-memory-soft border-memory/20",
    warn: "bg-warn-soft border-warn/20",
  }[tone];

  return (
    <div className={`rounded-xl border px-5 py-4 shadow-card ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <div className={`mt-1.5 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-600">{sub}</div>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({
  children, tone = "default", dot
}: {
  children: ReactNode; tone?: "default" | "success" | "danger" | "warn" | "brand" | "memory" | "info";
  dot?: boolean;
}) {
  const map = {
    default: "bg-base-surface3 text-slate-400 border-base-border",
    success: "bg-accent-soft2 text-accent border-accent/30",
    danger: "bg-danger-soft2 text-danger border-danger/30",
    warn: "bg-warn-soft2 text-warn border-warn/30",
    brand: "bg-brand-soft2 text-brand-hover border-brand/30",
    memory: "bg-memory-soft text-memory border-memory/30",
    info: "bg-sky-950 text-sky-400 border-sky-800/40",
  };
  const dotColor = {
    default: "bg-slate-500",
    success: "bg-accent",
    danger: "bg-danger",
    warn: "bg-warn",
    brand: "bg-brand",
    memory: "bg-memory",
    info: "bg-sky-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor[tone]}`} />}
      {children}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: "low" | "medium" | "high" }) {
  const tone = level === "high" ? "success" : level === "medium" ? "warn" : "default";
  return <Badge tone={tone}>{level} confidence</Badge>;
}

export function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const tone = level === "low" ? "success" : level === "medium" ? "warn" : "danger";
  return <Badge tone={tone}>{level} risk</Badge>;
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  if (outcome === "successful") return <Badge tone="success" dot>Successful</Badge>;
  if (outcome === "unsuccessful") return <Badge tone="danger" dot>Unsuccessful</Badge>;
  return <Badge tone="warn" dot>In progress</Badge>;
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "", size = "md",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  type?: "button" | "submit"; disabled?: boolean; className?: string; size?: "sm" | "md" | "lg";
}) {
  const varMap = {
    primary: "bg-gradient-brand text-white hover:opacity-90 shadow-sm disabled:opacity-50",
    secondary: "bg-base-surface2 text-slate-200 border border-base-border hover:bg-base-surface3 hover:border-base-border-light",
    ghost: "text-slate-400 hover:text-slate-200 hover:bg-base-surface2",
    accent: "bg-accent text-black hover:bg-accent-hover font-semibold disabled:opacity-50",
    danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
  };
  const sizeMap = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-1.5",
    lg: "px-6 py-2.5 text-sm gap-2",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${varMap[variant]} ${sizeMap[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-600">{hint}</span>}
    </label>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export const inputClass =
  "w-full rounded-lg border border-base-border bg-base-surface2 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors";

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  value, tone = "brand", label, showPct = false
}: {
  value: number; tone?: "brand" | "accent" | "warn" | "danger"; label?: string; showPct?: boolean;
}) {
  const colorClass = {
    brand: "tactic-bar",
    accent: "tactic-bar tactic-bar-accent",
    warn: "tactic-bar tactic-bar-warn",
    danger: "tactic-bar tactic-bar-danger",
  }[tone];
  return (
    <div>
      {(label || showPct) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <span className="text-[11px] text-slate-500">{label}</span>}
          {showPct && <span className="text-[11px] tabular-nums text-slate-500">{Math.round(value * 100)}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-surface3">
        <div className={colorClass} style={{ width: `${Math.min(Math.round(value * 100), 100)}%` }} />
      </div>
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
export function EmptyState({
  title, subtitle, icon
}: {
  title: string; subtitle?: string; icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-border py-16 text-center">
      {icon && <div className="mb-3 opacity-30">{icon}</div>}
      <div className="text-sm font-semibold text-slate-400">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-600">{subtitle}</div>}
    </div>
  );
}

// ─── AIStatusIndicator ───────────────────────────────────────────────────────
export function AIStatusIndicator({
  state, label
}: {
  state: "idle" | "thinking" | "recalled" | "done";
  label: string;
}) {
  const colors = {
    idle: "bg-slate-600",
    thinking: "bg-brand animate-ai-pulse",
    recalled: "bg-memory animate-ai-pulse",
    done: "bg-accent",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colors[state]}`} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ─── ThinkingDots ─────────────────────────────────────────────────────────────
export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-dot-1" />
      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-dot-2" />
      <span className="h-1.5 w-1.5 rounded-full bg-brand animate-dot-3" />
    </span>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
export function SectionHeader({
  icon, title, action
}: {
  icon?: ReactNode; title: string; action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="border-t border-base-border" />;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-base-border" />
      <span className="text-[11px] text-slate-600">{label}</span>
      <div className="flex-1 border-t border-base-border" />
    </div>
  );
}

// ─── MemoryBadge ─────────────────────────────────────────────────────────────
export function MemoryBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-2.5 py-0.5 text-[11px] font-semibold text-memory">
      🧠 {count} {count === 1 ? "memory" : "memories"}
    </span>
  );
}
