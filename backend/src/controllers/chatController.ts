import type { Request, Response } from "express";
import { generateId } from "../utils/idGenerator";
import { logger } from "../utils/logger";
import { validateChatRequest } from "../validation/requestSchemas";
import { conversationManager } from "../services/conversationManager";
import { ValidationError } from "../utils/errors";

export const chatController = {
  async handleChatRequest(req: Request, res: Response): Promise<void> {
    try {
      const body = validateChatRequest(req.body);
      const conversationId = body.conversationId ?? generateId();
      const result = await conversationManager.handleMessage(conversationId, body.message);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn({ error: error.message }, "Validation failed");
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message
          }
        });
        return;
      }

      throw error;
    }
  }
};
