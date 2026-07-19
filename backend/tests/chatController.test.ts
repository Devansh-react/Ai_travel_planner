import type { Request, Response } from "express";
import { chatController } from "../src/controllers/chatController";

jest.mock("../src/validation/requestSchemas", () => ({
  validateChatRequest: jest.fn()
}));

jest.mock("../src/services/conversationManager", () => ({
  conversationManager: {
    handleMessage: jest.fn()
  }
}));

jest.mock("../src/utils/idGenerator", () => ({
  generateId: jest.fn(() => "generated-id")
}));

const { validateChatRequest } = jest.requireMock("../src/validation/requestSchemas") as {
  validateChatRequest: jest.Mock;
};
const { conversationManager } = jest.requireMock("../src/services/conversationManager") as {
  conversationManager: { handleMessage: jest.Mock };
};

function mockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;
  return res;
}

describe("chatController", () => {
  beforeEach(() => {
    validateChatRequest.mockReset();
    conversationManager.handleMessage.mockReset();
  });

  test("returns a processed chat turn", async () => {
    validateChatRequest.mockReturnValue({ message: "Hello" });
    conversationManager.handleMessage.mockResolvedValue({
      conversationId: "generated-id",
      reply: "Hi",
      leadState: {
        conversationId: "generated-id",
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
      },
      conversationPhase: "NEW"
    });

    const res = mockResponse();
    await chatController.handleChatRequest({ body: {} } as Request, res);

    expect(conversationManager.handleMessage).toHaveBeenCalledWith("generated-id", "Hello");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
