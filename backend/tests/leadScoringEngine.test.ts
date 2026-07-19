import { leadScoringEngine } from "../src/services/leadScoringEngine";
import type { LeadState } from "../src/types/lead";
import type { IntentOutput } from "../src/types/llm";

function baseLeadState(): LeadState {
  return {
    conversationId: "conv-1",
    customer: { name: null, phone: null, email: null },
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
    qualification: { leadScore: 0, confidence: "Low", reason: "", summary: "" },
    createdAt: null,
    updatedAt: null
  };
}

const exploratory: IntentOutput = {
  intentLabel: "exploratory",
  trendDirection: "steady",
  rationalePhrase: "vague interest"
};

const considering: IntentOutput = {
  intentLabel: "considering",
  trendDirection: "steady",
  rationalePhrase: "concrete planning"
};

const ready: IntentOutput = {
  intentLabel: "ready_to_book",
  trendDirection: "steady",
  rationalePhrase: "ready to book"
};

describe("leadScoringEngine", () => {
  test("scores a destination-only exploration near the reference band", () => {
    const leadState = baseLeadState();
    leadState.travel.destination = "Bali";
    const result = leadScoringEngine.computeQualification(leadState, exploratory);
    expect(result.leadScore).toBeGreaterThanOrEqual(0);
    expect(result.leadScore).toBeLessThanOrEqual(20);
  });

  test("scores destination plus trip type higher than destination-only", () => {
    const leadState = baseLeadState();
    leadState.travel.destination = "Bali";
    leadState.travel.tripType = "Honeymoon";
    const result = leadScoringEngine.computeQualification(leadState, considering);
    expect(result.leadScore).toBeGreaterThanOrEqual(50);
    expect(result.leadScore).toBeLessThanOrEqual(70);
    expect(result.confidence).not.toBe("Low");
  });

  test("applies a strong score when contact details and booking intent are present", () => {
    const leadState = baseLeadState();
    leadState.customer.name = "Rahul Verma";
    leadState.customer.phone = "+919999999999";
    leadState.travel.destination = "Bali";
    leadState.travel.tripType = "Honeymoon";
    leadState.travel.travellers = 2;
    const result = leadScoringEngine.computeQualification(leadState, ready);
    expect(result.leadScore).toBeGreaterThanOrEqual(90);
    expect(result.confidence).toBe("High");
  });
});
