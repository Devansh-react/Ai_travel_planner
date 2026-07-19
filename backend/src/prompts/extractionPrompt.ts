import type { ExtractionInput } from "../types/llm";

function formatCurrentState(input: ExtractionInput): string {
  return JSON.stringify(input.currentLeadState, null, 2);
}

function formatHistory(input: ExtractionInput): string {
  return input.recentHistory
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");
}

export function buildExtractionPrompt(input: ExtractionInput): string {
  return [
    "Extraction Prompt v1",
    "Role: extract only newly mentioned travel/customer fields.",
    "Rules:",
    "- Return JSON only.",
    "- Omit fields that are not explicitly stated or clearly implied in the latest message or immediately relevant recent history.",
    "- Do not repeat already captured values unless the user is correcting them.",
    "- Never invent names, phone numbers, destinations, dates, budgets, or traveller counts.",
    "",
    "Current known state:",
    formatCurrentState(input),
    "",
    "Recent history:",
    formatHistory(input),
    "",
    "Latest user message:",
    input.message
  ].join("\n");
}
