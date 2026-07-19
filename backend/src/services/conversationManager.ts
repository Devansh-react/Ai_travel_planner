import { MAX_MESSAGE_HISTORY, RECENT_HISTORY_FOR_PROMPTS } from "../config/constants";
import { leadRepository } from "../repository/leadRepository";
import type { ChatTurnResult } from "../types/conversation";
import type { ConversationMessage, SessionData } from "../types/conversation";
import type { LeadState } from "../types/lead";
import type { ExtractionOutput, IntentOutput, ReplyInput } from "../types/llm";
import { logger } from "../utils/logger";
import { extractionService } from "./extractionService";
import { intentAnalyzer } from "./intentAnalyzer";
import { leadScoringEngine } from "./leadScoringEngine";
import { memoryManager } from "./memoryManager";
import { qualificationService } from "./qualificationService";
import { replyGenerator } from "./replyGenerator";

function now(): string {
  return new Date().toISOString();
}

function createAssistantMessage(content: string): ConversationMessage {
  return {
    role: "assistant",
    content,
    timestamp: now()
  };
}

function createUserMessage(content: string): ConversationMessage {
  return {
    role: "user",
    content,
    timestamp: now()
  };
}

function recentHistory(messageHistory: ConversationMessage[]): { role: string; content: string }[] {
  return messageHistory.slice(-RECENT_HISTORY_FOR_PROMPTS).map((message) => ({
    role: message.role,
    content: message.content
  }));
}

function appendSpecialRequirement(existing: string | null, next: string): string {
  const current = existing?.trim() ?? "";
  const incoming = next.trim();
  if (!current) {
    return incoming;
  }
  if (current.toLowerCase().includes(incoming.toLowerCase())) {
    return current;
  }
  if (incoming.toLowerCase().includes(current.toLowerCase())) {
    return incoming;
  }
  return `${current}; ${incoming}`;
}

function mergeExtractionIntoLeadState(leadState: LeadState, extraction: ExtractionOutput): LeadState {
  const next: LeadState = {
    ...leadState,
    customer: { ...leadState.customer },
    travel: { ...leadState.travel },
    qualification: { ...leadState.qualification }
  };

  if (extraction.customer) {
    if (extraction.customer.name) {
      next.customer.name = extraction.customer.name.trim();
    }
    if (extraction.customer.phone) {
      next.customer.phone = extraction.customer.phone.trim();
    }
    if (extraction.customer.email) {
      next.customer.email = extraction.customer.email.trim();
    }
  }

  if (extraction.travel) {
    if (extraction.travel.destination) {
      next.travel.destination = extraction.travel.destination.trim();
    }
    if (extraction.travel.departureCity) {
      next.travel.departureCity = extraction.travel.departureCity.trim();
    }
    if (extraction.travel.travelDate) {
      next.travel.travelDate = extraction.travel.travelDate.trim();
    }
    if (typeof extraction.travel.travellers === "number") {
      next.travel.travellers = extraction.travel.travellers;
    }
    if (extraction.travel.budget) {
      next.travel.budget = extraction.travel.budget.trim();
    }
    if (extraction.travel.duration) {
      next.travel.duration = extraction.travel.duration.trim();
    }
    if (extraction.travel.tripType) {
      next.travel.tripType = extraction.travel.tripType.trim();
    }
    if (extraction.travel.specialRequirements) {
      next.travel.specialRequirements = appendSpecialRequirement(next.travel.specialRequirements, extraction.travel.specialRequirements);
    }
  }

  return next;
}

function normalizeSession(session: SessionData): SessionData {
  return {
    conversationState: {
      ...session.conversationState,
      messageHistory: session.conversationState.messageHistory.slice(-MAX_MESSAGE_HISTORY)
    },
    leadState: session.leadState
  };
}

export const conversationManager = {
  async handleMessage(conversationId: string, message: string): Promise<ChatTurnResult> {
    const existing = memoryManager.getState(conversationId);
    const userMessage = createUserMessage(message);

    const withUserMessage: SessionData = normalizeSession({
      conversationState: {
        ...existing.conversationState,
        conversationId,
        messageHistory: [...existing.conversationState.messageHistory, userMessage],
        lastActivityAt: now()
      },
      leadState: existing.leadState
    });

    const extraction = await extractionService.extract({
      message,
      recentHistory: recentHistory(withUserMessage.conversationState.messageHistory),
      currentLeadState: {
        customer: withUserMessage.leadState.customer,
        travel: withUserMessage.leadState.travel
      }
    });

    const mergedLeadState = mergeExtractionIntoLeadState(withUserMessage.leadState, extraction);

    const intent: IntentOutput = await intentAnalyzer.analyzeIntent({
      message,
      currentLeadState: {
        customer: mergedLeadState.customer,
        travel: mergedLeadState.travel
      },
      priorTrend: withUserMessage.conversationState.lastIntentTrend
    });

    const qualification = leadScoringEngine.computeQualification(mergedLeadState, intent);
    const decision = qualificationService.decide({
      conversationPhase: withUserMessage.conversationState.conversationPhase,
      hasAskedForContact: withUserMessage.conversationState.hasAskedForContact,
      turnsSinceContactAsk: withUserMessage.conversationState.turnsSinceContactAsk,
      leadState: mergedLeadState,
      qualification,
      currentMessage: message
    });

    const shouldAskForContact = decision.shouldAskForContact;
    const finalLeadState: LeadState = {
      ...mergedLeadState,
      qualification,
      createdAt: mergedLeadState.createdAt,
      updatedAt: mergedLeadState.updatedAt
    };

    if (decision.shouldPersistLead) {
      const timestamp = now();
      finalLeadState.createdAt = finalLeadState.createdAt ?? timestamp;
      finalLeadState.updatedAt = timestamp;
      try {
        await leadRepository.upsertLead(finalLeadState);
      } catch (error) {
        logger.error({ conversationId, error: error instanceof Error ? error.message : String(error) }, "Persistence failed");
      }
    }

    const reply = await replyGenerator.generateReply({
      recentHistory: recentHistory(withUserMessage.conversationState.messageHistory),
      leadState: {
        customer: finalLeadState.customer,
        travel: finalLeadState.travel
      },
      shouldAskForContact,
      conversationPhase: decision.newPhase
    });

    const nextConversationState = {
      ...withUserMessage.conversationState,
      conversationPhase: decision.newPhase,
      hasAskedForContact: withUserMessage.conversationState.hasAskedForContact || shouldAskForContact,
      lastIntentTrend: intent.trendDirection,
      turnsSinceContactAsk: shouldAskForContact
        ? 0
        : decision.newPhase === "AWAITING_CONTACT"
          ? withUserMessage.conversationState.turnsSinceContactAsk + 1
          : 0,
      lastActivityAt: now(),
      messageHistory: [...withUserMessage.conversationState.messageHistory, createAssistantMessage(reply)]
    };

    const nextSession: SessionData = normalizeSession({
      conversationState: nextConversationState,
      leadState: finalLeadState
    });

    memoryManager.setState(conversationId, nextSession);

    logger.info(
      {
        conversationId,
        fromPhase: withUserMessage.conversationState.conversationPhase,
        toPhase: decision.newPhase,
        leadScore: qualification.leadScore
      },
      "Conversation turn processed"
    );

    return {
      conversationId,
      reply,
      leadState: nextSession.leadState,
      conversationPhase: nextSession.conversationState.conversationPhase
    };
  }
};
