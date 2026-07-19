import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapturedFieldsPanel } from "./CapturedFieldsPanel";
import type { LeadState } from "../types";

function leadState(): LeadState {
  return {
    conversationId: "conv-1",
    customer: { name: "Rahul Verma", phone: "+919999999999", email: null },
    travel: {
      destination: "Bali",
      departureCity: null,
      travelDate: "December",
      travellers: 2,
      budget: "Rs 2 lakh",
      duration: null,
      tripType: "Honeymoon",
      specialRequirements: null
    },
    qualification: { leadScore: 95, confidence: "High", reason: "Good lead", summary: "A couple to Bali" },
    createdAt: null,
    updatedAt: null
  };
}

describe("CapturedFieldsPanel", () => {
  test("renders captured lead fields", () => {
    render(<CapturedFieldsPanel leadState={leadState()} />);
    expect(screen.getByText("Rahul Verma")).toBeInTheDocument();
    expect(screen.getByText("Bali")).toBeInTheDocument();
    expect(screen.getByText("Rs 2 lakh")).toBeInTheDocument();
  });
});
