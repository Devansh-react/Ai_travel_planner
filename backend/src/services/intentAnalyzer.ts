import { buildIntentPrompt } from "../prompts/intentPrompt";
import type { IntentInput, IntentOutput } from "../types/llm";
import { IntentOutputSchema } from "../validation/llmOutputSchemas";
import { llmService } from "./llmService";
import { logger } from "../utils/logger";

export const intentAnalyzer = {
  async analyzeIntent(input: IntentInput): Promise<IntentOutput> {
    const prompt = buildIntentPrompt(input);
    try {
      const raw = await llmService.callStructured(prompt, "intent");
      const parsed = IntentOutputSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn({ raw }, "Intent output failed validation");
        return {
          intentLabel: "exploratory",
          trendDirection: input.priorTrend,
          rationalePhrase: "Unable to determine intent this turn."
        };
      }

      return {
        intentLabel: parsed.data.intentLabel,
        trendDirection: parsed.data.trendDirection,
        rationalePhrase: parsed.data.rationalePhrase ?? "Intent inferred from the latest message."
      };
    } catch (error) {
      logger.warn({ error: error instanceof Error ? error.message : String(error) }, "Intent analysis failed");
      return {
        intentLabel: "exploratory",
        trendDirection: input.priorTrend,
        rationalePhrase: "Unable to determine intent this turn."
      };
    }
  }
};
