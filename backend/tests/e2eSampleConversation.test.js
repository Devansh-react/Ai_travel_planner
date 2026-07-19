"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../src/services/extractionService", () => ({
    extractionService: {
        extract: jest.fn()
    }
}));
jest.mock("../src/services/intentAnalyzer", () => ({
    intentAnalyzer: {
        analyzeIntent: jest.fn()
    }
}));
jest.mock("../src/services/replyGenerator", () => ({
    replyGenerator: {
        generateReply: jest.fn()
    }
}));
jest.mock("../src/repository/leadRepository", () => ({
    leadRepository: {
        upsertLead: jest.fn().mockResolvedValue(undefined),
        getLeadByConversationId: jest.fn()
    }
}));
const conversationManager_1 = require("../src/services/conversationManager");
const extractionService_1 = require("../src/services/extractionService");
const intentAnalyzer_1 = require("../src/services/intentAnalyzer");
const replyGenerator_1 = require("../src/services/replyGenerator");
const leadRepository_1 = require("../src/repository/leadRepository");
const mockedExtractionService = extractionService_1.extractionService;
const mockedIntentAnalyzer = intentAnalyzer_1.intentAnalyzer;
const mockedReplyGenerator = replyGenerator_1.replyGenerator;
const mockedLeadRepository = leadRepository_1.leadRepository;
describe("sample conversation e2e", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test("walks through the assignment sample conversation", async () => {
        mockedExtractionService.extract.mockImplementation(async (input) => {
            if (input.message.includes("honeymoon in Bali")) {
                return {
                    travel: {
                        destination: "Bali",
                        tripType: "Honeymoon",
                        travelDate: "December"
                    }
                };
            }
            if (input.message.includes("Two adults")) {
                return {
                    travel: {
                        travellers: 2
                    }
                };
            }
            if (input.message.includes("Rs 2 lakh")) {
                return {
                    travel: {
                        budget: "Rs 2 lakh"
                    }
                };
            }
            if (input.message.includes("Rahul Verma")) {
                return {
                    customer: {
                        name: "Rahul Verma",
                        phone: "+919999999999"
                    }
                };
            }
            return {};
        });
        mockedIntentAnalyzer.analyzeIntent.mockResolvedValue({
            intentLabel: "considering",
            trendDirection: "steady",
            rationalePhrase: "steady planning"
        });
        mockedReplyGenerator.generateReply.mockImplementation(async ({ shouldAskForContact, leadState }) => {
            if (shouldAskForContact) {
                return "Perfect. May I have your name and contact number?";
            }
            if (!leadState.travel.travellers) {
                return "Approximately how many people will be travelling?";
            }
            if (!leadState.travel.budget) {
                return "Great! Do you already have a budget in mind?";
            }
            return "Thanks. I’ll connect you with a consultant.";
        });
        const turn1 = await conversationManager_1.conversationManager.handleMessage("conv-sample", "I'm planning a honeymoon in Bali this December.");
        const turn2 = await conversationManager_1.conversationManager.handleMessage("conv-sample", "Two adults.");
        const turn3 = await conversationManager_1.conversationManager.handleMessage("conv-sample", "Around Rs 2 lakh.");
        const turn4 = await conversationManager_1.conversationManager.handleMessage("conv-sample", "Rahul Verma, +91 99999999999");
        expect(turn1.leadState.travel.destination).toBe("Bali");
        expect(turn1.leadState.travel.tripType).toBe("Honeymoon");
        expect(turn1.leadState.travel.travelDate).toBe("December");
        expect(turn1.conversationPhase).toBe("QUALIFYING");
        expect(turn2.leadState.travel.travellers).toBe(2);
        expect(turn2.reply).toContain("budget");
        expect(turn3.leadState.travel.budget).toBe("Rs 2 lakh");
        expect(turn3.conversationPhase).toBe("AWAITING_CONTACT");
        expect(turn3.reply).toContain("name and contact");
        expect(turn4.leadState.customer.name).toBe("Rahul Verma");
        expect(turn4.leadState.customer.phone).toBe("+919999999999");
        expect(turn4.conversationPhase).toBe("QUALIFIED");
        expect(mockedLeadRepository.upsertLead).toHaveBeenCalled();
    });
});
