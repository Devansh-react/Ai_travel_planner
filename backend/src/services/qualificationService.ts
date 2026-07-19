import { DECLINE_PATTERNS, MAX_TURNS_AWAITING_CONTACT, QUALIFYING_SCORE_THRESHOLD } from "../config/constants";
import type { QualificationDecision, QualificationDecisionInput } from "../types/llm";

function hasTravelContext(input: QualificationDecisionInput): boolean {
  return Boolean(
    input.leadState.travel.destination ||
      input.leadState.travel.tripType ||
      input.leadState.travel.travelDate ||
      input.leadState.travel.travellers ||
      input.leadState.travel.budget ||
      input.leadState.travel.duration ||
      input.leadState.travel.departureCity ||
      input.leadState.travel.specialRequirements
  );
}

function hasContactInfo(input: QualificationDecisionInput): boolean {
  return Boolean(input.leadState.customer.name && input.leadState.customer.phone);
}

function isDeclineMessage(message: string): boolean {
  return DECLINE_PATTERNS.some((pattern) => pattern.test(message));
}

export const qualificationService = {
  decide(input: QualificationDecisionInput): QualificationDecision {
    const contactInfoPresent = hasContactInfo(input);
    const travelContextPresent = hasTravelContext(input);

    if (contactInfoPresent && travelContextPresent) {
      return {
        shouldAskForContact: false,
        shouldPersistLead: true,
        newPhase: "QUALIFIED"
      };
    }

    if (contactInfoPresent && !travelContextPresent) {
      return {
        shouldAskForContact: false,
        shouldPersistLead: false,
        newPhase: input.conversationPhase === "NEW" ? "EXPLORING" : input.conversationPhase
      };
    }

    if (input.conversationPhase === "DECLINED_CONTACT" && !contactInfoPresent) {
      return {
        shouldAskForContact: false,
        shouldPersistLead: false,
        newPhase: "DECLINED_CONTACT"
      };
    }

    if (
      !input.hasAskedForContact &&
      input.qualification.leadScore >= QUALIFYING_SCORE_THRESHOLD &&
      input.leadState.travel.budget !== null
    ) {
      return {
        shouldAskForContact: true,
        shouldPersistLead: false,
        newPhase: "AWAITING_CONTACT"
      };
    }

    if (input.conversationPhase === "AWAITING_CONTACT" && isDeclineMessage(input.currentMessage)) {
      return {
        shouldAskForContact: false,
        shouldPersistLead: false,
        newPhase: "DECLINED_CONTACT"
      };
    }

    if (input.conversationPhase === "AWAITING_CONTACT") {
      const turnsSinceContactAsk = input.turnsSinceContactAsk ?? 0;
      if (turnsSinceContactAsk >= MAX_TURNS_AWAITING_CONTACT) {
        return {
          shouldAskForContact: false,
          shouldPersistLead: false,
          newPhase: "DECLINED_CONTACT"
        };
      }

      return {
        shouldAskForContact: false,
        shouldPersistLead: false,
        newPhase: "AWAITING_CONTACT"
      };
    }

    if (travelContextPresent) {
      return {
        shouldAskForContact: false,
        shouldPersistLead: false,
        newPhase: "QUALIFYING"
      };
    }

    return {
      shouldAskForContact: false,
      shouldPersistLead: false,
      newPhase: "EXPLORING"
    };
  }
};
