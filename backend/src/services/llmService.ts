import axios from "axios";
import { Config } from "../config/env";
import { LLM_MAX_RETRIES, LLM_TIMEOUT_MS } from "../config/constants";
import { LLMServiceError } from "../utils/errors";
import { logger } from "../utils/logger";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

async function callWithTimeout<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      return await operation(controller.signal);
    } catch (error) {
      lastError = error;
      if (attempt === LLM_MAX_RETRIES) {
        break;
      }
      logger.warn({ attempt, error: error instanceof Error ? error.message : String(error) }, "LLM call failed, retrying once");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new LLMServiceError(lastError instanceof Error ? lastError.message : "LLM request failed");
}

function extractContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof (item as { text?: unknown }).text === "string") {
          return (item as { text: string }).text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  if (content && typeof content === "object" && "content" in content) {
    const nested = (content as { content?: unknown }).content;
    return extractContent(nested);
  }

  return "";
}

async function postChatCompletion(prompt: string, signal: AbortSignal, responseFormat?: { type: "json_object" }): Promise<string> {
  const model = Config.MISTRAL_MODEL.trim() || "mistral-small-latest";
  console.log("API KEY:", Config.MISTRAL_API_KEY.slice(0, 10));
  console.log("MODEL:", Config.MISTRAL_MODEL);


  const response = await axios.post(
    `${MISTRAL_BASE_URL}/chat/completions`,
    {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a backend component of a travel booking assistant. Follow the user's instructions exactly and return only valid JSON when requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0,
      ...(responseFormat ? { response_format: responseFormat } : {})
    },
    {
      signal,
      headers: {
        Authorization: `Bearer ${Config.MISTRAL_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  return extractContent(content);
}

export const llmService = {
  async callStructured(prompt: string, schemaName: "extraction" | "intent"): Promise<unknown> {
    try {
      return await callWithTimeout(async (signal) => {
        const raw = await postChatCompletion(prompt, signal, { type: "json_object" });
        if (!raw) {
          throw new Error(`Empty structured response for ${schemaName}`);
        }
        return JSON.parse(raw) as unknown;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(error.response?.status);
        console.log(error.response?.data);
      }
      throw error;
    }
  },

  async callFreeText(prompt: string): Promise<string> {
    try {
      return await callWithTimeout(async (signal) => {
        const raw = await postChatCompletion(prompt, signal);
        if (!raw) {
          throw new Error("Empty reply from LLM");
        }
        return raw;
      });
    } catch (error) {
      const message =
        axios.isAxiosError(error)
          ? `Mistral API request failed: Status ${error.response?.status ?? "unknown"}. Check that MISTRAL_API_KEY is valid and MISTRAL_MODEL is a supported chat model. Body: ${JSON.stringify(error.response?.data ?? {})}`
          : error instanceof Error
            ? error.message
            : "Free-text LLM call failed";
      throw new LLMServiceError(message);
    }
  }
};
