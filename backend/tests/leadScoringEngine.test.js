"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const leadScoringEngine_1 = require("../src/services/leadScoringEngine");
function baseLeadState() {
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
const exploratory = {
    intentLabel: "exploratory",
    trendDirection: "steady",
    rationalePhrase: "vague interest"
};
const considering = {
    intentLabel: "considering",
    trendDirection: "steady",
    rationalePhrase: "concrete planning"
};
const ready = {
    intentLabel: "ready_to_book",
    trendDirection: "steady",
    rationalePhrase: "ready to book"
};
describe("leadScoringEngine", () => {
    test("scores a destination-only exploration near the reference band", () => {
        const leadState = baseLeadState();
        leadState.travel.destination = "Bali";
        const result = leadScoringEngine_1.leadScoringEngine.computeQualification(leadState, exploratory);
        expect(result.leadScore).toBeGreaterThanOrEqual(0);
        expect(result.leadScore).toBeLessThanOrEqual(20);
    });
    test("scores destination plus trip type higher than destination-only", () => {
        const leadState = baseLeadState();
        leadState.travel.destination = "Bali";
        leadState.travel.tripType = "Honeymoon";
        const result = leadScoringEngine_1.leadScoringEngine.computeQualification(leadState, considering);
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
        const result = leadScoringEngine_1.leadScoringEngine.computeQualification(leadState, ready);
        expect(result.leadScore).toBeGreaterThanOrEqual(90);
        expect(result.confidence).toBe("High");
    });
});
