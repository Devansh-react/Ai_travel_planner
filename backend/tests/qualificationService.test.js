"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qualificationService_1 = require("../src/services/qualificationService");
function baseInput() {
    return {
        conversationPhase: "NEW",
        hasAskedForContact: false,
        leadState: {
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
            }
        },
        qualification: {
            leadScore: 0,
            confidence: "Low",
            reason: "",
            summary: ""
        },
        currentMessage: ""
    };
}
describe("qualificationService", () => {
    test("asks for contact once the qualifying threshold is reached", () => {
        const input = baseInput();
        input.qualification.leadScore = 60;
        input.leadState.travel.destination = "Bali";
        input.leadState.travel.budget = "Rs 2 lakh";
        const decision = qualificationService_1.qualificationService.decide(input);
        expect(decision.shouldAskForContact).toBe(true);
        expect(decision.newPhase).toBe("AWAITING_CONTACT");
    });
    test("persists when contact info and travel context are both present", () => {
        const input = baseInput();
        input.leadState.customer.name = "Rahul";
        input.leadState.customer.phone = "+919999999999";
        input.leadState.travel.destination = "Bali";
        const decision = qualificationService_1.qualificationService.decide(input);
        expect(decision.shouldPersistLead).toBe(true);
        expect(decision.newPhase).toBe("QUALIFIED");
    });
    test("keeps awaiting contact until the user declines or times out", () => {
        const input = baseInput();
        input.conversationPhase = "AWAITING_CONTACT";
        input.hasAskedForContact = true;
        input.turnsSinceContactAsk = 1;
        input.qualification.leadScore = 70;
        input.leadState.travel.destination = "Bali";
        const decision = qualificationService_1.qualificationService.decide(input);
        expect(decision.newPhase).toBe("AWAITING_CONTACT");
    });
    test("moves to declined contact on explicit refusal", () => {
        const input = baseInput();
        input.conversationPhase = "AWAITING_CONTACT";
        input.hasAskedForContact = true;
        input.currentMessage = "no thanks, just browsing";
        const decision = qualificationService_1.qualificationService.decide(input);
        expect(decision.newPhase).toBe("DECLINED_CONTACT");
    });
});
