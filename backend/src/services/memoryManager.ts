import { MAX_MESSAGE_HISTORY, SESSION_INACTIVITY_TIMEOUT_MS } from "../config/constants";
import type { ConversationMessage, ConversationState, SessionData } from "../types/conversation";
import type { LeadState } from "../types/lead";

const memoryStore = new Map<string, SessionData>();

function createEmptyLeadState(conversationId: string): LeadState {
  return {
    conversationId,
    customer: {
      name: null,
      phone: null,
      email: null
    },
    travel: {
      destination: null,
      departureCity: null,
      travelDate: null,
      travellers: null,
      budget: null,
      duration: null,
      tripType: null,
      specialRequirements: null
    },
    qualification: {
      leadScore: 0,
      confidence: "Low",
      reason: "",
      summary: ""
    },
    createdAt: null,
    updatedAt: null
  };
}

function createConversationState(conversationId: string): ConversationState {
  const now = new Date().toISOString();
  return {
    conversationId,
    messageHistory: [],
    conversationPhase: "NEW",
    hasAskedForContact: false,
    lastIntentTrend: "steady",
    lastActivityAt: now,
    turnsSinceContactAsk: 0
  };
}

function trimHistory(history: ConversationMessage[]): ConversationMessage[] {
  if (history.length <= MAX_MESSAGE_HISTORY) {
    return history;
  }
  return history.slice(history.length - MAX_MESSAGE_HISTORY);
}

function applyAbandonment(session: SessionData): SessionData {
  const elapsed = Date.now() - new Date(session.conversationState.lastActivityAt).getTime();
  if (elapsed > SESSION_INACTIVITY_TIMEOUT_MS && session.conversationState.conversationPhase !== "ABANDONED") {
    return {
      ...session,
      conversationState: {
        ...session.conversationState,
        conversationPhase: "ABANDONED"
      }
    };
  }
  return session;
}

export const memoryManager = {
  getState(conversationId: string): SessionData {
    const existing = memoryStore.get(conversationId);
    if (!existing) {
      const fresh = {
        conversationState: createConversationState(conversationId),
        leadState: createEmptyLeadState(conversationId)
      };
      memoryStore.set(conversationId, fresh);
      return fresh;
    }

    const aged = applyAbandonment(existing);
    if (aged !== existing) {
      memoryStore.set(conversationId, aged);
    }
    return aged;
  },

  setState(conversationId: string, data: SessionData): void {
    memoryStore.set(conversationId, {
      conversationState: {
        ...data.conversationState,
        messageHistory: trimHistory(data.conversationState.messageHistory)
      },
      leadState: data.leadState
    });
  }
};

export function createSessionSnapshot(conversationId: string): SessionData {
  return {
    conversationState: createConversationState(conversationId),
    leadState: createEmptyLeadState(conversationId)
  };
}
