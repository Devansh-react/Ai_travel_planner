import type { IntentInput } from "../types/llm";

function formatCurrentState(input: IntentInput): string {
  return JSON.stringify(input.currentLeadState, null, 2);
}

export function buildIntentPrompt(input: IntentInput): string {
  return [
    "Intent Prompt v1",
    "Role: assess buying intent strength and trend only.",
    "Rules:",
    "- Return JSON only.",
    "- Base the judgment on the user's language in the latest message and immediate conversational context.",
    "- A vague exploratory question should be exploratory.",
    "- A more specific, urgent, or booking-oriented message should be considering or ready_to_book.",
    "- A terse or disengaged reply after prior enthusiasm should be declining.",
    "",
    "Prior trend:",
    input.priorTrend,
    "",
    "Current known state:",
    formatCurrentState(input),
    "",
    "Latest user message:",
    input.message
  ].join("\n");
}
