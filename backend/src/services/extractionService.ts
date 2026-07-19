import { merge } from "lodash";
import { buildExtractionPrompt } from "../prompts/extractionPrompt";
import type { ExtractionInput, ExtractionOutput } from "../types/llm";
import { ExtractionOutputSchema } from "../validation/llmOutputSchemas";
import { llmService } from "./llmService";
import { parseBudget, parsePhone, parseTravellerCount } from "../utils/parsers";
import { logger } from "../utils/logger";

function normalizeOutput(output: ExtractionOutput): ExtractionOutput {
  const normalized: ExtractionOutput = {};

  if (output.customer) {
    normalized.customer = {};
    if (output.customer.name) {
      normalized.customer.name = output.customer.name.trim();
    }
    if (output.customer.phone) {
      const parsed = parsePhone(output.customer.phone);
      if (parsed) {
        normalized.customer.phone = parsed;
      }
    }
    if (output.customer.email) {
      normalized.customer.email = output.customer.email.trim();
    }
  }

  if (output.travel) {
    normalized.travel = {};
    if (output.travel.destination) {
      normalized.travel.destination = output.travel.destination.trim();
    }
    if (output.travel.departureCity) {
      normalized.travel.departureCity = output.travel.departureCity.trim();
    }
    if (output.travel.travelDate) {
      normalized.travel.travelDate = output.travel.travelDate.trim();
    }
    if (typeof output.travel.travellers === "number") {
      normalized.travel.travellers = output.travel.travellers;
    } else if (typeof (output.travel as { travellers?: unknown }).travellers === "string") {
      const parsed = parseTravellerCount((output.travel as { travellers?: string }).travellers ?? "");
      if (parsed) {
        normalized.travel.travellers = parsed;
      }
    }
    if (output.travel.budget) {
      normalized.travel.budget = parseBudget(output.travel.budget);
    }
    if (output.travel.duration) {
      normalized.travel.duration = output.travel.duration.trim();
    }
    if (output.travel.tripType) {
      normalized.travel.tripType = output.travel.tripType.trim();
    }
    if (output.travel.specialRequirements) {
      normalized.travel.specialRequirements = output.travel.specialRequirements.trim();
    }
  }

  return normalized;
}

export const extractionService = {
  async extract(input: ExtractionInput): Promise<ExtractionOutput> {
    const prompt = buildExtractionPrompt(input);
    try {
      const raw = await llmService.callStructured(prompt, "extraction");
      const parsed = ExtractionOutputSchema.safeParse(raw);
      if (!parsed.success) {
        logger.warn({ raw }, "Extraction output failed validation");
        return {};
      }
      return normalizeOutput(parsed.data);
    } catch (error) {
      logger.warn({ error: error instanceof Error ? error.message : String(error) }, "Extraction failed");
      return {};
    }
  }
};
