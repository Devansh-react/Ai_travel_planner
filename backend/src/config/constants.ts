export const MAX_MESSAGE_HISTORY = 20;
export const RECENT_HISTORY_FOR_PROMPTS = 6;
export const QUALIFYING_SCORE_THRESHOLD = 55;
export const MAX_TURNS_AWAITING_CONTACT = 3;
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
export const LLM_TIMEOUT_MS = 10_000;
export const LLM_MAX_RETRIES = 1;

export const DECLINE_PATTERNS = [
  /no thanks?/i,
  /rather not/i,
  /don't want to share/i,
  /not comfortable/i,
  /skip that/i
];

export const VAGUE_MARKER_PATTERN = /\b(sometime|somewhere|maybe|not sure|around|approximately)\b/i;

export const SCORING_WEIGHTS = {
  travel: {
    destinationSpecific: 20,
    destinationVague: 10,
    tripTypeSpecific: 15,
    tripTypeVague: 8,
    travelDateSpecific: 10,
    travelDateVague: 4,
    travellers: 8,
    budgetSpecific: 12,
    budgetVague: 6,
    duration: 5,
    departureCity: 3,
    specialRequirements: 2
  },
  customer: {
    name: 10,
    phone: 15
  },
  modifiers: {
    exploratory: 0.35,
    considering: 0.75,
    ready_to_book: 1.0,
    coOccurrenceBonus: 25,
    destinationTripTypeBonus: 35,
    budgetDateBonus: 60,
    bookingIntentBonus: 20,
    vagueDestinationFloor: 25,
    contactInfoFloor: 95,
    decliningPenalty: 15
  }
} as const;
