import { SCORING_WEIGHTS } from "../config/constants";
import type { LeadState } from "../types/lead";
import type { IntentOutput, QualificationOutput } from "../types/llm";
import { isVagueText } from "../utils/parsers";

function countSpecificTravelFields(leadState: LeadState): number {
  const fields: Array<[unknown, boolean]> = [
    [leadState.travel.destination, !isVagueText(leadState.travel.destination)],
    [leadState.travel.tripType, !isVagueText(leadState.travel.tripType)],
    [leadState.travel.travelDate, !isVagueText(leadState.travel.travelDate)],
    [leadState.travel.travellers, typeof leadState.travel.travellers === "number"],
    [leadState.travel.budget, !isVagueText(leadState.travel.budget)],
    [leadState.travel.duration, true],
    [leadState.travel.departureCity, true],
    [leadState.travel.specialRequirements, true]
  ];

  return fields.filter(([value, isSpecific]) => value !== null && value !== undefined && isSpecific).length;
}

function scoreTravelFields(leadState: LeadState): { raw: number; reasons: string[] } {
  let raw = 0;
  const reasons: string[] = [];

  if (leadState.travel.destination) {
    if (isVagueText(leadState.travel.destination) || /^(europe|asia|africa|middle east|south america|north america|australia|india)$/i.test(leadState.travel.destination.trim())) {
      raw += SCORING_WEIGHTS.travel.destinationVague;
      reasons.push("vague destination");
    } else {
      raw += SCORING_WEIGHTS.travel.destinationSpecific;
      reasons.push(`destination ${leadState.travel.destination}`);
    }
  }

  if (leadState.travel.tripType) {
    if (isVagueText(leadState.travel.tripType)) {
      raw += SCORING_WEIGHTS.travel.tripTypeVague;
      reasons.push("vague trip type");
    } else {
      raw += SCORING_WEIGHTS.travel.tripTypeSpecific;
      reasons.push(`trip type ${leadState.travel.tripType}`);
    }
  }

  if (leadState.travel.travelDate) {
    if (isVagueText(leadState.travel.travelDate)) {
      raw += SCORING_WEIGHTS.travel.travelDateVague;
      reasons.push("vague travel date");
    } else {
      raw += SCORING_WEIGHTS.travel.travelDateSpecific;
      reasons.push(`travel date ${leadState.travel.travelDate}`);
    }
  }

  if (leadState.travel.travellers) {
    raw += SCORING_WEIGHTS.travel.travellers;
    reasons.push(`${leadState.travel.travellers} travellers`);
  }

  if (leadState.travel.budget) {
    if (isVagueText(leadState.travel.budget)) {
      raw += SCORING_WEIGHTS.travel.budgetVague;
      reasons.push("vague budget");
    } else {
      raw += SCORING_WEIGHTS.travel.budgetSpecific;
      reasons.push(`budget ${leadState.travel.budget}`);
    }
  }

  if (leadState.travel.duration) {
    raw += SCORING_WEIGHTS.travel.duration;
    reasons.push(`duration ${leadState.travel.duration}`);
  }

  if (leadState.travel.departureCity) {
    raw += SCORING_WEIGHTS.travel.departureCity;
    reasons.push(`departure ${leadState.travel.departureCity}`);
  }

  if (leadState.travel.specialRequirements) {
    raw += SCORING_WEIGHTS.travel.specialRequirements;
    reasons.push("special requirements noted");
  }

  return { raw, reasons };
}

function specificTravelFieldNames(leadState: LeadState): string[] {
  const fields: Array<[string, string | number | null]> = [
    ["destination", leadState.travel.destination],
    ["tripType", leadState.travel.tripType],
    ["travelDate", leadState.travel.travelDate],
    ["travellers", leadState.travel.travellers],
    ["budget", leadState.travel.budget],
    ["duration", leadState.travel.duration],
    ["departureCity", leadState.travel.departureCity],
    ["specialRequirements", leadState.travel.specialRequirements]
  ];

  return fields
    .filter(([, value]) => value !== null && value !== undefined)
    .filter(([field, value]) => {
      if (field === "destination" || field === "tripType" || field === "travelDate" || field === "budget") {
        return typeof value === "string" ? !isVagueText(value) : false;
      }
      return true;
    })
    .map(([field]) => field);
}

