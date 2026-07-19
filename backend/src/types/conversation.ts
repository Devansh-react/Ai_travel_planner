import type { ConversationPhase, LeadState } from "./lead";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationState {
  conversationId: string;
  messageHistory: ConversationMessage[];
  conversationPhase: ConversationPhase;
  hasAskedForContact: boolean;
  lastIntentTrend: "rising" | "steady" | "declining";
  lastActivityAt: string;
  turnsSinceContactAsk: number;
}

export interface SessionData {
  conversationState: ConversationState;
  leadState: LeadState;
}

export interface ChatTurnResult {
  conversationId: string;
  reply: string;
  leadState: LeadState;
  conversationPhase: ConversationPhase;
}
