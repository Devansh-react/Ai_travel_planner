import { z } from "zod";
import { ValidationError } from "../utils/errors";

export const ChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000)
});

export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;

export function validateChatRequest(body: unknown): ChatRequestBody {
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }
  return parsed.data;
}
