import { Link } from "react-router-dom";
import { Brain, Flame, ArrowRight, TrendingUp } from "lucide-react";
import type { Vendor } from "../types";
import { ProgressBar } from "./ui";

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link to={`/vendors/${vendor.id}`}>
      <div className="group relative rounded-xl border border-base-border bg-base-surface p-5 shadow-card transition-all hover:border-brand/30 hover:shadow-card-brand">
        {/* Top section */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-brand-hover transition-colors">
              {vendor.name}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{vendor.category}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-base-border bg-base-surface2 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              <TrendingUp size={10} />
              {vendor.negotiation_count} deals
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          <div>
            <ProgressBar value={vendor.price_flexibility} tone="brand" label="Price flexibility" showPct />
          </div>
          <div>
            <ProgressBar value={vendor.volume_sensitivity} tone="warn" label="Volume sensitivity" showPct />
          </div>
          <div>
            <ProgressBar value={vendor.delivery_reliability} tone="accent" label="Delivery reliability" showPct />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {vendor.best_tactic ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <Flame size={11} className="text-warn" />
              <span className="text-slate-600">Best tactic:</span>
              <span className="font-semibold text-warn capitalize">
                {vendor.best_tactic.replace(/_/g, " ")}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-600">
              <Brain size={11} />
              <span>No pattern yet</span>
            </div>
          )}
          <ArrowRight size={13} className="text-slate-700 group-hover:text-brand transition-colors" />
        </div>
      </div>
    </Link>
  );
}
