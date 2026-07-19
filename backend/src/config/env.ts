import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
});

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),

  MISTRAL_API_KEY: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.trim().replace(/^"|"$/g, "")
        : value,
    z.string().min(1)
  ),

  MISTRAL_MODEL: z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.trim().replace(/^"|"$/g, "")
        : value,
    z.string().min(1)
  ).default("mistral-small-latest"),

  SUPABASE_URL: z.string().url(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  FRONTEND_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:5173"),

  LOG_LEVEL: z
    .enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${parsed.error.message}`
  );
}

export const Config = Object.freeze(parsed.data);

export type ConfigType = typeof Config;