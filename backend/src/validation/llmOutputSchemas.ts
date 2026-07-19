import { z } from "zod";

export const ExtractionOutputSchema = z.object({
  customer: z
    .object({
      name: z.string().trim().min(1).optional(),
      phone: z.string().trim().min(1).optional(),
      email: z.string().email().optional()
    })
    .optional(),
  travel: z
    .object({
      destination: z.string().trim().min(1).optional(),
      departureCity: z.string().trim().min(1).optional(),
      travelDate: z.string().trim().min(1).optional(),
      travellers: z.number().int().positive().optional(),
      budget: z.string().trim().min(1).optional(),
      duration: z.string().trim().min(1).optional(),
      tripType: z.string().trim().min(1).optional(),
      specialRequirements: z.string().trim().min(1).optional()
    })
    .optional()
});

export const IntentOutputSchema = z.object({
  intentLabel: z.enum(["exploratory", "considering", "ready_to_book"]),
  trendDirection: z.enum(["rising", "steady", "declining"]),
  rationalePhrase: z.string().trim().min(1).max(15).optional()
});

export type ExtractionOutputSchemaType = z.infer<typeof ExtractionOutputSchema>;
export type IntentOutputSchemaType = z.infer<typeof IntentOutputSchema>;
