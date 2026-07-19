export type ConversationPhase =
  | "NEW"
  | "EXPLORING"
  | "QUALIFYING"
  | "AWAITING_CONTACT"
  | "QUALIFIED"
  | "DECLINED_CONTACT"
  | "ABANDONED";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

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
  confidence: "Low" | "Medium" | "High";
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

export interface ChatResponseDTO {
  conversationId: string;
  reply: string;
  leadState: LeadState;
  conversationPhase: ConversationPhase;
}

export interface UIState {
  conversationId: string | null;
  messages: Message[];
  leadState: LeadState;
  conversationPhase: ConversationPhase;
  loading: boolean;
  typing: boolean;
  error: string | null;
}
