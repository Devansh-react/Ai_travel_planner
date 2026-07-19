import cors from "cors";
import express from "express";
import { Config } from "./config/env";
import { chatController } from "./controllers/chatController";
import { logger } from "./utils/logger";

export const app = express();

app.use(cors({ origin: Config.FRONTEND_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/chat", (req, res) => {
  void chatController.handleChatRequest(req, res).catch((error: unknown) => {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Unhandled chat error");
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again."
      }
    });
  });
});

app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again."
    }
  });
});
