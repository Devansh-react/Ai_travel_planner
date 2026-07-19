"use strict";
process.env.MISTRAL_API_KEY = "test-key";
process.env.MISTRAL_MODEL = "mistral-small-latest";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
jest.mock("axios", () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        isAxiosError: jest.fn(() => false)
    }
}));
const axios = require("axios");
const axiosMock = axios.default;
const { llmService } = require("../src/services/llmService");
describe("llmService", () => {
    beforeEach(() => {
        axiosMock.post.mockReset();
        axiosMock.isAxiosError.mockReturnValue(false);
    });
    it("returns the Mistral reply text", async () => {
        axiosMock.post.mockResolvedValue({
            data: {
                choices: [
                    {
                        message: {
                            content: "hello from mistral"
                        }
                    }
                ]
            }
        });
        const result = await llmService.callFreeText("hello");
        expect(result).toBe("hello from mistral");
    });
});
