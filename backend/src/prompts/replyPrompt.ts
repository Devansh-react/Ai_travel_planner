import type { ReplyInput } from "../types/llm";

function formatHistory(input: ReplyInput): string {
  return input.recentHistory
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join("\n");
}

export function buildReplyPrompt(input: ReplyInput): string {
  const knownFields = JSON.stringify(input.leadState, null, 2);
  return [
    "Reply Prompt v1",
    "Role: write the next natural assistant message to the user.",
    "Rules:",
    "- Return plain text only, no JSON.",
    "- 1 to 3 sentences.",
    "- Never mention internal scoring or confidence.",
    "- Never ask for fields that are already known.",
    input.shouldAskForContact
      ? "- Ask for the user's name and phone number in a single friendly message."
      : "- Ask at most one relevant follow-up question about the next missing travel field if one is still needed.",
    input.conversationPhase === "DECLINED_CONTACT"
      ? "- Do not ask for contact details again; stay helpful about the trip."
      : "",
    "",
    "Known lead state:",
    knownFields,
    "",
    "Recent history:",
    formatHistory(input)
  ].filter(Boolean).join("\n");
}
