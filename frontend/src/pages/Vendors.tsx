import { useEffect, useState } from "react";
import { Plus, Building2, Brain, Zap, Search } from "lucide-react";
import { api } from "../services/api";
import type { Vendor } from "../types";
import { Button, Field, inputClass, EmptyState } from "../components/ui";
import VendorCard from "../components/VendorCard";

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => api.vendors().then(setVendors);
  useEffect(() => { load(); }, []);

  const filtered = vendors?.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalDeals = vendors?.reduce((sum, v) => sum + v.negotiation_count, 0) ?? 0;
  const withTactics = vendors?.filter((v) => v.best_tactic).length ?? 0;

  return (
    <div className="min-h-full bg-base-bg">
      {/* Header */}
      <div className="border-b border-base-border bg-base-surface px-8 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              AI Intelligence
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-100">Vendors</h1>
            <p className="mt-1 text-sm text-slate-500">
              Every vendor DEALMIND has built a negotiation memory for.
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> Add Vendor
          </Button>
        </div>

        {/* Summary stats */}
        {vendors && vendors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-base-border bg-base-surface2 px-3 py-1 text-xs text-slate-500">
              <Building2 size={11} />
              {vendors.length} vendors tracked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs text-brand-hover">
              <Zap size={11} />
              {totalDeals} negotiations total
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/20 bg-memory-soft px-3 py-1 text-xs text-memory">
              <Brain size={11} />
              {withTactics} with identified tactics
            </span>
          </div>
        )}
      </div>

      {/* Add vendor form */}
      {showForm && <NewVendorForm onCreated={() => { setShowForm(false); load(); }} />}

      {/* Search */}
      {vendors && vendors.length > 3 && (
        <div className="border-b border-base-border px-8 py-3">
          <div className="relative max-w-sm">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Vendors grid */}
      <div className="px-8 py-6">
        {!vendors ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Brain size={14} className="animate-ai-pulse text-memory" />
            Loading vendor intelligence…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No vendors match your search" : "No vendors yet"}
            subtitle={search ? "Try a different search." : "Add your first vendor to get started."}
            icon={<Building2 size={40} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewVendorForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !category.trim()) return;
    setBusy(true);
    try {
      await api.createVendor({ name, category, contact_name: contact || undefined });
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-base-border bg-brand-soft/20 px-8 py-5">
      <div className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-hover">
        Add New Vendor
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Vendor name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Industrial"
          />
        </Field>
        <Field label="Category">
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Manufacturing"
          />
        </Field>
        <Field label="Contact (optional)">
          <input
            className={inputClass}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. Sales team"
          />
        </Field>
        <div className="flex items-end">
          <Button
            onClick={submit}
            disabled={busy || !name || !category}
            className="w-full"
          >
            {busy ? "Adding…" : "Add Vendor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
