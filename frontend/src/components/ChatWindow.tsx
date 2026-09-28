import { useState, useRef, useEffect } from "react";
import { Send, Brain, User, Building2, Sparkles } from "lucide-react";
import type { ChatMessage } from "../types";
import { ThinkingDots } from "./ui";

export default function ChatWindow({
  messages, onSend, loading, suggestedResponse,
}: {
  messages: ChatMessage[];
  onSend: (vendorMessage: string) => void;
  loading: boolean;
  suggestedResponse?: string;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = () => {
    if (!draft.trim() || loading) return;
    onSend(draft.trim());
    setDraft("");
  };

  const useSuggestion = (text: string) => {
    setDraft(text);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollable">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center max-w-md mx-auto">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
              <Brain size={24} className="text-white animate-ai-pulse" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-memory mb-1">
              🧠 MEMORY-BACKED AI ASSISTANT
            </div>
            <div className="text-base font-bold text-slate-100">DEALMIND is ready.</div>
            
            <div className="my-4 w-full rounded-xl border border-memory/20 bg-memory-soft/40 p-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Based on recalled experience:
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">✓</span> Previous successful tactic identified
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">✓</span> Historical price range evaluated
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">✓</span> Vendor payment pattern analyzed
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">✓</span> Relevant negotiation memories loaded
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium mb-1">TRY A VENDOR MESSAGE</div>
            <div className="text-[11px] text-slate-500">
              Enter what the vendor proposed (e.g., <span className="text-slate-300 italic">"We can do ₹9,700 per unit."</span>) and DEALMIND will generate a memory-backed counter-offer.
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} onUse={useSuggestion} />
        ))}

        {loading && (
          <div className="flex justify-end">
            <div className="rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 max-w-sm">
              <div className="space-y-1 text-[11px] text-brand-hover">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-memory">
                  <Brain size={12} className="animate-ai-pulse" />
                  🧠 Recalling relevant experience…
                </div>
                <div className="text-slate-400 font-medium">Analyzing vendor response…</div>
                <div className="text-slate-400 font-medium">Generating recommended response…</div>
              </div>
              <div className="mt-2">
                <ThinkingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested quick-use (from last DEALMIND message) */}
      {suggestedResponse && messages.length > 0 && !loading && (
        <div className="border-t border-base-border bg-brand-soft/30 px-4 py-2.5">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
            <Sparkles size={10} />
            Quick use — DEALMIND suggestion
          </div>
          <button
            onClick={() => useSuggestion(suggestedResponse)}
            className="w-full rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-left text-xs text-slate-300 hover:border-brand/40 hover:bg-brand/10 transition-colors"
          >
            {suggestedResponse.length > 120 ? suggestedResponse.slice(0, 120) + "…" : suggestedResponse}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-base-border p-3">
        <div className="relative flex-1">
          <input
            className="w-full rounded-lg border border-base-border bg-base-surface2 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
            placeholder='Type what the vendor said (e.g. "We can do ₹9,700 per unit.")…'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Building2 size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
        </div>
        <button
          onClick={submit}
          disabled={loading || !draft.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ message, onUse }: { message: ChatMessage; onUse: (s: string) => void }) {
  const isVendor = message.sender === "vendor";
  const isDealmind = message.sender === "dealmind";

  // Split DEALMIND message into response + reasoning
  let response = message.message;
  let reasoning = "";
  if (isDealmind) {
    const parts = message.message.split("\n\n");
    response = parts[0] || message.message;
    reasoning = parts.slice(1).join("\n\n");
  }

  if (isVendor) {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="flex items-start gap-2.5 max-w-[85%]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-base-border bg-base-surface2 mt-1">
            <Building2 size={13} className="text-slate-500" />
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold text-slate-600">Vendor</div>
            <div className="rounded-xl rounded-tl-sm border border-base-border bg-base-surface2 px-3.5 py-2.5 text-sm leading-relaxed text-slate-300">
              {message.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end animate-slide-up">
      <div className="flex items-start gap-2.5 max-w-[90%]">
        <div>
          <div className="mb-1 flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-hover">
            🧠 MEMORY-BACKED RECOMMENDATION
          </div>
          <div className="rounded-xl rounded-tr-sm border border-brand/25 bg-brand-soft px-4 py-3">
            {/* Suggested response */}
            <div className="text-sm leading-relaxed text-slate-200 font-medium">{response}</div>

            {/* Reasoning */}
            {reasoning && (
              <div className="mt-2.5 border-t border-brand/20 pt-2.5 text-xs leading-relaxed text-slate-500">
                {reasoning}
              </div>
            )}

            {/* Use button */}
            <button
              onClick={() => onUse(response)}
              className="mt-2.5 flex items-center gap-1 rounded-md border border-brand/20 bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand-hover hover:bg-brand/20 transition-colors"
            >
              <Sparkles size={10} /> Use this response
            </button>
          </div>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand mt-1">
          <Brain size={13} className="text-white" />
        </div>
      </div>
    </div>
  );
}
