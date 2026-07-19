export interface ExtractionOutput {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  travel?: {
    destination?: string;
    departureCity?: string;
    travelDate?: string;
    travellers?: number;
    budget?: string;
    duration?: string;
    tripType?: string;
    specialRequirements?: string;
  };
}

export interface IntentOutput {
  intentLabel: "exploratory" | "considering" | "ready_to_book";
  trendDirection: "rising" | "steady" | "declining";
  rationalePhrase: string;
}

export interface ExtractionInput {
  message: string;
  recentHistory: { role: string; content: string }[];
  currentLeadState: {
    customer: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
    travel: {
      destination: string | null;
      departureCity: string | null;
      travelDate: string | null;
      travellers: number | null;
      budget: string | null;
      duration: string | null;
      tripType: string | null;
      specialRequirements: string | null;
    };
  };
}

export interface IntentInput {
  message: string;
  currentLeadState: {
    customer: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
    travel: {
      destination: string | null;
      departureCity: string | null;
      travelDate: string | null;
      travellers: number | null;
      budget: string | null;
      duration: string | null;
      tripType: string | null;
      specialRequirements: string | null;
    };
  };
  priorTrend: "rising" | "steady" | "declining";
}

export interface QualificationOutput {
  leadScore: number;
  confidence: "Low" | "Medium" | "High";
  reason: string;
  summary: string;
}

export interface QualificationDecisionInput {
  conversationPhase: "NEW" | "EXPLORING" | "QUALIFYING" | "AWAITING_CONTACT" | "QUALIFIED" | "DECLINED_CONTACT" | "ABANDONED";
  hasAskedForContact: boolean;
  turnsSinceContactAsk?: number;
  leadState: {
    customer: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
    travel: {
      destination: string | null;
      departureCity: string | null;
      travelDate: string | null;
      travellers: number | null;
      budget: string | null;
      duration: string | null;
      tripType: string | null;
      specialRequirements: string | null;
    };
  };
  qualification: QualificationOutput;
  currentMessage: string;
}

export interface QualificationDecision {
  shouldAskForContact: boolean;
  shouldPersistLead: boolean;
  newPhase:
    | "NEW"
    | "EXPLORING"
    | "QUALIFYING"
    | "AWAITING_CONTACT"
    | "QUALIFIED"
    | "DECLINED_CONTACT"
    | "ABANDONED";
}

export interface ReplyInput {
  recentHistory: { role: string; content: string }[];
  leadState: {
    customer: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
    travel: {
      destination: string | null;
      departureCity: string | null;
      travelDate: string | null;
      travellers: number | null;
      budget: string | null;
      duration: string | null;
      tripType: string | null;
      specialRequirements: string | null;
    };
  };
  shouldAskForContact: boolean;
  conversationPhase: "NEW" | "EXPLORING" | "QUALIFYING" | "AWAITING_CONTACT" | "QUALIFIED" | "DECLINED_CONTACT" | "ABANDONED";
}
