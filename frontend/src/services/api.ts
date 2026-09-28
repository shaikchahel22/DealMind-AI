import type {
  Vendor, Negotiation, NegotiationBrief, ChatMessage, ChatSuggestion,
  MemoryRecordOut, DashboardStats,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardStats>("/api/dashboard"),

  vendors: () => request<Vendor[]>("/api/vendors"),
  vendor: (id: number) => request<Vendor>(`/api/vendors/${id}`),
  createVendor: (payload: { name: string; category: string; contact_name?: string }) =>
    request<Vendor>("/api/vendors", { method: "POST", body: JSON.stringify(payload) }),

  negotiations: (vendorId?: number) =>
    request<Negotiation[]>(`/api/negotiations${vendorId ? `?vendor_id=${vendorId}` : ""}`),
  negotiation: (id: number) => request<Negotiation>(`/api/negotiations/${id}`),
  startNegotiation: (payload: { vendor_id: number; product: string; quantity: number; quoted_price: number }) =>
    request<NegotiationBrief>("/api/negotiations", { method: "POST", body: JSON.stringify(payload) }),
  brief: (negotiationId: number) => request<NegotiationBrief>(`/api/negotiations/${negotiationId}/brief`),
  messages: (negotiationId: number) => request<ChatMessage[]>(`/api/negotiations/${negotiationId}/messages`),
  chat: (negotiationId: number, vendor_message: string) =>
    request<ChatSuggestion>(`/api/negotiations/${negotiationId}/chat`, {
      method: "POST", body: JSON.stringify({ vendor_message }),
    }),
  saveOutcome: (negotiationId: number, payload: {
    final_price: number; payment_terms?: string; delivery_days?: number;
    tactic?: string; outcome: "successful" | "unsuccessful";
    quality_score?: number; delivery_on_time?: boolean;
  }) =>
    request<Negotiation>(`/api/negotiations/${negotiationId}/outcome`, {
      method: "POST", body: JSON.stringify(payload),
    }),

  memory: (params: { vendor_id?: number; kind?: string; q?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.vendor_id) qs.set("vendor_id", String(params.vendor_id));
    if (params.kind) qs.set("kind", params.kind);
    if (params.q) qs.set("q", params.q);
    if (params.limit) qs.set("limit", String(params.limit));
    return request<MemoryRecordOut[]>(`/api/memory?${qs.toString()}`);
  },
  memoryStatus: () => request<{ backend: string; total_records: number; note?: string }>("/api/memory/status"),
  integrationsStatus: () => request<{
    overall: "ok" | "degraded";
    database: { status: string; error: string | null };
    hindsight: { mode: string; active: boolean; configured: boolean; sdk_available: boolean; status: string; error: string | null };
    llm: { mode: string; active: boolean; configured: boolean; model: string | null; error: string | null };
  }>("/api/integrations/status"),

  demoScenario: () =>
    request<{
      vendor_id: number;
      vendor_name: string;
      product: string;
      quantity: number;
      quoted_price: number;
      target_price: number;
      tactic: string;
      payment: string;
      outcome: string;
      vendor_negotiation_count: number;
      vendor_best_tactic: string | null;
    }>("/api/demo/scenario"),

  resetDemo: () =>
    request<{ status: string; vendor_id: number; vendor_name: string }>("/api/demo/reset", {
      method: "POST",
    }),
};
