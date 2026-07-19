export type ConversationPhase =
  | "NEW"
  | "EXPLORING"
  | "QUALIFYING"
  | "AWAITING_CONTACT"
  | "QUALIFIED"
  | "DECLINED_CONTACT"
  | "ABANDONED";

export type Confidence = "Low" | "Medium" | "High";

export interface LeadCustomer {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface LeadTravel {
  destination: string | null;
  departureCity: string | null;
  travelDate: string | null;
  travellers: number | null;
  budget: string | null;
  duration: string | null;
  tripType: string | null;
  specialRequirements: string | null;
}

export interface Qualification {
  leadScore: number;
  confidence: Confidence;
  reason: string;
  summary: string;
}

export interface LeadState {
  conversationId: string;
  customer: LeadCustomer;
  travel: LeadTravel;
  qualification: Qualification;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LeadRow {
  id?: string;
  conversation_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  travel_destination: string | null;
  travel_departure_city: string | null;
  travel_date: string | null;
  travel_travellers: number | null;
  travel_budget: string | null;
  travel_duration: string | null;
  travel_trip_type: string | null;
  travel_special_requirements: string | null;
  lead_score: number;
  confidence: Confidence;
  reason: string;
  summary: string;
  created_at: string;
  updated_at: string;
}
