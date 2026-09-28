/**
 * DemoMode.tsx
 *
 * A polished, guided 5-step presentation of DEALMIND's Hindsight
 * learning loop.  Every API call hits the REAL backend — no fake memory,
 * no mocked responses.
 *
 * Steps:
 *  1. BEFORE_MEMORY   — first negotiation brief, no history (or baseline)
 *  2. NEGOTIATION     — show ₹10,000 → ₹8,500 successful result
 *  3. RETAIN          — call /api/negotiations/:id/outcome (real retain)
 *  4. AFTER_MEMORY    — second negotiation brief WITH recalled memory
 *  5. STRATEGY        — display personalized brief + learning loop visual
 */
import { useEffect, useReducer, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Zap, CheckCircle2, ArrowRight, ArrowDown,
  RotateCcw, X, Flame, Target, Wallet, TrendingDown,
  ChevronRight, Sparkles, AlertCircle,
} from "lucide-react";
import { api } from "../services/api";
import type { NegotiationBrief } from "../types";
import { Button, ThinkingDots, Badge } from "../components/ui";

// ─── Demo step type ────────────────────────────────────────────────────────
type DemoStep =
  | "BEFORE_MEMORY"
  | "NEGOTIATION"
  | "RETAIN"
  | "AFTER_MEMORY"
  | "STRATEGY";

const STEPS: { id: DemoStep; label: string }[] = [
  { id: "BEFORE_MEMORY", label: "Before Memory" },
  { id: "NEGOTIATION",   label: "Negotiation" },
  { id: "RETAIN",        label: "Learning" },
  { id: "AFTER_MEMORY",  label: "Memory Recall" },
  { id: "STRATEGY",      label: "Personalized Strategy" },
];

// ─── State ─────────────────────────────────────────────────────────────────
interface Scenario {
  vendor_id: number;
  vendor_name: string;
  product: string;
  quantity: number;
  quoted_price: number;
  target_price: number;
  tactic: string;
  payment: string;
}

interface DemoState {
  step: DemoStep;
  loading: boolean;
  error: string | null;
  scenario: Scenario | null;
  firstBrief: NegotiationBrief | null;
  negotiationId: number | null;
  retained: boolean;
  retainedMemoryCount: number | null;
  secondBrief: NegotiationBrief | null;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SCENARIO"; payload: Scenario }
  | { type: "SET_FIRST_BRIEF"; payload: NegotiationBrief }
  | { type: "SET_RETAINED"; payload: { memoryCount: number } }
  | { type: "SET_SECOND_BRIEF"; payload: NegotiationBrief }
  | { type: "GO_TO_STEP"; payload: DemoStep }
  | { type: "RESET" };

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "SET_LOADING":  return { ...state, loading: action.payload };
    case "SET_ERROR":    return { ...state, error: action.payload, loading: false };
    case "SET_SCENARIO": return { ...state, scenario: action.payload };
    case "SET_FIRST_BRIEF":
      return { ...state, firstBrief: action.payload, negotiationId: action.payload.negotiation_id, loading: false };
    case "SET_RETAINED":
      return { ...state, retained: true, retainedMemoryCount: action.payload.memoryCount, loading: false };
    case "SET_SECOND_BRIEF":
      return { ...state, secondBrief: action.payload, loading: false };
    case "GO_TO_STEP":   return { ...state, step: action.payload, error: null };
    case "RESET":
      return {
        step: "BEFORE_MEMORY",
        loading: false,
        error: null,
        scenario: state.scenario,
        firstBrief: null,
        negotiationId: null,
        retained: false,
        retainedMemoryCount: null,
        secondBrief: null,
      };
    default: return state;
  }
}

