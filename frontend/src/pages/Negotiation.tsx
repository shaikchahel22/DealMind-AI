import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Brain, Zap, CheckCircle2, ArrowRight, Building2, Target, Wallet, TrendingDown, Flame, Sparkles } from "lucide-react";
import { api } from "../services/api";
import type { Vendor, NegotiationBrief, ChatMessage, ChatSuggestion } from "../types";
import { Button, Field, inputClass, Badge, OutcomeBadge, ThinkingDots } from "../components/ui";
import NegotiationBriefCard from "../components/NegotiationBrief";
import ChatWindow from "../components/ChatWindow";

type Stage = "form" | "recalling" | "brief" | "chat" | "closed";

// Recall animation steps
const RECALL_STEPS = [
  { label: "Searching Hindsight memory…", done: false, delay: 600 },
  { label: "Previous negotiations found", done: true, delay: 1400 },
  { label: "Successful tactics identified", done: true, delay: 2000 },
  { label: "Payment patterns analyzed", done: true, delay: 2600 },
  { label: "Previous outcomes evaluated", done: true, delay: 3000 },
  { label: "AI strategy generated", done: true, delay: 3600 },
];

export default function NegotiationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preselectedVendor = params.get("vendor_id");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState(preselectedVendor || "");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("5000");
  const [quotedPrice, setQuotedPrice] = useState("");

  const [stage, setStage] = useState<Stage>("form");
  const [brief, setBrief] = useState<NegotiationBrief | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recallSteps, setRecallSteps] = useState<number>(0);
  const [lastSuggestion, setLastSuggestion] = useState<string>("");

  useEffect(() => { api.vendors().then(setVendors); }, []);

  const selectedVendor = vendors.find((v) => String(v.id) === vendorId);

  const analyze = async () => {
    if (!vendorId || !product || !quantity || !quotedPrice) return;
    setAnalyzing(true);
    setStage("recalling");
    setRecallSteps(0);

    // Animate recall steps
    RECALL_STEPS.forEach((step, i) => {
      setTimeout(() => setRecallSteps(i + 1), step.delay);
    });

    try {
      const b = await api.startNegotiation({
        vendor_id: Number(vendorId),
        product,
        quantity: Number(quantity),
        quoted_price: Number(quotedPrice),
      });
      // Wait for animation to finish
      await new Promise((r) => setTimeout(r, 3800));
      setBrief(b);
      setStage("brief");
    } finally {
      setAnalyzing(false);
    }
  };

  const startChat = () => setStage("chat");

  const sendVendorMessage = async (vendorMessage: string) => {
    if (!brief) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), sender: "vendor", message: vendorMessage, timestamp: new Date().toISOString() },
    ]);
    setChatLoading(true);
    try {
      const suggestion = await api.chat(brief.negotiation_id, vendorMessage);
      const dmMsg = `${suggestion.suggested_response}\n\n${suggestion.reasoning}`;
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, sender: "dealmind", message: dmMsg, timestamp: new Date().toISOString() },
      ]);
      setLastSuggestion(suggestion.suggested_response);
    } finally {
      setChatLoading(false);
    }
  };

  const reset = () => {
    setStage("form");
    setBrief(null);
    setMessages([]);
    setProduct("");
    setQuotedPrice("");
    setRecallSteps(0);
    setLastSuggestion("");
  };

  return (
    <div className="min-h-full bg-base-bg">
      {/* ── Page Header ── */}
      <div className="border-b border-base-border bg-base-surface px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
              ✨ AI Negotiator
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-100">
              {stage === "form" && "Let's prepare your next negotiation."}
              {stage === "recalling" && "🧠 DEALMIND is recalling experience…"}
              {stage === "brief" && `AI Brief ready — ${brief?.vendor_name}`}
              {stage === "chat" && `Live negotiation — ${brief?.vendor_name}`}
              {stage === "closed" && "Negotiation closed — memory retained."}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {stage === "form" && "Select a vendor and enter the quoted price to generate a memory-backed strategy."}
              {stage === "recalling" && "Searching Hindsight memory for relevant negotiation experiences…"}
              {stage === "brief" && "Review the AI-generated strategy before starting the live negotiation."}
              {stage === "chat" && "DEALMIND suggests responses based on recalled memory."}
              {stage === "closed" && "Outcome saved. The next negotiation will use this experience."}
            </p>
          </div>
          {(stage !== "form") && (
            <Button variant="secondary" onClick={reset}>
              ← New Negotiation
            </Button>
          )}
        </div>
      </div>

      {/* ── FORM STAGE ── */}
      {stage === "form" && (
        <div className="px-8 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
                <div className="mb-4 text-sm font-bold text-slate-300">Step 1 — Select Vendor & Quote</div>
                <div className="grid grid-cols-1 gap-4">
                  {/* Vendor selector with cards */}
                  {vendors.length > 0 ? (
                    <div>
                      <div className="mb-2 text-xs font-medium text-slate-400">Vendor</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {vendors.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => setVendorId(String(v.id))}
                            className={`rounded-lg border p-3 text-left transition-all ${
                              vendorId === String(v.id)
                                ? "border-brand/40 bg-brand-soft shadow-card-brand"
                                : "border-base-border bg-base-surface2 hover:border-base-border-light"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-slate-200">{v.name}</div>
                              {vendorId === String(v.id) && (
                                <CheckCircle2 size={14} className="text-brand" />
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">{v.category}</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="inline-flex items-center gap-1 rounded-full border border-base-border bg-base-surface px-1.5 py-0.5 text-[10px] text-slate-500">
                                {v.negotiation_count} deals
                              </span>
                              {v.best_tactic && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-warn/20 bg-warn-soft px-1.5 py-0.5 text-[10px] text-warn">
                                  <Flame size={9} />
                                  {v.best_tactic.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Field label="Vendor">
                      <select className={inputClass} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                        <option value="">Select a vendor…</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </Field>
                  )}

                  <Field label="Product / Item">
                    <input
                      className={inputClass}
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g. Industrial Bearings"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Quantity (units)">
                      <input
                        className={inputClass}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </Field>
                    <Field label="Vendor's quoted price (₹ / unit)">
                      <input
                        className={inputClass}
                        type="number"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        placeholder="e.g. 10000"
                      />
                    </Field>
                  </div>

                  <Button
                    onClick={analyze}
                    disabled={analyzing || !vendorId || !product || !quotedPrice}
                    size="lg"
                    className="mt-2"
                  >
                    <Brain size={16} />
                    {analyzing ? "Recalling from Hindsight…" : "Analyze & Generate Strategy"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right sidebar info */}
            <div className="space-y-4">
              <div className="rounded-xl border border-memory/20 bg-memory-soft p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-memory uppercase tracking-wide">
                  <Brain size={13} />
                  What happens next
                </div>
                <ol className="space-y-2">
                  {[
                    "DEALMIND searches Hindsight memory",
                    "Previous negotiations recalled",
                    "Successful tactics identified",
                    "AI strategy generated",
                    "Evidence-backed brief revealed",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-memory/30 text-[10px] font-bold text-memory">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {selectedVendor && (
                <VendorPreview vendor={selectedVendor} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── RECALL ANIMATION STAGE ── */}
      {stage === "recalling" && (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                  <Brain size={36} className="text-white animate-ai-pulse" />
                  <div className="absolute -inset-1 rounded-2xl border-2 border-brand/30 animate-memory-glow" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-100">🧠 DEALMIND IS RECALLING EXPERIENCE…</h2>
              <p className="mt-2 text-sm text-slate-500">Searching Hindsight memory for relevant negotiation experiences</p>
            </div>

            <div className="space-y-3">
              {RECALL_STEPS.map((step, i) => {
                const isActive = i === recallSteps - 1;
                const isDone = i < recallSteps - 1;
                const isPending = i >= recallSteps;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                      isDone
                        ? "border-accent/25 bg-accent-soft text-accent"
                        : isActive
                        ? "border-brand/30 bg-brand-soft text-brand-hover animate-memory-glow"
                        : "border-base-border bg-base-surface text-slate-600"
                    }`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={16} className="text-accent" />
                      ) : isActive ? (
                        <ThinkingDots />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BRIEF STAGE ── */}
      {stage === "brief" && brief && (
        <div className="px-8 py-6 animate-slide-up">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Brief card */}
            <div className="lg:col-span-2">
              <NegotiationBriefCard brief={brief} />
            </div>

            {/* Action panel */}
            <div className="space-y-4">
              <div className="rounded-xl border border-accent/30 bg-accent-soft p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-accent">
                  <CheckCircle2 size={16} />
                  Strategy Ready
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  DEALMIND has recalled{" "}
                  <span className="font-bold text-memory">{brief.evidence_count} memories</span>
                  {" "}to build this strategy.
                  {brief.evidence_count > 0
                    ? " Evidence-backed recommendations are in the brief."
                    : " This is an initial calibrated estimate."}
                </p>
                <Button size="lg" className="w-full" onClick={startChat}>
                  <Zap size={16} />
                  Start AI-Assisted Negotiation
                </Button>
              </div>

              {/* Quick strategy summary */}
              <div className="rounded-xl border border-base-border bg-base-surface p-4 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Quick Strategy Summary
                </div>
                <QuickStat icon={<Target size={13} />} label="Target" value={`₹${brief.target_min}–₹${brief.target_max}`} color="text-brand-hover" />
                <QuickStat icon={<Flame size={13} />} label="Tactic" value={brief.recommended_tactic.replace(/_/g, " ")} color="text-warn" />
                <QuickStat icon={<Wallet size={13} />} label="Payment" value={brief.payment_terms_suggestion} color="text-slate-300" />
                {brief.historical_avg && (
                  <QuickStat icon={<TrendingDown size={13} />} label="Historical Avg" value={`₹${brief.historical_avg}`} color="text-accent" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT STAGE ── */}
      {stage === "chat" && brief && (
        <div className="flex h-[calc(100vh-120px)] gap-0 animate-slide-up">
          {/* Left — Context panel */}
          <div className="w-72 shrink-0 border-r border-base-border bg-base-surface overflow-y-auto">
            <div className="p-4 border-b border-base-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
                  <Building2 size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">{brief.vendor_name}</div>
                  <div className="text-xs text-slate-500">{brief.product}</div>
                </div>
              </div>

              {/* Key numbers */}
              <div className="space-y-2">
                <PanelStat label="Quote" value={`₹${brief.quoted_price}`} />
                <PanelStat label="AI Target" value={`₹${brief.target_min}–₹${brief.target_max}`} color="text-brand-hover" />
                <PanelStat label="Walk-away" value={`₹${brief.walk_away}`} color="text-danger" />
                <PanelStat label="Opening counter" value={`₹${brief.opening_counter}`} color="text-accent" />
              </div>
            </div>

            <div className="p-4 border-b border-base-border">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                AI Strategy
              </div>
              <div className="rounded-lg border border-warn/20 bg-warn-soft/50 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-warn">
                  <Flame size={11} /> Recommended Tactic
                </div>
                <div className="text-sm font-bold text-slate-200 capitalize">
                  {brief.recommended_tactic.replace(/_/g, " ")}
                </div>
                {brief.tactic_evidence && (
                  <div className="mt-1 text-[11px] text-slate-500">
                    {brief.tactic_evidence.wins}/{brief.tactic_evidence.total} wins with this vendor
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-b border-base-border">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Memory Active
              </div>
              <div className="flex items-center gap-1.5 text-xs text-memory">
                <Brain size={12} className="animate-ai-pulse" />
                <span>{brief.evidence_count} memories recalled</span>
              </div>
              {brief.memory_snippets.slice(0, 2).map((s, i) => (
                <div key={i} className="mt-2 rounded-lg border border-memory/15 bg-memory-soft/40 px-2.5 py-2 text-[11px] leading-relaxed text-slate-500">
                  {s.length > 100 ? s.slice(0, 100) + "…" : s}
                </div>
              ))}
            </div>

            {/* Outcome form */}
            <div className="p-4">
              <OutcomeForm brief={brief} onSaved={() => setStage("closed")} />
            </div>
          </div>

          {/* Right — Chat */}
          <div className="flex flex-1 flex-col">
            <div className="border-b border-base-border px-4 py-3 bg-base-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-brand" />
                <span className="text-sm font-bold text-slate-300">AI Negotiation Assistant</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-2 py-0.5 text-[10px] font-bold text-memory">
                <span className="h-1.5 w-1.5 rounded-full bg-memory animate-ai-pulse" />
                🧠 MEMORY-BACKED
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                messages={messages}
                onSend={sendVendorMessage}
                loading={chatLoading}
                suggestedResponse={lastSuggestion}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CLOSED STAGE ── */}
      {stage === "closed" && (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-slide-up">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft">
            <CheckCircle2 size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-black text-slate-100 mb-2">
            🧠 DEALMIND Learned From This
          </h2>
          <p className="max-w-sm text-sm text-slate-500 leading-relaxed mb-2">
            Outcome retained in Hindsight memory. The next negotiation with this vendor will use this experience.
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <Badge tone="success" dot>Outcome saved</Badge>
            <Badge tone="memory" dot>Hindsight retained</Badge>
            <Badge tone="brand" dot>Strategy updated</Badge>
          </div>

          {/* Learning timeline */}
          <div className="mb-8 max-w-xs w-full text-left">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-3">
              What happened
            </div>
            {[
              { icon: "✓", label: "Negotiation completed", color: "text-accent" },
              { icon: "↓", label: "Outcome recorded", color: "text-slate-600" },
              { icon: "🧠", label: "Hindsight retained", color: "text-memory" },
              { icon: "✨", label: "DEALMIND learned from it", color: "text-brand-hover" },
              { icon: "→", label: "Next strategy updated", color: "text-accent" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className={`text-sm ${step.color} w-4 text-center`}>{step.icon}</span>
                <span className="text-xs text-slate-400">{step.label}</span>
              </div>
            ))}
          </div>

          <Button size="lg" onClick={reset}>
            <Zap size={16} /> Start Another Negotiation
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function VendorPreview({ vendor }: { vendor: Vendor }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Selected Vendor
      </div>
      <div className="mb-3">
        <div className="text-sm font-bold text-slate-200">{vendor.name}</div>
        <div className="text-xs text-slate-500">{vendor.category}</div>
      </div>
      <div className="space-y-1.5">
        <QuickStat label="Negotiations" value={`${vendor.negotiation_count}`} color="text-slate-300" />
        <QuickStat
          label="Price flexibility"
          value={`${Math.round(vendor.price_flexibility * 100)}%`}
          color="text-brand-hover"
        />
        {vendor.best_tactic && (
          <QuickStat label="Best tactic" value={vendor.best_tactic.replace(/_/g, " ")} color="text-warn" />
        )}
      </div>
    </div>
  );
}

function QuickStat({
  icon, label, value, color = "text-slate-300"
}: {
  icon?: React.ReactNode; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        {icon}
        {label}
      </span>
      <span className={`font-bold capitalize ${color}`}>{value}</span>
    </div>
  );
}

function PanelStat({
  label, value, color = "text-slate-200"
}: {
  label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-base-border bg-base-surface2 px-3 py-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function OutcomeForm({ brief, onSaved }: { brief: NegotiationBrief; onSaved: () => void }) {
  const [finalPrice, setFinalPrice] = useState(String(brief.target_min));
  const [paymentTerms, setPaymentTerms] = useState(brief.payment_terms_suggestion);
  const [tactic, setTactic] = useState(brief.recommended_tactic);
  const [outcome, setOutcome] = useState<"successful" | "unsuccessful">("successful");
  const [onTime, setOnTime] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.saveOutcome(brief.negotiation_id, {
        final_price: Number(finalPrice),
        payment_terms: paymentTerms,
        tactic,
        outcome,
        quality_score: 4.5,
        delivery_on_time: onTime,
      });
      setSaved(true);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  if (saved) return null;

  return (
    <div>
      <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Record Outcome
      </div>
      <div className="space-y-2">
        <Field label="Final price / unit">
          <input
            className={inputClass}
            type="number"
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value)}
          />
        </Field>
        <Field label="Result">
          <select
            className={inputClass}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as "successful" | "unsuccessful")}
          >
            <option value="successful">✓ Successful</option>
            <option value="unsuccessful">✗ Unsuccessful</option>
          </select>
        </Field>
        <div className="flex items-center gap-2">
          <input
            id="ontime"
            type="checkbox"
            checked={onTime}
            onChange={(e) => setOnTime(e.target.checked)}
            className="accent-brand"
          />
          <label htmlFor="ontime" className="text-xs text-slate-400">Delivered on time</label>
        </div>
        <Button
          className="w-full mt-2"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving to memory…" : "🧠 Save & Learn"}
        </Button>
      </div>
    </div>
  );
}
