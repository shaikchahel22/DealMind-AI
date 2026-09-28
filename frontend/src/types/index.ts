export interface Vendor {
  id: number;
  name: string;
  category: string;
  contact_name?: string | null;
  price_flexibility: number;
  payment_flexibility: number;
  volume_sensitivity: number;
  delivery_reliability: number;
  quality_score: number;
  best_tactic?: string | null;
  negotiation_count: number;
}

export interface Negotiation {
  id: number;
  vendor_id: number;
  vendor_name?: string | null;
  product: string;
  quantity: number;
  initial_price: number;
  final_price?: number | null;
  payment_terms?: string | null;
  delivery_days?: number | null;
  tactic?: string | null;
  outcome: "in_progress" | "successful" | "unsuccessful";
  quality_score?: number | null;
  delivery_on_time?: number | null;
  created_at: string;
  closed_at?: string | null;
}

export interface TacticEvidence {
  wins: number;
  total: number;
  rate: number;
}

export interface NegotiationBrief {
  negotiation_id: number;
  vendor_id: number;
  vendor_name: string;
  product: string;
  quantity: number;
  quoted_price: number;
  historical_min?: number | null;
  historical_max?: number | null;
  historical_avg?: number | null;
  target_min: number;
  target_max: number;
  opening_counter: number;
  walk_away: number;
  recommended_tactic: string;
  tactic_evidence?: TacticEvidence | null;
  payment_terms_suggestion: string;
  delivery_risk: "low" | "medium" | "high";
  evidence_count: number;
  confidence: "low" | "medium" | "high";
  memory_snippets: string[];
  rationale: string;
}

export interface ChatMessage {
  id: number;
  sender: "vendor" | "user" | "dealmind";
  message: string;
  timestamp: string;
}

export interface ChatSuggestion {
  vendor_price_mentioned?: number | null;
  suggested_response: string;
  reasoning: string;
  tactic: string;
}

export interface MemoryRecordOut {
  id: number | string;
  vendor_id?: number | null;
  negotiation_id?: number | null;
  kind: string;
  content: string;
  confidence: number;
  created_at: string;
}

export interface DashboardStats {
  active_negotiations: number;
  vendor_count: number;
  negotiation_count: number;
  memory_insight_count: number;
  recent_negotiations: Negotiation[];
  recent_learnings: MemoryRecordOut[];
}