const INITIAL: DemoState = {
  step: "BEFORE_MEMORY",
  loading: false,
  error: null,
  scenario: null,
  firstBrief: null,
  negotiationId: null,
  retained: false,
  retainedMemoryCount: null,
  secondBrief: null,
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DemoMode() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const retainCalledRef = useRef(false);

  useEffect(() => {
    const initDemo = async () => {
      try {
        await api.resetDemo();
        const s = await api.demoScenario();
        dispatch({ type: "SET_SCENARIO", payload: s as Scenario });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: String(e) });
      }
    };
    initDemo();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const stepIndex = STEPS.findIndex((s) => s.id === state.step);

  const runFirstBrief = useCallback(async () => {
    if (!state.scenario) return;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const brief = await api.startNegotiation({
        vendor_id: state.scenario.vendor_id,
        product: state.scenario.product,
        quantity: state.scenario.quantity,
        quoted_price: state.scenario.quoted_price,
      });
      dispatch({ type: "SET_FIRST_BRIEF", payload: brief });
      dispatch({ type: "GO_TO_STEP", payload: "NEGOTIATION" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }, [state.scenario]);

  const runRetain = useCallback(async () => {
    if (!state.firstBrief || retainCalledRef.current) return;
    retainCalledRef.current = true;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const scenario = state.scenario!;
      await api.saveOutcome(state.firstBrief.negotiation_id, {
        final_price: scenario.target_price,
        payment_terms: scenario.payment,
        tactic: scenario.tactic,
        outcome: "successful",
        quality_score: 4.5,
        delivery_on_time: true,
      });
      const memories = await api.memory({ vendor_id: scenario.vendor_id, limit: 100 });
      dispatch({ type: "SET_RETAINED", payload: { memoryCount: memories.length } });
      dispatch({ type: "GO_TO_STEP", payload: "RETAIN" });
    } catch (e) {
      retainCalledRef.current = false;
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }, [state.firstBrief, state.scenario]);

  const runSecondBrief = useCallback(async () => {
    if (!state.scenario) return;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const brief = await api.startNegotiation({
        vendor_id: state.scenario.vendor_id,
        product: state.scenario.product,
        quantity: state.scenario.quantity,
        quoted_price: state.scenario.quoted_price,
      });
      dispatch({ type: "SET_SECOND_BRIEF", payload: brief });
      dispatch({ type: "GO_TO_STEP", payload: "AFTER_MEMORY" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  }, [state.scenario]);

  const handleReset = async () => {
    retainCalledRef.current = false;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await api.resetDemo();
      const s = await api.demoScenario();
      dispatch({ type: "SET_SCENARIO", payload: s as Scenario });
      dispatch({ type: "RESET" });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: String(e) });
    }
  };

  if (!state.scenario && !state.error) {
    return (
      <div className="flex h-full items-center justify-center bg-base-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Brain size={30} className="text-white animate-ai-pulse" />
          </div>
          <p className="text-sm text-slate-500">Initialising demo scenario…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-base-bg">
      <DemoHeader stepIndex={stepIndex} onExit={() => navigate("/")} onReset={handleReset} />
      <StepProgress steps={STEPS} currentIndex={stepIndex} />

      {state.error && (
        <div className="mx-8 mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
          <div>
            <div className="text-sm font-semibold text-danger">Demo API Error</div>
            <div className="mt-1 font-mono text-xs text-slate-500">{state.error}</div>
            <div className="mt-2 text-xs text-slate-600">Check that the backend is running and retry.</div>
          </div>
        </div>
      )}

      <div className="px-8 py-6">
        {state.step === "BEFORE_MEMORY" && (
          <StepBeforeMemory scenario={state.scenario} loading={state.loading} onAnalyze={runFirstBrief} />
        )}
        {state.step === "NEGOTIATION" && state.firstBrief && (
          <StepNegotiation
            brief={state.firstBrief}
            scenario={state.scenario!}
            loading={state.loading}
            onGoToRetain={runRetain}
          />
        )}
        {state.step === "RETAIN" && (
          <StepRetain
            scenario={state.scenario!}
            loading={state.loading}
            retained={state.retained}
            memoryCount={state.retainedMemoryCount}
            onContinue={runSecondBrief}
          />
        )}
        {state.step === "AFTER_MEMORY" && state.loading && (
          <LoadingCard label="Recalling Hindsight memory for second negotiation…" />
        )}
        {state.step === "AFTER_MEMORY" && state.secondBrief && !state.loading && (
          <StepAfterMemory
            brief={state.secondBrief}
            scenario={state.scenario!}
            memoryCount={state.retainedMemoryCount}
            onContinue={() => dispatch({ type: "GO_TO_STEP", payload: "STRATEGY" })}
          />
        )}
        {state.step === "STRATEGY" && state.secondBrief && (
          <StepStrategy
            brief={state.secondBrief}
            scenario={state.scenario!}
            memoryCount={state.retainedMemoryCount}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

// ─── DemoHeader ─────────────────────────────────────────────────────────────
function DemoHeader({
  stepIndex, onExit, onReset,
}: {
  stepIndex: number; onExit: () => void; onReset: () => void;
}) {
  return (
    <div className="relative border-b border-base-border bg-base-surface overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-gradient" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
      <div className="relative flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2">
            <span className="text-lg">🎬</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-hover">
                DEALMIND DEMO MODE
              </div>
              <div className="text-[11px] text-slate-500">
                Remember → Recall → Reason → Negotiate → Learn
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              STEP {stepIndex + 1} OF {STEPS.length}
            </div>
            <div className="text-sm font-bold text-slate-200">
              {STEPS[stepIndex]?.label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-base-border bg-base-surface2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-base-border-light hover:text-slate-200 transition-all"
          >
            <RotateCcw size={12} /> Restart Demo
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-lg border border-base-border bg-base-surface2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-base-border-light hover:text-slate-200 transition-all"
          >
            <X size={12} /> Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StepProgress ────────────────────────────────────────────────────────────
function StepProgress({ steps, currentIndex }: { steps: typeof STEPS; currentIndex: number }) {
  return (
    <div className="flex items-center px-8 py-3 border-b border-base-border bg-base-surface/50">
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  done
                    ? "bg-accent text-black"
                    : active
                    ? "bg-gradient-brand text-white"
                    : "border border-base-border bg-base-surface2 text-slate-600"
                }`}
              >
                {done ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium truncate hidden sm:block ${
                  active ? "text-slate-200" : done ? "text-accent" : "text-slate-600"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px flex-1 transition-colors ${done ? "bg-accent/40" : "bg-base-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── LoadingCard ─────────────────────────────────────────────────────────────
function LoadingCard({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
        <Brain size={30} className="text-white animate-ai-pulse" />
        <div className="absolute -inset-1 rounded-2xl border-2 border-brand/30 animate-memory-glow" />
      </div>
      <p className="text-sm font-medium text-slate-400 mb-2">{label}</p>
      <ThinkingDots />
    </div>
  );
}

// ─── Step 1: BEFORE_MEMORY ───────────────────────────────────────────────────
function StepBeforeMemory({
  scenario, loading, onAnalyze,
}: {
  scenario: Scenario | null;
  loading: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up">
      <div className="space-y-4">
        <div className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Step 1 of 5 — Before Memory
          </div>
          <h2 className="text-xl font-black text-slate-100">First Negotiation</h2>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            DEALMIND will generate a baseline strategy with no prior negotiation history.
            Watch how it behaves before any memory exists.
          </p>
          {scenario && (
            <div className="mt-5 space-y-3">
              <ScenarioRow label="Vendor" value={scenario.vendor_name} />
              <ScenarioRow label="Product" value={scenario.product} />
              <ScenarioRow label="Quantity" value={`${scenario.quantity.toLocaleString()} units`} />
              <ScenarioRow label="Vendor's Quote" value={`₹${scenario.quoted_price.toLocaleString()}`} highlight />
            </div>
          )}
          <div className="mt-6">
            <Button size="lg" onClick={onAnalyze} disabled={loading || !scenario} className="w-full">
              {loading ? (
                <><ThinkingDots /><span className="ml-2">Recalling from Hindsight…</span></>
              ) : (
                <><Brain size={16} /> Analyze &amp; Generate Baseline Strategy</>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-base-surface p-4">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-base-surface2 px-2.5 py-1 text-[10px] font-bold text-slate-500">
            BEFORE MEMORY — BASELINE STRATEGY
          </div>
          <p className="text-xs leading-relaxed text-slate-500 mt-2">
            No relevant negotiation history available. Generating a baseline strategy
            using conservative anchoring off the vendor's quote.
          </p>
          <div className="mt-3 space-y-1.5">
            {["Request volume-based discount", "Explore payment flexibility", "Establish a negotiation anchor"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-700" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <LearningLoopPreview highlight="BEFORE_MEMORY" />
        <div className="rounded-xl border border-warn/20 bg-warn-soft/30 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-warn">
            What the audience sees
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            A first negotiation always starts without evidence. DEALMIND generates a
            calibrated opening strategy — but without memory-backed confidence.
            After this negotiation closes and is retained, the next brief will be dramatically different.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: NEGOTIATION ─────────────────────────────────────────────────────
function StepNegotiation({
  brief, scenario, loading, onGoToRetain,
}: {
  brief: NegotiationBrief;
  scenario: Scenario;
  loading: boolean;
  onGoToRetain: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up">
      <div className="space-y-4">
        <div className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Step 2 of 5 — Negotiation
          </div>
          <h2 className="text-xl font-black text-slate-100">Baseline Strategy Generated</h2>
          <p className="mt-1 text-sm text-slate-500">
            DEALMIND produced an initial brief with{" "}
            <span className="font-semibold text-slate-400">
              {brief.evidence_count} relevant {brief.evidence_count === 1 ? "memory" : "memories"} recalled
            </span>
            {brief.evidence_count === 0 ? " (no prior evidence)" : ""}.
          </p>
          {brief.evidence_count === 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-base-surface2 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              BEFORE MEMORY — BASELINE STRATEGY
            </div>
          )}
        </div>

        {/* Price journey */}
        <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden shadow-card">
          <div className="border-b border-base-border bg-gradient-to-r from-brand-soft to-transparent px-5 py-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-hover">
              Negotiation Outcome
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Vendor's Quote</div>
                <div className="text-3xl font-black tabular-nums text-slate-500 line-through">
                  ₹{scenario.quoted_price.toLocaleString()}
                </div>
              </div>
              <ArrowDown size={20} className="text-brand/50" />
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">Final Agreed Price</div>
                <div className="text-4xl font-black tabular-nums text-accent">
                  ₹{scenario.target_price.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {(((scenario.quoted_price - scenario.target_price) / scenario.quoted_price) * 100).toFixed(1)}% reduction
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-base-border pt-4">
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Outcome</div>
                <Badge tone="success" dot>Successful</Badge>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Tactic</div>
                <div className="text-xs font-bold text-warn capitalize">{scenario.tactic.replace(/_/g, " ")}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">Payment</div>
                <div className="text-xs font-bold text-slate-300">{scenario.payment}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-memory/25 bg-memory-soft/30 p-5">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold text-memory">
            <Brain size={14} />
            🧠 Ready to retain this experience?
          </div>
          <p className="mb-4 text-xs text-slate-500 leading-relaxed">
            This negotiation succeeded. The next step retains the outcome
            to Hindsight so DEALMIND can use it in future negotiations.
          </p>
          <Button size="lg" onClick={onGoToRetain} disabled={loading} className="w-full">
            {loading ? (
              <><ThinkingDots /><span className="ml-2">Retaining…</span></>
            ) : (
              <><Brain size={16} /> Retain to Hindsight</>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <LearningLoopPreview highlight="NEGOTIATION" />
        <MiniBriefCard brief={brief} label="Baseline Brief (Before Memory)" />
      </div>
    </div>
  );
}

// ─── Step 3: RETAIN ──────────────────────────────────────────────────────────
function StepRetain({
  scenario, loading, retained, memoryCount, onContinue,
}: {
  scenario: Scenario;
  loading: boolean;
  retained: boolean;
  memoryCount: number | null;
  onContinue: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up">
      <div className="space-y-4">
        <div className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Step 3 of 5 — Learning
          </div>
          <h2 className="text-xl font-black text-slate-100">
            {loading ? "Writing to Hindsight…" : retained ? "🧠 Memory Retained!" : "Retain to Hindsight"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            {retained
              ? "This negotiation outcome is now part of DEALMIND's organisational memory. The next negotiation will use it."
              : "The outcome was committed to Hindsight using the real API."}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border-2 border-dashed border-brand/30 bg-brand-soft/30 p-8 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow mx-auto mb-3">
              <Brain size={30} className="text-white animate-ai-pulse" />
              <div className="absolute -inset-1 rounded-2xl border-2 border-brand/30 animate-memory-glow" />
            </div>
            <div className="text-sm font-bold text-brand-hover">Writing to Hindsight…</div>
            <div className="mt-2"><ThinkingDots /></div>
          </div>
        )}

        {!loading && retained && (
          <div className="rounded-2xl border-2 border-accent/40 bg-accent-soft/20 p-6 text-center animate-slide-up">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-xl font-black text-accent mb-3">Memory Retained</div>
            <div className="rounded-xl border border-memory/25 bg-memory-soft/50 p-4 text-left space-y-2 mb-4">
              <MemoryRetainRow label="Vendor" value={scenario.vendor_name} />
              <MemoryRetainRow label="Initial quote" value={`₹${scenario.quoted_price.toLocaleString()}`} />
              <MemoryRetainRow label="Final price" value={`₹${scenario.target_price.toLocaleString()}`} highlight />
              <MemoryRetainRow label="Tactic" value={scenario.tactic.replace(/_/g, " ")} />
              <MemoryRetainRow label="Payment" value={scenario.payment} />
              <MemoryRetainRow label="Outcome" value="Successful" />
            </div>
            {memoryCount !== null && (
              <div className="mb-4 text-xs text-slate-500">
                Total vendor memories in Hindsight:{" "}
                <span className="font-bold text-memory">{memoryCount}</span>
              </div>
            )}
            <Button size="lg" onClick={onContinue} disabled={loading} className="w-full">
              <ArrowRight size={16} />
              Continue — Second Negotiation with Memory
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <LearningLoopPreview highlight="RETAIN" />
        <div className="rounded-xl border border-memory/20 bg-memory-soft/30 p-5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-memory">
            What gets stored in Hindsight
          </div>
          <div className="space-y-2">
            {[
              { kind: "negotiation_experience", desc: "Final price, discount, tactic, and outcome" },
              { kind: "payment_pattern", desc: `Accepted ${scenario.payment} payment terms` },
              { kind: "tactic", desc: `'${scenario.tactic.replace(/_/g, " ")}' was successful` },
            ].map((item) => (
              <div key={item.kind} className="flex items-start gap-2 rounded-lg border border-memory/15 bg-memory-soft/40 px-3 py-2">
                <Brain size={11} className="mt-0.5 shrink-0 text-memory" />
                <div>
                  <div className="text-[10px] font-bold text-memory uppercase tracking-wide">{item.kind}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: AFTER_MEMORY ─────────────────────────────────────────────────────
function StepAfterMemory({
  brief, scenario, memoryCount, onContinue,
}: {
  brief: NegotiationBrief;
  scenario: Scenario;
  memoryCount: number | null;
  onContinue: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up">
      <div className="space-y-4">
        <div className="rounded-xl border border-base-border bg-base-surface p-6 shadow-card">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Step 4 of 5 — Memory Recall
          </div>
          <h2 className="text-xl font-black text-slate-100">AFTER MEMORY</h2>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            Same vendor, same quote — but now DEALMIND has recalled real experience.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-3 py-1 text-xs font-bold text-memory">
              <Brain size={12} className="animate-ai-pulse" />
              {brief.evidence_count} relevant {brief.evidence_count === 1 ? "memory" : "memories"} recalled
            </span>
            {memoryCount !== null && memoryCount !== brief.evidence_count && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-base-border bg-base-surface2 px-2.5 py-1 text-[10px] text-slate-500">
                {memoryCount} total vendor memories
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-memory/25 bg-memory-soft/20 overflow-hidden">
          <div className="border-b border-memory/20 bg-memory-soft/40 px-5 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-memory">
              <Brain size={13} className="animate-ai-pulse" />
              🧠 Relevant memories recalled
            </div>
          </div>
          <div className="p-5 space-y-3">
            {brief.memory_snippets.length > 0 ? (
              brief.memory_snippets.map((s, i) => (
                <div key={i} className="rounded-lg border border-memory/15 bg-memory-soft/40 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-memory">
                    <Brain size={10} /> Memory {i + 1}
                  </div>
                  {s}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">Memory recalled but no snippets returned.</div>
            )}
            <div className="mt-2 rounded-lg border border-accent/20 bg-accent-soft/30 p-4 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Key recalled facts</div>
              {brief.historical_avg != null && (
                <RecalledFact label="Previous successful price" value={`₹${brief.historical_avg}`} />
              )}
              <RecalledFact label="Successful tactic" value={brief.recommended_tactic.replace(/_/g, " ")} />
              <RecalledFact label="Payment pattern" value={brief.payment_terms_suggestion} />
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={onContinue}>
          <Sparkles size={16} />
          View Personalized AI Strategy
        </Button>
      </div>

      <div className="space-y-4">
        <LearningLoopPreview highlight="AFTER_MEMORY" />
        <MiniBriefCard brief={brief} label="Strategy with Recalled Memory" highlight />
      </div>
    </div>
  );
}

// ─── Step 5: STRATEGY ────────────────────────────────────────────────────────
function StepStrategy({
  brief, scenario, memoryCount, onReset,
}: {
  brief: NegotiationBrief;
  scenario: Scenario;
  memoryCount: number | null;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="rounded-xl border border-brand/25 bg-base-surface overflow-hidden shadow-card">
        <div className="border-b border-brand/20 bg-gradient-to-r from-brand-soft to-transparent px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
                Step 5 of 5 — 🤖 Personalized AI Strategy
              </div>
              <div className="text-xl font-black text-slate-100">{brief.vendor_name}</div>
              <div className="mt-0.5 text-sm text-slate-500">
                {brief.product} · {brief.quantity.toLocaleString()} units
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Current quote</div>
              <div className="text-2xl font-black tabular-nums text-slate-100">
                ₹{brief.quoted_price.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-memory/30 bg-memory-soft px-2.5 py-1 text-xs font-semibold text-memory">
              <Brain size={12} />
              {brief.evidence_count} {brief.evidence_count === 1 ? "memory" : "memories"} recalled
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              <Sparkles size={12} />
              Personalized
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
          <StratBox icon={Target} label="Target Range" value={`₹${brief.target_min} – ₹${brief.target_max}`} tone="brand" />
          <StratBox icon={TrendingDown} label="Historical Result" value={brief.historical_avg != null ? `₹${brief.historical_avg}` : "N/A"} tone="accent" />
          <StratBox icon={Flame} label="Successful Tactic" value={brief.recommended_tactic.replace(/_/g, " ")} tone="warn" />
          <StratBox icon={Wallet} label="Payment" value={brief.payment_terms_suggestion} tone="default" />
        </div>

        {brief.memory_snippets.length > 0 && (
          <div className="border-t border-base-border px-5 py-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-memory">
              🧠 Memory Evidence
            </div>
            <div className="space-y-2">
              {brief.memory_snippets.slice(0, 3).map((s, i) => (
                <div key={i} className="rounded-lg border border-memory/15 bg-memory-soft/50 px-3 py-2 text-xs leading-relaxed text-slate-400">
                  <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-memory">
                    <Brain size={10} /> Memory {i + 1}
                  </div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-base-border px-5 py-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            AI Reasoning
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{brief.rationale}</p>
          <p className="mt-2 text-[11px] text-slate-600 italic">
            Note: Historical price (₹{brief.historical_avg ?? scenario.target_price}) is an evidence-based
            reference — not a guaranteed outcome.
          </p>
        </div>
      </div>

      <LearningLoopFull scenario={scenario} brief={brief} />

      <div className="flex justify-center gap-3 pb-6">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw size={14} /> Restart Demo
        </Button>
      </div>
    </div>
  );
}

// ─── Full Learning Loop Visual (Step 5) ─────────────────────────────────────
function LearningLoopFull({ scenario, brief }: { scenario: Scenario; brief: NegotiationBrief }) {
  const nodes = [
    { icon: "💼", label: "PAST EXPERIENCE", color: "border-brand/30 bg-brand-soft", labelColor: "text-brand-hover", detail: `${scenario.vendor_name} · ₹${scenario.quoted_price.toLocaleString()}` },
    { icon: "🧠", label: "HINDSIGHT RETAIN", color: "border-memory/30 bg-memory-soft", labelColor: "text-memory", detail: "Outcome written to memory" },
    { icon: "💾", label: "MEMORY", color: "border-memory/25 bg-memory-soft/70", labelColor: "text-memory", detail: `${brief.evidence_count} experience${brief.evidence_count !== 1 ? "s" : ""} stored` },
    { icon: "🔍", label: "HINDSIGHT RECALL", color: "border-accent/30 bg-accent-soft", labelColor: "text-accent", detail: `${brief.evidence_count} memor${brief.evidence_count !== 1 ? "ies" : "y"} recalled` },
    { icon: "⚡", label: "AI STRATEGY", color: "border-warn/30 bg-warn-soft", labelColor: "text-warn", detail: `Target ₹${brief.target_min}–${brief.target_max}` },
    { icon: "📈", label: "BETTER NEGOTIATION", color: "border-accent/40 bg-accent-soft", labelColor: "text-accent", detail: "Evidence-backed outcome" },
  ];

  return (
    <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden shadow-card">
      <div className="border-b border-base-border bg-gradient-to-r from-brand-soft to-transparent px-6 py-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-hover mb-0.5">
          🎬 The DEALMIND Learning Loop
        </div>
        <div className="text-sm font-bold text-slate-200">
          How one successful negotiation makes the next one smarter
        </div>
      </div>
      <div className="p-6">
        <div className="hidden md:flex items-start">
          {nodes.map((node, i) => (
            <div key={i} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center min-w-0 flex-1">
                <div className={`w-full rounded-xl border p-3 text-center ${node.color}`}>
                  <div className="text-2xl mb-1">{node.icon}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${node.labelColor}`}>{node.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{node.detail}</div>
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className="flex items-center mt-6 mx-1">
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="md:hidden space-y-2">
          {nodes.map((node, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-full rounded-xl border p-3 ${node.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{node.icon}</span>
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${node.labelColor}`}>{node.label}</div>
                    <div className="text-[10px] text-slate-500">{node.detail}</div>
                  </div>
                </div>
              </div>
              {i < nodes.length - 1 && <ArrowDown size={14} className="text-slate-700" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LearningLoopPreview ─────────────────────────────────────────────────────
function LearningLoopPreview({ highlight }: { highlight: DemoStep }) {
  const items = [
    { id: "BEFORE_MEMORY", icon: "💼", label: "First Negotiation", sub: "No memory yet" },
    { id: "NEGOTIATION",   icon: "↗",  label: "Successful Outcome", sub: "₹10k → ₹8.5k" },
    { id: "RETAIN",        icon: "🧠", label: "Retain to Hindsight", sub: "Memory created" },
    { id: "AFTER_MEMORY",  icon: "🔍", label: "Recall Memory", sub: "Past experience" },
    { id: "STRATEGY",      icon: "⚡", label: "Personalized Strategy", sub: "Memory-backed" },
  ] as const;

  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4 shadow-card">
      <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
        Demo Learning Loop
      </div>
      <div className="space-y-1">
        {items.map((item, i) => {
          const currentIdx = items.findIndex((x) => x.id === highlight);
          const isActive = item.id === highlight;
          const isDone = currentIdx > i;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all ${
                  isActive ? "bg-gradient-brand" : isDone ? "bg-accent/20 border border-accent/40" : "border border-base-border bg-base-surface2"
                }`}>
                  {isDone ? <CheckCircle2 size={12} className="text-accent" /> : item.icon}
                </div>
                {i < items.length - 1 && (
                  <div className={`w-px h-4 mt-0.5 ${isDone ? "bg-accent/40" : "bg-base-border"}`} />
                )}
              </div>
              <div className={`${isActive ? "opacity-100" : isDone ? "opacity-60" : "opacity-30"}`}>
                <div className={`text-xs font-semibold ${isActive ? "text-slate-100" : "text-slate-400"}`}>{item.label}</div>
                <div className="text-[10px] text-slate-600">{item.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MiniBriefCard ────────────────────────────────────────────────────────────
function MiniBriefCard({ brief, label, highlight }: { brief: NegotiationBrief; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-card ${highlight ? "border-memory/30 bg-memory-soft/20" : "border-base-border bg-base-surface"}`}>
      <div className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${highlight ? "text-memory" : "text-slate-600"}`}>
        {label}
      </div>
      <div className="space-y-2">
        <MiniRow label="Target range" value={`₹${brief.target_min} – ₹${brief.target_max}`} />
        <MiniRow label="Opening counter" value={`₹${brief.opening_counter}`} />
        <MiniRow label="Recommended tactic" value={brief.recommended_tactic.replace(/_/g, " ")} />
        <MiniRow label="Payment suggestion" value={brief.payment_terms_suggestion} />
        {brief.historical_avg != null && (
          <MiniRow label="Historical avg" value={`₹${brief.historical_avg}`} accent />
        )}
        <MiniRow
          label="Confidence"
          value={brief.evidence_count === 0 ? "Low (no evidence)" : `${brief.confidence} (${brief.evidence_count} memories)`}
          accent={brief.evidence_count > 0}
        />
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function ScenarioRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-base-border bg-base-surface2 px-3 py-2 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${highlight ? "text-brand-hover" : "text-slate-200"}`}>{value}</span>
    </div>
  );
}

function MemoryRetainRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold ${highlight ? "text-accent" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function RecalledFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-200 capitalize">{value}</span>
    </div>
  );
}

function MiniRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={`font-bold capitalize ${accent ? "text-accent" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function StratBox({
  icon: Icon, label, value, tone,
}: {
  icon: any; label: string; value: string; tone: "brand" | "accent" | "warn" | "default";
}) {
  const toneMap = {
    brand: "border-brand/20 bg-brand-soft text-brand-hover",
    accent: "border-accent/20 bg-accent-soft text-accent",
    warn: "border-warn/20 bg-warn-soft text-warn",
    default: "border-base-border bg-base-surface2 text-slate-200",
  };
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
        <Icon size={12} /> {label}
      </div>
      <div className="text-sm font-black capitalize">{value}</div>
    </div>
  );
}
