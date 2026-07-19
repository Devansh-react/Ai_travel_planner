import { createClient } from "@supabase/supabase-js";
import { Config } from "../config/env";
import type { LeadRow, LeadState } from "../types/lead";
import { PersistenceError } from "../utils/errors";

const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY);

function toRow(lead: LeadState): Partial<LeadRow> {
  return {
    conversation_id: lead.conversationId,
    customer_name: lead.customer.name,
    customer_phone: lead.customer.phone,
    customer_email: lead.customer.email,
    travel_destination: lead.travel.destination,
    travel_departure_city: lead.travel.departureCity,
    travel_date: lead.travel.travelDate,
    travel_travellers: lead.travel.travellers,
    travel_budget: lead.travel.budget,
    travel_duration: lead.travel.duration,
    travel_trip_type: lead.travel.tripType,
    travel_special_requirements: lead.travel.specialRequirements,
    lead_score: lead.qualification.leadScore,
    confidence: lead.qualification.confidence,
    reason: lead.qualification.reason,
    summary: lead.qualification.summary,
    updated_at: lead.updatedAt ?? new Date().toISOString(),
    created_at: lead.createdAt ?? new Date().toISOString()
  };
}

export const leadRepository = {
  async upsertLead(lead: LeadState): Promise<void> {
    const payload = toRow(lead);
    const { error } = await supabase.from("leads").upsert(payload, { onConflict: "conversation_id" });
    if (error) {
      throw new PersistenceError(error.message);
    }
  },

  async getLeadByConversationId(conversationId: string): Promise<LeadRow | null> {
    const { data, error } = await supabase.from("leads").select("*").eq("conversation_id", conversationId).maybeSingle();
    if (error) {
      throw new PersistenceError(error.message);
    }
    return (data as LeadRow | null) ?? null;
  }
};
