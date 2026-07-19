import pino from "pino";
import { Config } from "../config/env";

export const logger = pino({
  level: Config.LOG_LEVEL,
  transport:
    Config.LOG_LEVEL === "debug"
      ? {
          target: "pino-pretty",
          options: { colorize: true, singleLine: true }
        }
      : undefined
});
