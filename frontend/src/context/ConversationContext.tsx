import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "../services/chatApi";
import type { ChatResponseDTO, LeadState, Message, UIState } from "../types";

type Action =
  | { type: "INITIALIZE"; conversationId: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "ADD_USER_MESSAGE"; message: Message }
  | { type: "APPLY_RESPONSE"; payload: ChatResponseDTO };

function createInitialLeadState(conversationId: string): LeadState {
  return {
    conversationId,
    customer: {
      name: null,
      phone: null,
      email: null
    },
    travel: {
      destination: null,
      departureCity: null,
      travelDate: null,
      travellers: null,
      budget: null,
      duration: null,
      tripType: null,
      specialRequirements: null
    },
    qualification: {
      leadScore: 0,
      confidence: "Low",
      reason: "",
      summary: ""
    },
    createdAt: null,
    updatedAt: null
  };
}

const initialState: UIState = {
  conversationId: null,
  messages: [],
  leadState: createInitialLeadState(""),
  conversationPhase: "NEW",
  loading: false,
  typing: false,
  error: null
};

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case "INITIALIZE":
      return {
        ...state,
        conversationId: action.conversationId,
        leadState: createInitialLeadState(action.conversationId),
        conversationPhase: "NEW",
        messages: [],
        loading: false,
        typing: false,
        error: null
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading, typing: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "APPLY_RESPONSE":
      return {
        ...state,
        conversationId: action.payload.conversationId,
        messages: [
          ...state.messages,
          {
            role: "assistant",
            content: action.payload.reply,
            timestamp: new Date().toISOString()
          }
        ],
        leadState: action.payload.leadState,
        conversationPhase: action.payload.conversationPhase,
        loading: false,
        typing: false,
        error: null
      };
    default:
      return state;
  }
}

interface ConversationContextValue {
  state: UIState;
  sendUserMessage: (message: string) => Promise<void>;
  resetConversation: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = window.localStorage.getItem("travel-lead-assistant-conversation-id");
    const conversationId = stored ?? uuidv4();
    window.localStorage.setItem("travel-lead-assistant-conversation-id", conversationId);
    dispatch({ type: "INITIALIZE", conversationId });
  }, []);

  const value = useMemo<ConversationContextValue>(
    () => ({
      state,
      async sendUserMessage(message: string) {
        if (!message.trim()) {
          return;
        }
        const conversationId = state.conversationId ?? window.localStorage.getItem("travel-lead-assistant-conversation-id") ?? uuidv4();
        const userMessage = {
          role: "user" as const,
          content: message,
          timestamp: new Date().toISOString()
        };
        dispatch({ type: "SET_ERROR", error: null });
        dispatch({ type: "ADD_USER_MESSAGE", message: userMessage });
        dispatch({ type: "SET_LOADING", loading: true });
        try {
          const response = await sendMessage(conversationId, message);
          window.localStorage.setItem("travel-lead-assistant-conversation-id", response.conversationId);
          dispatch({ type: "APPLY_RESPONSE", payload: response });
        } catch (error) {
          dispatch({
            type: "SET_ERROR",
            error: error instanceof Error ? error.message : "Something went wrong while sending the message."
          });
          dispatch({ type: "SET_LOADING", loading: false });
        }
      },
      resetConversation() {
        const conversationId = uuidv4();
        window.localStorage.setItem("travel-lead-assistant-conversation-id", conversationId);
        dispatch({ type: "INITIALIZE", conversationId });
      }
    }),
    [state]
  );

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
}

export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}