function scoreCustomerFields(leadState: LeadState): { raw: number; reasons: string[] } {
  let raw = 0;
  const reasons: string[] = [];
  if (leadState.customer.name) {
    raw += SCORING_WEIGHTS.customer.name;
    reasons.push(`name ${leadState.customer.name}`);
  }
  if (leadState.customer.phone) {
    raw += SCORING_WEIGHTS.customer.phone;
    reasons.push("phone captured");
  }
  return { raw, reasons };
}

function determineConfidence(score: number, leadState: LeadState): "Low" | "Medium" | "High" {
  const specificTravelFields = countSpecificTravelFields(leadState);
  const vagueOnly =
    !leadState.travel.destination &&
    !leadState.travel.tripType &&
    !leadState.travel.travelDate &&
    !leadState.travel.budget &&
    !leadState.travel.travellers &&
    !leadState.travel.duration &&
    !leadState.travel.departureCity &&
    !leadState.travel.specialRequirements;

  if (score >= 70 && specificTravelFields >= 2) {
    return "High";
  }
  if ((score >= 40 && specificTravelFields >= 1) || (score >= 70 && !specificTravelFields)) {
    return "Medium";
  }
  if (score < 40 || vagueOnly) {
    return "Low";
  }
  return "Medium";
}

function buildSummary(leadState: LeadState): string {
  const parts: string[] = [];
  if (leadState.travel.tripType) {
    parts.push(`planning a ${leadState.travel.tripType.toLowerCase()} trip`);
  }
  if (leadState.travel.destination) {
    parts.push(`to ${leadState.travel.destination}`);
  }
  if (leadState.travel.travelDate) {
    parts.push(`in ${leadState.travel.travelDate}`);
  }
  if (leadState.travel.travellers) {
    parts.push(`for ${leadState.travel.travellers} traveller${leadState.travel.travellers > 1 ? "s" : ""}`);
  }
  if (leadState.travel.budget) {
    parts.push(`with a budget of ${leadState.travel.budget}`);
  }
  return parts.length ? parts.join(" ") : "Travel requirements are still being gathered.";
}

export const leadScoringEngine = {
  computeQualification(leadState: LeadState, intent: IntentOutput): QualificationOutput {
    const travelScore = scoreTravelFields(leadState);
    const customerScore = scoreCustomerFields(leadState);
    const travelModifier = SCORING_WEIGHTS.modifiers[intent.intentLabel];
    const modifiedTravelScore = travelScore.raw * travelModifier;
    let score = modifiedTravelScore + customerScore.raw;
    const reasons: string[] = [...travelScore.reasons, ...customerScore.reasons];
    const specificTravelFields = specificTravelFieldNames(leadState);

    const specificTravelCount = specificTravelFields.length;

    if (specificTravelFields.includes("destination") && specificTravelFields.includes("tripType")) {
      score += SCORING_WEIGHTS.modifiers.destinationTripTypeBonus;
      reasons.push("destination and trip type reinforce each other");
    } else if (specificTravelFields.includes("budget") && specificTravelFields.includes("travelDate")) {
      score += SCORING_WEIGHTS.modifiers.budgetDateBonus;
      reasons.push("budget and travel date reinforce each other");
    } else if (specificTravelCount >= 2) {
      score += SCORING_WEIGHTS.modifiers.coOccurrenceBonus;
      reasons.push("multiple concrete travel details");
    }

    if (intent.intentLabel === "ready_to_book") {
      score += SCORING_WEIGHTS.modifiers.bookingIntentBonus;
      reasons.push("explicit booking intent");
    }

    if (leadState.travel.destination && isVagueText(leadState.travel.destination) && specificTravelCount <= 1) {
      score = Math.max(score, SCORING_WEIGHTS.modifiers.vagueDestinationFloor);
    }

    if (leadState.customer.name && leadState.customer.phone) {
      score = Math.max(score, SCORING_WEIGHTS.modifiers.contactInfoFloor);
      reasons.push("contact info captured");
    }

    if (intent.trendDirection === "declining") {
      score -= SCORING_WEIGHTS.modifiers.decliningPenalty;
      reasons.push("intent is declining");
    }

    const rounded = Math.max(0, Math.min(100, Math.round(score / 5) * 5));
    const confidence = determineConfidence(rounded, leadState);
    const reason = reasons.length ? reasons.join("; ") : "Insufficient information captured yet.";
    const summary = buildSummary(leadState);

    return {
      leadScore: rounded,
      confidence,
      reason,
      summary
    };
  }
};
