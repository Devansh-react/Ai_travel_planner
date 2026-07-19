import { buildReplyPrompt } from "../prompts/replyPrompt";
import type { ReplyInput } from "../types/llm";
import { llmService } from "./llmService";
import { logger } from "../utils/logger";

function trimReply(reply: string): string {
  return reply.length > 600 ? `${reply.slice(0, 597).trim()}...` : reply;
}

export const replyGenerator = {
  async generateReply(input: ReplyInput): Promise<string> {
    const prompt = buildReplyPrompt(input);
    try {
      const reply = await llmService.callFreeText(prompt);
      return trimReply(reply);
    } catch (error) {
      logger.warn({ error: error instanceof Error ? error.message : String(error) }, "Reply generation failed");
      return "Sorry, I had trouble processing that — could you say that again?";
    }
  }
};
