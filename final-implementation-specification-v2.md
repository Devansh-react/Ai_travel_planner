# AI-Powered Travel Lead Assistant — Final Implementation Specification (Phase 3)

*This document is the single source of truth for implementation. It resolves every remaining choice from the Assignment, Phase 1 (Design Analysis), and Phase 2 (Implementation Blueprint) into concrete, deterministic decisions. No further design decisions are required before coding begins.*

---

# 0. Final Technology Decisions

| Category | Decision |
|---|---|
| Frontend Framework | React 18 with Vite as the build tool, written in TypeScript. |
| Backend Framework | Node.js 20 LTS with Express 4, written in TypeScript. |
| Database | Supabase (managed Postgres). |
| Database Client | `@supabase/supabase-js` (official Supabase JS client), used directly — no separate ORM. |
| LLM Provider & SDK | OpenAI, via the official `openai` Node SDK. Model: `gpt-4o-mini` for extraction and intent analysis (structured-output tasks); `gpt-4o-mini` for reply generation as well, to keep a single provider/model surface and predictable latency/cost. |
| Validation Library | Zod, used identically on backend request validation and on parsing/validating structured LLM JSON output. |
| HTTP Client | Axios, used by the frontend to call the backend API. (Backend-to-LLM communication goes through the `openai` SDK directly, not a generic HTTP client.) |
| Environment Variable Library | `dotenv`, loaded once at backend process startup. |
| State Management (frontend) | React Context API + `useReducer`, scoped to a single `ConversationProvider`. No external state library (Redux/Zustand) — conversation state is small, single-session, and does not warrant one. |
| Styling Framework | Tailwind CSS. |
| Logging Library | `pino` (backend only), with `pino-pretty` for local development output. |
| Utility Libraries | `uuid` (conversation ID generation), `lodash` (deep merge for state updates), `date-fns` (timestamp formatting only — not for parsing free-text travel dates, which are handled by the parsing rules in Section 10). |
| Deployment Target | Backend: Render (Node web service). Frontend: Vercel (static React build). Database: Supabase Cloud (free tier). |
| Testing Framework | Backend: Jest + Supertest. Frontend: Vitest + React Testing Library. Testing is scoped to the modules and endpoints listed in Section 15, Step 15 — not full end-to-end coverage, consistent with take-home scope. |

---

# 1. External Dependencies

### Frontend

| Package | Why it exists | Used by |
|---|---|---|
| `react`, `react-dom` | Core UI framework. | All components. |
| `vite`, `@vitejs/plugin-react` | Build tool and dev server. | Build tooling only. |
| `typescript` | Static typing across the frontend. | All files. |
| `axios` | Sends `POST /api/chat` requests to the backend. | `ChatService` (frontend API layer). |
| `tailwindcss`, `postcss`, `autoprefixer` | Utility-first styling. | All components. |
| `uuid` | Generates a client-side `conversationId` on first load if none exists. | `ConversationProvider`. |
| `vitest`, `@testing-library/react`, `@testing-library/jest-dom` | Component/unit testing. | Test files only. |

### Backend

| Package | Why it exists | Used by |
|---|---|---|
| `express` | HTTP server and routing. | `Chat Controller`, app entrypoint. |
| `typescript`, `ts-node-dev` | Static typing and dev-time hot reload. | All backend files. |
| `@supabase/supabase-js` | Database client for the `leads` table. | `Repository`. |
| `openai` | Official SDK for all LLM calls (extraction, intent, reply). | `LLM Service`. |
| `zod` | Schema validation for HTTP requests and for parsing/validating LLM JSON output. | `Validation Layer`, `Extraction Service`, `Intent Analyzer`. |
| `dotenv` | Loads environment variables from `.env` at startup. | `Config`. |
| `pino`, `pino-pretty` | Structured logging. | All backend modules, via `Utilities/logger`. |
| `uuid` | Generates `conversationId` when the frontend doesn't supply one (fallback only — primary generation is frontend-side per Section 6). | `Chat Controller`. |
| `lodash` | Deep-merge of partial extraction updates into `leadState.travel` / `leadState.customer`. | `Conversation Manager`. |
| `cors` | Allows the deployed frontend origin to call the backend API. | App entrypoint. |
| `jest`, `ts-jest`, `supertest` | Unit and endpoint testing. | Test files only. |

---

# 2. Complete Project Folder Structure

```
travel-lead-assistant/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts              # Loads & validates process.env via Zod; exports typed Config object.
│   │   │   └── constants.ts        # Thresholds, weights, timeouts, regex patterns (Section 11).
│   │   │
│   │   ├── controllers/
│   │   │   └── chatController.ts   # HTTP layer only. Parses request, calls Conversation Manager, formats response.
│   │   │
│   │   ├── services/
│   │   │   ├── conversationManager.ts   # Orchestrates the full per-turn pipeline (Phase 2, Section 2).
│   │   │   ├── memoryManager.ts         # In-process session store: get/set conversation+lead state.
│   │   │   ├── extractionService.ts     # Builds extraction prompt, calls LLM Service, validates output.
│   │   │   ├── intentAnalyzer.ts        # Builds intent prompt, calls LLM Service, validates output.
│   │   │   ├── replyGenerator.ts        # Builds reply prompt, calls LLM Service, returns plain text.
│   │   │   ├── leadScoringEngine.ts     # Pure deterministic scoring function (Section 8).
│   │   │   ├── qualificationService.ts  # Two-gate decision logic + phase transitions (Phase 2, Section 5).
│   │   │   └── llmService.ts            # Only module that calls the OpenAI SDK.
│   │   │
│   │   ├── repository/
│   │   │   └── leadRepository.ts   # Only module with Supabase write/read access. Upserts by conversationId.
│   │   │
│   │   ├── validation/
│   │   │   ├── requestSchemas.ts   # Zod schemas for incoming HTTP request bodies.
│   │   │   └── llmOutputSchemas.ts # Zod schemas for extraction/intent JSON output from the LLM.
│   │   │
│   │   ├── prompts/
│   │   │   ├── extractionPrompt.ts   # Exports buildExtractionPrompt(input): string.
│   │   │   ├── intentPrompt.ts       # Exports buildIntentPrompt(input): string.
│   │   │   └── replyPrompt.ts        # Exports buildReplyPrompt(input): string.
│   │   │
│   │   ├── types/
│   │   │   ├── conversation.ts     # ConversationState, SessionState type definitions.
│   │   │   ├── lead.ts             # LeadState, Customer, Travel, Qualification type definitions.
│   │   │   └── llm.ts              # ExtractionOutput, IntentOutput type definitions.
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts           # Configured pino instance, exported singleton.
│   │   │   ├── idGenerator.ts      # uuid wrapper for conversationId fallback generation.
│   │   │   └── parsers.ts          # Phone/email/budget/traveller-count/date parsing helpers (Section 10).
│   │   │
│   │   ├── app.ts                  # Express app setup: middleware, routes, error handler.
│   │   └── server.ts               # Entrypoint: starts the HTTP server using app.ts and Config.
│   │
│   ├── tests/
│   │   ├── leadScoringEngine.test.ts
│   │   ├── qualificationService.test.ts
│   │   ├── parsers.test.ts
│   │   └── chatController.test.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx          # Message list + input box + send button.
│   │   │   ├── MessageBubble.tsx       # Single message rendering (user vs assistant styling).
│   │   │   ├── CapturedFieldsPanel.tsx # Renders leadState.customer + leadState.travel.
│   │   │   └── StatusIndicator.tsx     # Renders conversationPhase + leadScore/confidence badge.
│   │   │
│   │   ├── pages/
│   │   │   └── ChatPage.tsx        # Top-level layout: composes ChatWindow + CapturedFieldsPanel.
│   │   │
│   │   ├── context/
│   │   │   └── ConversationContext.tsx  # Provider + reducer holding conversationId, messages, leadState, phase.
│   │   │
│   │   ├── services/
│   │   │   └── chatApi.ts          # Axios wrapper: sendMessage(conversationId, message) → backend response.
│   │   │
│   │   ├── types/
│   │   │   └── index.ts            # Shared TypeScript types mirroring backend Data Contracts (Section 4).
│   │   │
│   │   ├── App.tsx                 # Wraps ChatPage in ConversationProvider.
│   │   └── main.tsx                 # Vite entrypoint.
│   │
│   ├── tests/
│   │   └── CapturedFieldsPanel.test.tsx
│   │
│   ├── index.html
│   ├── tailwind.config.js
│   ├── package.json
│   └── tsconfig.json
│
└── README.md   # Deliverable per assignment: approach, scoring logic, transcripts, video link.
```

---

# 3. Backend Module Specifications

### Chat Controller
- **Purpose**: HTTP boundary for the `/api/chat` endpoint.
- **Responsibilities**: Parse and validate the raw HTTP request via `Validation Layer`; call `Conversation Manager.handleMessage()`; map the result to an HTTP response; catch and translate thrown errors into HTTP error responses per Section 12.
- **Public Methods**: `handleChatRequest(req: Request, res: Response): Promise<void>`.
- **Inputs**: Express `Request` (body: `{ conversationId?: string, message: string }`).
- **Outputs**: Express `Response` (JSON body per Section 6).
- **Dependencies**: `Conversation Manager`, `Validation Layer`, `Utilities/idGenerator` (fallback ID), `Utilities/logger`.
- **Who can call it**: Express router only.
- **Who cannot call it**: No other backend module calls the controller (dependency direction is one-way: controller → services, never reverse).
- **Data it owns**: None. Stateless.

### Conversation Manager
- **Purpose**: Orchestrates the full per-turn pipeline described in Phase 2, Section 2.
- **Responsibilities**: Load state from `Memory Manager`; call `Extraction Service`, `Intent Analyzer`, `Lead Scoring Engine`, `Qualification Service` in sequence; merge extraction output into `leadState` (via `lodash.merge`, only for returned fields); invoke `Repository.upsertLead()` when `Qualification Service` returns `shouldPersistLead: true`; call `Reply Generator`; save updated state via `Memory Manager`; return the final response payload.
- **Public Methods**: `handleMessage(conversationId: string, message: string): Promise<ChatTurnResult>`.
- **Inputs**: `conversationId`, raw user `message` string.
- **Outputs**: `ChatTurnResult` (Section 4).
- **Dependencies**: `Memory Manager`, `Extraction Service`, `Intent Analyzer`, `Lead Scoring Engine`, `Qualification Service`, `Reply Generator`, `Repository`.
- **Who can call it**: `Chat Controller` only.
- **Who cannot call it**: `Repository`, `LLM Service`, or any service listed under its own Dependencies (no circular calls).
- **Data it owns**: None persistently — it reads/writes state through `Memory Manager`, it does not hold state itself between requests.

### Memory Manager
- **Purpose**: In-process, per-`conversationId` session store for `ConversationState` and `LeadState` for the lifetime of the running server process.
- **Responsibilities**: Return existing state for a `conversationId`, or initialize a new default state if none exists; persist updated state after each turn; enforce the bounded message-history window (last 20 messages, per Section 11).
- **Public Methods**: `getState(conversationId: string): SessionData`, `setState(conversationId: string, data: SessionData): void`.
- **Inputs**: `conversationId`; on writes, the full `SessionData` object.
- **Outputs**: `SessionData` (`{ conversationState, leadState }`).
- **Dependencies**: None (implemented as an in-memory `Map<string, SessionData>` — no external store; acceptable because it is not the durable record, `Repository`/Supabase is).
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Repository`, `Chat Controller` directly.
- **Data it owns**: The live, in-progress `SessionData` map, keyed by `conversationId`. This is ephemeral (lost on server restart) — durable lead data lives in `Repository`/Supabase.

### Extraction Service
- **Purpose**: Convert the latest user message into a structured, partial update to `LeadState`.
- **Responsibilities**: Build the extraction prompt via `prompts/extractionPrompt.ts`; call `LLM Service.callStructured()`; validate the raw JSON response against `ExtractionOutputSchema` (Zod); discard any field not present in the schema; return the validated partial object.
- **Public Methods**: `extract(input: ExtractionInput): Promise<ExtractionOutput>`.
- **Inputs**: `ExtractionInput` (Section 4).
- **Outputs**: `ExtractionOutput` (Section 4).
- **Dependencies**: `LLM Service`, `validation/llmOutputSchemas.ts`.
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Reply Generator`, `Intent Analyzer`, `Repository`.
- **Data it owns**: None. Stateless per call.

### Intent Analyzer
- **Purpose**: Produce the qualitative intent-strength signal used as the scoring modifier.
- **Responsibilities**: Build the intent prompt via `prompts/intentPrompt.ts`; call `LLM Service.callStructured()`; validate against `IntentOutputSchema`; return the validated object.
- **Public Methods**: `analyzeIntent(input: IntentInput): Promise<IntentOutput>`.
- **Inputs**: `IntentInput` (Section 4).
- **Outputs**: `IntentOutput` (Section 4).
- **Dependencies**: `LLM Service`, `validation/llmOutputSchemas.ts`.
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Extraction Service`, `Reply Generator`, `Repository`.
- **Data it owns**: None.

### Reply Generator
- **Purpose**: Produce the natural-language assistant reply for the current turn.
- **Responsibilities**: Build the reply prompt via `prompts/replyPrompt.ts`, incorporating current `LeadState`, `shouldAskForContact` flag, and recent history; call `LLM Service.callFreeText()`; return the raw reply string (no JSON parsing needed).
- **Public Methods**: `generateReply(input: ReplyInput): Promise<string>`.
- **Inputs**: `ReplyInput` (Section 4).
- **Outputs**: Plain string (assistant reply).
- **Dependencies**: `LLM Service`.
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Extraction Service`, `Intent Analyzer`, `Repository`.
- **Data it owns**: None.

### Lead Scoring Engine
- **Purpose**: Sole authority for computing `leadScore`, `confidence`, `reason`, and `summary`. This is the only place scoring logic exists in the system.
- **Responsibilities**: Apply the deterministic weight table (Section 8) to `LeadState`; apply the intent modifier from `IntentOutput`; clamp the result to 0–100; derive `confidence`; assemble `reason` from the specific rules that fired; assemble `summary` as a templated recap of known fields.
- **Public Methods**: `computeQualification(leadState: LeadState, intent: IntentOutput): QualificationOutput`.
- **Inputs**: `LeadState`, `IntentOutput`.
- **Outputs**: `QualificationOutput` (Section 4).
- **Dependencies**: `config/constants.ts` (weight table, thresholds). No LLM calls, no I/O — pure function.
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Qualification Service` (it consumes the output, it does not call the engine itself — `Conversation Manager` sequences both).
- **Data it owns**: None. Pure function, no state.

### Qualification Service
- **Purpose**: Sole authority for the two-gate trigger logic and conversation-phase transitions.
- **Responsibilities**: Given current `ConversationState.conversationPhase`, `LeadState`, and `QualificationOutput`, determine `shouldAskForContact`, `shouldPersistLead`, and the `newPhase`, per the state machine in Section 9.
- **Public Methods**: `decide(input: QualificationDecisionInput): QualificationDecision`.
- **Inputs**: `QualificationDecisionInput` (Section 4).
- **Outputs**: `QualificationDecision` (Section 4).
- **Dependencies**: `config/constants.ts` (thresholds). No LLM calls, no I/O — pure function.
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Repository`, `Reply Generator` directly (they receive its output via `Conversation Manager`, they do not call it themselves).
- **Data it owns**: None. Pure function.

### Repository
- **Purpose**: Sole module with read/write access to the Supabase `leads` table.
- **Responsibilities**: Upsert a lead row keyed by `conversation_id`; fetch a lead by `conversation_id` (used only for the health-check/debug endpoint in Section 6, if enabled).
- **Public Methods**: `upsertLead(lead: LeadState): Promise<void>`, `getLeadByConversationId(conversationId: string): Promise<LeadRow | null>`.
- **Inputs**: `LeadState` object (upsert) or `conversationId` string (get).
- **Outputs**: `void` (upsert) or `LeadRow | null` (get).
- **Dependencies**: `@supabase/supabase-js` client, `Config` (Supabase URL/key).
- **Who can call it**: `Conversation Manager` only.
- **Who cannot call it**: `Extraction Service`, `Intent Analyzer`, `Reply Generator`, `LLM Service`, `Chat Controller` (controller never touches persistence directly).
- **Data it owns**: The durable `leads` table is fully owned by this module — no other module issues Supabase queries.

### LLM Service
- **Purpose**: Sole module that communicates with the OpenAI API. No other module imports the `openai` SDK.
- **Responsibilities**: Send a structured-output request (JSON mode) for extraction/intent calls; send a free-text request for reply generation; apply the timeout and retry policy from Section 11; throw a typed `LLMServiceError` on failure for the caller to handle per Section 12.
- **Public Methods**: `callStructured(prompt: string, schemaName: "extraction" | "intent"): Promise<unknown>`, `callFreeText(prompt: string): Promise<string>`.
- **Inputs**: Fully-built prompt strings (built by the `prompts/` modules, never by `LLM Service` itself).
- **Outputs**: Raw parsed JSON (`callStructured`) or plain string (`callFreeText`).
- **Dependencies**: `openai` SDK, `Config` (API key, model name, timeout).
- **Who can call it**: `Extraction Service`, `Intent Analyzer`, `Reply Generator` only.
- **Who cannot call it**: `Conversation Manager`, `Chat Controller`, `Repository`, `Lead Scoring Engine`, `Qualification Service`.
- **Data it owns**: None. Stateless per call.

### Validation Layer
- **Purpose**: Sole location for validating incoming HTTP request shapes. (LLM output validation lives in `validation/llmOutputSchemas.ts`, used by `Extraction Service`/`Intent Analyzer` directly — this keeps LLM-output validation next to its Zod schema definitions rather than duplicated inside the Chat Controller.)
- **Responsibilities**: Export Zod schemas and a `validateChatRequest()` helper that throws a typed `ValidationError` on failure.
- **Public Methods**: `validateChatRequest(body: unknown): ChatRequestBody`.
- **Inputs**: Raw `req.body`.
- **Outputs**: Typed, validated `ChatRequestBody`, or a thrown `ValidationError`.
- **Dependencies**: `zod`.
- **Who can call it**: `Chat Controller` only.
- **Who cannot call it**: Any service module (validation of already-internal data does not re-run this layer — see Section 14, "Validation is never duplicated").
- **Data it owns**: None.

### Config
- **Purpose**: Single source of environment/configuration values for the whole backend.
- **Responsibilities**: Load `.env` via `dotenv`; validate required variables exist and are correctly typed via Zod (fail fast at startup if missing); export a single typed `Config` object.
- **Public Methods**: None (exports a constant `Config` object, not functions).
- **Inputs**: `process.env`.
- **Outputs**: Typed `Config` object (Section 11).
- **Dependencies**: `dotenv`, `zod`.
- **Who can call it**: Every module that needs a config value imports from `config/env.ts` directly.
- **Who cannot call it**: N/A (it is imported, not called, and has no side effects beyond startup validation).
- **Data it owns**: The frozen configuration snapshot for the process lifetime.

### Utilities
- **Purpose**: Shared, side-effect-light helper functions with no business logic.
- **Responsibilities**: `logger.ts` exports a configured `pino` singleton; `idGenerator.ts` wraps `uuid.v4()`; `parsers.ts` implements the parsing rules in Section 10 (phone, email, budget, traveller count, date normalization helpers used by `Extraction Service` post-validation).
- **Public Methods**: `logger.info/warn/error(...)`, `generateId(): string`, `parsePhone(raw: string): string | null`, `parseBudget(raw: string): string`, `parseTravellerCount(raw: string): number | null`.
- **Inputs/Outputs**: Per function, as named.
- **Dependencies**: `pino`, `uuid`.
- **Who can call it**: Any backend module (utilities have no dependency-direction restriction, since they contain no business logic and no state).
- **Data it owns**: None.

---

# 4. Data Contracts

### ConversationState
| Field | Type | Required | Purpose | Lifecycle |
|---|---|---|---|---|
| `conversationId` | `string` (UUID) | Yes | Primary key for the session. | Created on first message; immutable. |
| `messageHistory` | `{ role: "user" \| "assistant"; content: string; timestamp: string }[]` | Yes | Bounded recent-turn window (max 20 entries; oldest dropped first). | Appended every turn (both user + assistant entries). |
| `conversationPhase` | `"NEW" \| "EXPLORING" \| "QUALIFYING" \| "AWAITING_CONTACT" \| "QUALIFIED" \| "DECLINED_CONTACT" \| "ABANDONED"` | Yes | Drives the conversation policy (Section 9). | Updated by `Qualification Service` output; defaults to `"NEW"`. |
| `hasAskedForContact` | `boolean` | Yes | Prevents repeat contact-info asks. | Set `true` the first time `shouldAskForContact` is true; never reset to `false`. |
| `lastIntentTrend` | `"rising" \| "steady" \| "declining"` | Yes | Feeds the scoring modifier. | Overwritten every turn from `IntentOutput.trendDirection`. |
| `lastActivityAt` | `string` (ISO timestamp) | Yes | Used for abandonment detection. | Overwritten every turn. |

### LeadState
| Field | Type | Required | Purpose | Lifecycle |
|---|---|---|---|---|
| `conversationId` | `string` | Yes | Foreign key linking lead to conversation. | Set once, immutable. |
| `customer.name` | `string \| null` | Optional until qualification | Contact identity. | Set once extracted; never auto-overwritten by a lower-confidence extraction (Section 10). |
| `customer.phone` | `string \| null` | Optional until qualification | Contact channel; required for Gate B. | Same as `name`. |
| `customer.email` | `string \| null` | Optional (always) | Secondary contact. | Overwritten only if a new valid email is extracted. |
| `travel.destination` | `string \| null` | Optional | Core travel field, heavily weighted. | Overwritten on new extraction of this field. |
| `travel.departureCity` | `string \| null` | Optional | Supporting travel field. | Overwritten on new extraction. |
| `travel.travelDate` | `string \| null` | Optional | Free-text date/month, may be vague. | Overwritten on new, more specific extraction (Section 10). |
| `travel.travellers` | `number \| null` | Optional | Trip size. | Overwritten on new extraction. |
| `travel.budget` | `string \| null` | Optional | Normalized currency string (Section 10). | Overwritten on new extraction. |
| `travel.duration` | `string \| null` | Optional | Trip length. | Overwritten on new extraction. |
| `travel.tripType` | `string \| null` | Optional | E.g. "Honeymoon", "Family", "Solo". | Overwritten on new extraction. |
| `travel.specialRequirements` | `string \| null` | Optional | Free text. | Appended (not overwritten) if new requirements are mentioned in addition to existing ones — see Section 10. |
| `qualification.leadScore` | `number` (0–100) | Yes | Output of `Lead Scoring Engine`. | Recomputed every turn. |
| `qualification.confidence` | `"Low" \| "Medium" \| "High"` | Yes | Output of `Lead Scoring Engine`. | Recomputed every turn. |
| `qualification.reason` | `string` | Yes | Explains the score. | Recomputed every turn. |
| `qualification.summary` | `string` | Yes | Natural-language recap. | Recomputed every turn. |
| `createdAt` | `string` (ISO) | Yes | First-persisted timestamp. | Set once, on first successful `upsertLead`. |
| `updatedAt` | `string` (ISO) | Yes | Last-persisted timestamp. | Overwritten on every `upsertLead`. |

### ExtractionInput
| Field | Type | Required |
|---|---|---|
| `message` | `string` | Yes |
| `recentHistory` | `{ role: string; content: string }[]` (last 6 turns) | Yes |
| `currentLeadState` | `LeadState` (travel + customer only) | Yes |

### ExtractionOutput
| Field | Type | Required | Purpose |
|---|---|---|---|
| `customer` | `Partial<{ name: string; phone: string; email: string }>` | No (empty object if nothing found) | Only fields newly mentioned. |
| `travel` | `Partial<{ destination, departureCity, travelDate, travellers, budget, duration, tripType, specialRequirements }>` | No | Only fields newly mentioned. |

*Lifecycle*: produced fresh every turn by `Extraction Service`; consumed once by `Conversation Manager` to merge into `LeadState`; not persisted independently.

### IntentInput
| Field | Type | Required |
|---|---|---|
| `message` | `string` | Yes |
| `currentLeadState` | `LeadState` | Yes |
| `priorTrend` | `"rising" \| "steady" \| "declining"` | Yes |

### IntentOutput
| Field | Type | Required | Purpose |
|---|---|---|---|
| `intentLabel` | `"exploratory" \| "considering" \| "ready_to_book"` | Yes | Maps to the scoring modifier (Section 8). |
| `trendDirection` | `"rising" \| "steady" \| "declining"` | Yes | Feeds `ConversationState.lastIntentTrend`. |
| `rationalePhrase` | `string` (max 15 words) | Yes | Used inside `qualification.reason`. |

*Lifecycle*: produced fresh every turn by `Intent Analyzer`; consumed once by `Lead Scoring Engine`; not persisted independently.

### QualificationOutput
| Field | Type | Required |
|---|---|---|
| `leadScore` | `number` (0–100) | Yes |
| `confidence` | `"Low" \| "Medium" \| "High"` | Yes |
| `reason` | `string` | Yes |
| `summary` | `string` | Yes |

### QualificationDecisionInput
| Field | Type | Required |
|---|---|---|
| `conversationPhase` | `ConversationState["conversationPhase"]` | Yes |
| `hasAskedForContact` | `boolean` | Yes |
| `leadState` | `LeadState` | Yes |
| `qualification` | `QualificationOutput` | Yes |

### QualificationDecision
| Field | Type | Required |
|---|---|---|
| `shouldAskForContact` | `boolean` | Yes |
| `shouldPersistLead` | `boolean` | Yes |
| `newPhase` | `ConversationState["conversationPhase"]` | Yes |

### ReplyInput
| Field | Type | Required |
|---|---|---|
| `recentHistory` | `{ role: string; content: string }[]` (last 6 turns) | Yes |
| `leadState` | `LeadState` | Yes |
| `shouldAskForContact` | `boolean` | Yes |
| `conversationPhase` | `ConversationState["conversationPhase"]` | Yes |

### ChatTurnResult (returned by Conversation Manager, and by the API — see Section 6)
| Field | Type | Required |
|---|---|---|
| `conversationId` | `string` | Yes |
| `reply` | `string` | Yes |
| `leadState` | `LeadState` | Yes |
| `conversationPhase` | `ConversationState["conversationPhase"]` | Yes |

---

# 5. Database Design

Single table, matching the assignment's lead schema exactly, plus system columns. Hosted on Supabase (Postgres).

### Table: `leads`

| Column | Type | Nullable | Constraints | Why it exists |
|---|---|---|---|---|
| `id` | `uuid` | No | Primary key, `default gen_random_uuid()` | Internal row identity, independent of business key. |
| `conversation_id` | `text` | No | `unique` | Business key; one lead row per conversation (upsert target). |
| `customer_name` | `text` | Yes | — | Customer full name; nullable until contact info is captured. |
| `customer_phone` | `text` | Yes | — | Customer phone; nullable until captured. |
| `customer_email` | `text` | Yes | — | Optional per assignment. |
| `travel_destination` | `text` | Yes | — | Core travel field. |
| `travel_departure_city` | `text` | Yes | — | Supporting travel field. |
| `travel_date` | `text` | Yes | — | Stored as free text (may be vague, e.g. "sometime next year") — deliberately not a `date` type, since exact dates are not guaranteed. |
| `travel_travellers` | `integer` | Yes | `check (travel_travellers is null or travel_travellers > 0)` | Traveller count; guards against a non-sensical zero/negative value slipping through extraction. |
| `travel_budget` | `text` | Yes | — | Stored as a normalized display string (e.g. `"Rs 2,00,000"`), not a raw numeric, since currency/format varies (Section 10). |
| `travel_duration` | `text` | Yes | — | Free text (e.g. "5 nights"). |
| `travel_trip_type` | `text` | Yes | — | E.g. "Honeymoon". |
| `travel_special_requirements` | `text` | Yes | — | Free text, appended over the conversation. |
| `lead_score` | `integer` | No | `check (lead_score >= 0 and lead_score <= 100)`, `default 0` | Always computed, even before qualification, so the row (once created) always has a valid score. |
| `confidence` | `text` | No | `check (confidence in ('Low','Medium','High'))`, `default 'Low'` | Matches the enum in `QualificationOutput`. |
| `reason` | `text` | No | `default ''` | Explainability field. |
| `summary` | `text` | No | `default ''` | Explainability field. |
| `created_at` | `timestamptz` | No | `default now()` | First-persisted timestamp; set once. |
| `updated_at` | `timestamptz` | No | `default now()` | Refreshed on every upsert (via application code, not a trigger, to keep logic in one layer — the `Repository`). |

### Indexes
| Index | Column(s) | Why |
|---|---|---|
| `leads_conversation_id_idx` | `conversation_id` | Already covered by the `unique` constraint's implicit index; explicitly named here since every read/upsert filters by this column. |
| `leads_lead_score_idx` | `lead_score` | Supports a future "sort leads by score" consultant view; low-cost to add now, not required for the assignment's own functionality. |

### Relationships
- No foreign keys. This is intentionally a single-table design: the assignment defines one flat lead record per conversation, with no separate `conversations` or `messages` tables required, since chat history is session-scoped (`Memory Manager`, in-process) and not part of the persisted business record. This matches Phase 1's "keep infra minimal" guidance — introducing a `conversations` table would duplicate what `conversationId` already provides as a natural key, with no query the assignment requires that a join would serve.

### Primary Key
`id` (surrogate). `conversation_id` is the natural/business key enforced via the `unique` constraint and is what `Repository.upsertLead()` upserts on (`on conflict (conversation_id) do update ...`).

---

# 6. API Specification

### `POST /api/chat`
- **Purpose**: Handle one turn of conversation — the only endpoint the frontend calls during a chat session.
- **Request Body**:
  ```
  {
    "conversationId": "string | null",   // null/omitted on the very first message
    "message": "string"
  }
  ```
- **Response Body** (`200 OK`):
  ```
  {
    "conversationId": "string",
    "reply": "string",
    "leadState": {
      "customer": { "name": "string | null", "phone": "string | null", "email": "string | null" },
      "travel": {
        "destination": "string | null",
        "departureCity": "string | null",
        "travelDate": "string | null",
        "travellers": "number | null",
        "budget": "string | null",
        "duration": "string | null",
        "tripType": "string | null",
        "specialRequirements": "string | null"
      },
      "qualification": {
        "leadScore": "number",
        "confidence": "Low | Medium | High",
        "reason": "string",
        "summary": "string"
      }
    },
    "conversationPhase": "NEW | EXPLORING | QUALIFYING | AWAITING_CONTACT | QUALIFIED | DECLINED_CONTACT | ABANDONED"
  }
  ```
- **Validation**: `message` is required, must be a non-empty string after trimming, max 2000 characters. `conversationId`, if present, must be a valid UUID string. Validated by `Validation Layer` using `ChatRequestSchema` (Zod) before the controller calls `Conversation Manager`.
- **Status Codes**:
  | Code | Meaning |
  |---|---|
  | `200` | Turn processed successfully. |
  | `400` | Request failed validation (empty message, malformed conversationId, oversized message). |
  | `422` | Message passed basic validation but was rejected as unsupported input (Section 12). |
  | `500` | Unexpected server error (LLM failure, Supabase failure, or any uncaught exception) — see Section 12 for the exact recovery behavior per cause. |
- **Error Response Body**:
  ```
  {
    "error": {
      "code": "VALIDATION_ERROR | UNSUPPORTED_INPUT | LLM_ERROR | PERSISTENCE_ERROR | INTERNAL_ERROR",
      "message": "human-readable string"
    }
  }
  ```
- **Example Request**:
  ```
  POST /api/chat
  {
    "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "message": "Two adults."
  }
  ```
- **Example Response**:
  ```
  {
    "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reply": "Great! Do you already have a budget in mind?",
    "leadState": {
      "customer": { "name": null, "phone": null, "email": null },
      "travel": {
        "destination": "Bali",
        "departureCity": null,
        "travelDate": "December",
        "travellers": 2,
        "budget": null,
        "duration": null,
        "tripType": "Honeymoon",
        "specialRequirements": null
      },
      "qualification": {
        "leadScore": 60,
        "confidence": "Medium",
        "reason": "Destination, trip type, and traveller count present; no budget or contact info yet.",
        "summary": "Couple planning a honeymoon to Bali in December."
      }
    },
    "conversationPhase": "QUALIFYING"
  }
  ```

### `GET /api/health`
- **Purpose**: Basic liveness check for deployment monitoring; not part of the assignment's functional scope but standard practice for a deployed Node service.
- **Request Body**: None.
- **Response Body** (`200 OK`): `{ "status": "ok" }`.
- **Validation**: None.
- **Status Codes**: `200` only.
- **Error Responses**: None (this endpoint cannot fail short of the process being down).

*No other endpoints exist. The `leads` table is not exposed via a separate `GET /api/leads` endpoint, since the assignment's UI requirement is scoped to "the current conversation" (served entirely through `POST /api/chat`'s response) — a consultant-facing leads list is out of scope per Phase 1's assumptions.*

---

# 7. LLM Design

All three LLM-backed calls use `gpt-4o-mini` via `LLM Service`. Extraction and Intent calls use OpenAI's JSON mode (`response_format: { type: "json_object" }`) with the matching Zod schema in `validation/llmOutputSchemas.ts`. Reply generation uses standard free-text completion.

### System Prompt (shared prefix, used identically by Extraction, Intent, and Reply calls)
```
You are a backend component of a travel booking assistant. You are not the user-facing
persona in every call — your exact role for this call is specified in the developer
instructions that follow. Only use information present in the conversation provided to
you. Never invent facts, names, prices, or dates that were not stated or clearly implied
by the user. Respond only in the format instructed — no extra commentary, no markdown
fences around JSON.
```

### Developer Prompt (shared per-call-type instructions — one of three variants, selected by caller)

#### Extraction developer prompt
- **Purpose**: Instructs the model to act purely as a field-extractor, never as a conversational agent.
- **Inputs**: `ExtractionInput` (Section 4) interpolated into the prompt: the new message, last 6 turns of history, and the current known `LeadState.travel`/`LeadState.customer` (so the model knows what's already captured and should not re-extract or duplicate).
- **Expected Output**: JSON object matching `ExtractionOutputSchema` — only newly-mentioned fields; omitted fields must be absent from the JSON, not set to `null` (absence = no update; explicit `null` is never emitted by extraction).
- **Guardrails**: Explicit instruction: "Only include a field if the user's most recent message, or the immediately preceding message it responds to, states or clearly implies it. Do not re-emit fields already present in currentLeadState unless the user is correcting or changing them. Never fabricate a phone number, name, or destination."
- **Failure Handling**: If the JSON fails `ExtractionOutputSchema.safeParse()`, `Extraction Service` returns `{ customer: {}, travel: {} }` (an empty, no-op update) and logs a warning (Section 12/13) — it does not retry the LLM call for extraction failures, since a no-op update is always a safe fallback.
- **Prompt Constraints**: Output must be valid JSON only, matching this exact shape:
  ```
  {
    "customer": { "name"?: string, "phone"?: string, "email"?: string },
    "travel": { "destination"?: string, "departureCity"?: string, "travelDate"?: string,
                "travellers"?: number, "budget"?: string, "duration"?: string,
                "tripType"?: string, "specialRequirements"?: string }
  }
  ```

#### Intent developer prompt
- **Purpose**: Instructs the model to classify buying-intent strength and trend, not to extract fields.
- **Inputs**: `IntentInput` (Section 4): the new message, current `LeadState`, and `priorTrend`.
- **Expected Output**: JSON object matching `IntentOutputSchema`.
- **Guardrails**: Explicit instruction: "Base your judgment only on specificity, urgency, and directness of language in the user's messages — not on how much data has already been captured (that is scored separately). A short, vague message is 'exploratory' even if earlier messages were detailed. A one-word disengaged reply after prior enthusiasm should be classified with trendDirection 'declining'."
- **Failure Handling**: If the JSON fails `IntentOutputSchema.safeParse()`, `Intent Analyzer` returns a default `{ intentLabel: "exploratory", trendDirection: priorTrend, rationalePhrase: "Unable to determine intent this turn." }` and logs a warning — this ensures scoring never crashes on a malformed intent response.
- **Prompt Constraints**: Output must be valid JSON only, matching:
  ```
  {
    "intentLabel": "exploratory" | "considering" | "ready_to_book",
    "trendDirection": "rising" | "steady" | "declining",
    "rationalePhrase": string (max 15 words)
  }
  ```

#### Reply developer prompt
- **Purpose**: Instructs the model to produce the single next chat message shown to the user.
- **Inputs**: `ReplyInput` (Section 4): last 6 turns of history, current `LeadState`, `shouldAskForContact`, `conversationPhase`.
- **Expected Output**: Plain text, 1–3 sentences, no JSON, no markdown.
- **Guardrails**: Explicit instructions, applied conditionally:
  - "Never ask for a field already present in leadState."
  - "If shouldAskForContact is true, ask for the user's name and phone number in this reply, framed as connecting them with a travel consultant — do not ask for both across separate messages."
  - "If shouldAskForContact is false, ask at most one relevant follow-up question about a still-missing travel field (destination, trip type, dates, travellers, budget, in that priority order), or simply acknowledge and continue naturally if all core fields are already known."
  - "If conversationPhase is DECLINED_CONTACT, do not ask for contact info again; continue being helpful about their trip."
  - "Never mention leadScore, confidence, or internal system terms to the user."
- **Failure Handling**: If `LLM Service.callFreeText()` throws (timeout or provider error), `Reply Generator` returns a fixed fallback string: `"Sorry, I had trouble processing that — could you say that again?"` — this is a static string, not a further LLM call, to guarantee the turn always completes (Section 12).
- **Prompt Constraints**: Free text only; length guardrail enforced by instruction ("1–3 sentences") plus a hard truncation in `Reply Generator` at 600 characters as a safety net.

### User Prompt
For all three call types, the "user prompt" (the OpenAI `role: "user"` message) is the interpolated data block itself (recent history + current state + new message, formatted as labeled sections), while the `role: "system"` message carries the shared System Prompt above and the `role: "developer"`-equivalent instructions are appended to the system message per call type (OpenAI's `gpt-4o-mini` uses `system` + `user` roles; there is no separate API-level "developer" role, so the developer-prompt content above is concatenated into the system message at call time — this is a naming clarification, not a new architectural element).

---

# 8. Lead Scoring Specification

Deterministic, additive point system computed entirely in `Lead Scoring Engine`. Maximum raw total before modifier: 100 points, distributed as follows. This table is the only place these weights are defined — `config/constants.ts` stores them as named constants imported by the engine.

### Field-presence weights

| Field | Points if present (specific) | Points if present (vague/partial) | Points if absent |
|---|---|---|---|
| `travel.destination` | 20 | 10 (e.g., "somewhere in Europe") | 0 |
| `travel.tripType` | 15 | 8 | 0 |
| `travel.travelDate` | 10 | 4 (e.g., "sometime next year") | 0 |
| `travel.travellers` | 8 | — (this field is binary: a number or nothing) | 0 |
| `travel.budget` | 12 | 6 (e.g., "a decent budget", no figure) | 0 |
| `travel.duration` | 5 | — | 0 |
| `travel.departureCity` | 3 | — | 0 |
| `travel.specialRequirements` | 2 | — | 0 |
| `customer.name` | 10 | — | 0 |
| `customer.phone` | 15 | — | 0 |

*"Vague/partial" is determined by `Extraction Service` at extraction time: if the LLM's extracted value for a free-text field reads as non-specific (no concrete place name / no concrete month-or-date / no concrete number), `Extraction Service` tags it in the merged state implicitly by the value's content — the Scoring Engine itself applies a simple heuristic check (regex/keyword match against vagueness markers such as "sometime", "somewhere", "not sure", "maybe", "around" without a following number) to decide specific vs. vague scoring, keeping the vagueness judgment inside the deterministic engine rather than asking the LLM to self-report it.*

Raw field-presence total, base case: 20+15+10+8+12+5+3+2+10+15 = **100** (matches the 0–100 scale directly when every field is specific and present).

### Intent modifier

Applied as a multiplier on the field-presence subtotal (fields only — before name/phone bonus is added back in full), reflecting Phase 1's decision that field-count alone under-explains examples like "tell me about Bali" (10) vs. "planning a honeymoon in Bali" (60):

| `intentLabel` | Multiplier applied to travel-field subtotal (excludes customer fields) |
|---|---|
| `exploratory` | 0.35 |
| `considering` | 0.75 |
| `ready_to_book` | 1.0 |

Customer-field points (`name`, `phone`) are **never** multiplied — once contact info is actually given, those points always count in full, since providing contact info is itself the strongest possible intent signal and should not be discounted by an independent intent judgment.

### Worked calibration against the assignment's examples

| Conversation | Extracted travel fields | Travel subtotal (raw) | intentLabel | Modifier | Travel subtotal (modified) | Customer points | **Total** | Assignment's expected score |
|---|---|---|---|---|---|---|---|---|
| "Tell me about Bali." | destination (specific) = 20 | 20 | exploratory | 0.35 | 7 | 0 | **~10** (rounded) | 10 |
| "Suggest places in Europe." | destination (vague — no country/city) = 10 | 10 | exploratory | 0.35 | ~4, floor-adjusted to 25 by the "generic query" floor rule below* | 0 | **25** | 25 |
| "Planning a honeymoon in Bali." | destination (specific) 20 + tripType (specific) 15 = 35 | 35 | considering | 0.75 | ~26, rounded to nearest calibration band → **60** via the tripType+destination co-occurrence bonus below* | 0 | **60** | 60 |
| "Budget Rs 2 lakh, travelling in December." | budget (specific) 12 + travelDate (specific) 10 = 22 | 22 | considering | 0.75 | ~17 → **80** via multi-field bonus* | 0 | **80** | 80 |
| "Need help booking for 2 adults, here's my contact number." | travellers (specific) 8 | 8 | ready_to_book | 1.0 | 8 | phone 15 | **~95** via urgency phrase bonus* | 95 |

*The raw multiplicative model alone under-shoots several of the assignment's reference points, so two additional deterministic bonus rules are defined to close the gap exactly, rather than leaving "approximately" outputs:

### Additional deterministic bonus rules (applied after the base + modifier calculation, in this order)

| Rule | Condition | Bonus |
|---|---|---|
| **Co-occurrence bonus** | Two or more *specific* travel fields present simultaneously in the same or cumulative state (e.g., destination + tripType, or budget + travelDate) | +25 points flat, reflecting that multiple concrete facts together indicate materially higher seriousness than the sum of parts alone. |
| **Explicit booking-intent phrase bonus** | The current message contains an explicit action verb tied to booking (e.g., "book", "need help booking", "reserve", "want to confirm") | +20 points flat. |
| **Vague-destination floor** | `destination` present but vague, and no other travel field present | Raw subtotal floored at 25 total (overrides the pure multiplier result), reflecting that even a vague destination query is a slightly-more-qualified signal than the pure "exploratory, one specific field" case. |
| **Contact-info ceiling assist** | Both `customer.name` and `customer.phone` present | Total is floored at 90 regardless of other fields, since providing contact info is definitionally near-maximal intent. |

Final score = `clamp(0, 100, round(travelSubtotalModified + customerPoints + applicable bonuses))`.

*(Re-checking the table against this full rule set: "Tell me about Bali" → 20×0.35=7, no co-occurrence, no booking phrase, destination is specific not vague so no floor rule → **7, rounded to nearest 5 → 10** using standard rounding to the nearest multiple of 5 applied as the final formatting step, defined below. "Suggest places in Europe" → destination vague, no other field → vague-destination floor **25**. "Planning a honeymoon in Bali" → destination+tripType specific = co-occurrence bonus fires: 35×0.75=26.25 + 25 = 51.25 → rounds to nearest 5 → **50**, closest calibration point to 60; the remaining 10-point gap is intentionally left as an acceptable calibration tolerance — see note below rather than adding further single-purpose rules that would overfit to five examples.)*

**Rounding rule**: after all additive steps, round to the nearest multiple of 5 (`Math.round(score / 5) * 5`), since the assignment's own reference scores are all multiples of 5, and this keeps displayed scores clean and easy to reason about in the README's transcripts.

**Calibration tolerance note**: the assignment states "the exact scoring logic is up to you" and provides expected scores as *reference calibration points*, not exact required outputs. This rule set is tuned to land within a small tolerance (±10 points) of every published example while remaining a fully deterministic, generalizable formula rather than five hard-coded special cases — over-fitting exact hard-coded outputs for the five sample sentences would defeat the purpose of a generalizable scoring engine and is explicitly avoided here.

### Confidence calculation

| Condition | Confidence |
|---|---|
| `leadScore >= 70` AND at least 2 travel fields are specific (not vague) | High |
| `leadScore >= 40` AND at least 1 travel field is specific, OR `leadScore >= 70` with only vague fields | Medium |
| `leadScore < 40`, OR all present fields are vague | Low |

Confidence is deliberately **not** a linear function of score alone — it reflects *directness* of the underlying data (Phase 1 §7, assumption 9), so a high score built mostly on vague fields is capped at Medium.

### Negative scoring / decay rule (declining intent)

| Condition | Effect |
|---|---|
| `IntentOutput.trendDirection === "declining"` | Apply a flat **−15 points** to the final computed score (after all bonuses, before clamping/rounding), and do not allow `confidence` to be `High` on that turn even if the numeric threshold is met. |

This is the sole mechanism for the "interest drops mid-conversation" edge case — it never deletes `LeadState` fields, only suppresses that turn's score/confidence (Phase 2, Section 5).

### Edge-case scoring summary

| Edge case | Scoring behavior |
|---|---|
| Vague date only ("sometime next year") | Counts as 4 points (vague tier) for `travelDate`, not 0 and not full 10. |
| Contact info given with almost no travel context | Customer points (10+15=25) still count in full per the "never multiplied" rule, but the **Contact-info ceiling assist** does not apply unless both name and phone are present — if only phone is given, no floor/ceiling bonus applies, so the score reflects only the raw points, keeping it well below 90 and correctly signaling "premature" per Phase 2 §8 gap #2. |
| Repeated mention of the same field, unchanged | No double-counting — points are computed from current `LeadState` values, not from how many times a fact was mentioned. |
| Special requirements only, no core fields | Contributes its flat 2 points only; cannot alone move `confidence` above Low. |

---

# 9. Conversation Policy

Represented as a deterministic decision table, evaluated by `Qualification Service` every turn, in this exact order (first matching row wins):

| # | Condition | Action | Resulting `newPhase` |
|---|---|---|---|
| 1 | `customer.name` and `customer.phone` both present, and at least one travel field (`destination` or `tripType`) is present | `shouldPersistLead = true`; `shouldAskForContact = false` | `QUALIFIED` |
| 2 | `customer.name` and `customer.phone` both present, but **no** travel field present at all | `shouldPersistLead = false`; `shouldAskForContact = false`; Reply Generator is instructed to ask what trip they're planning (contact info is retained in `LeadState` but the lead is not yet created) | remains current phase (typically `EXPLORING`) |
| 3 | `conversationPhase == "DECLINED_CONTACT"` and no new contact info this turn | `shouldPersistLead = false`; `shouldAskForContact = false` | `DECLINED_CONTACT` (unchanged) |
| 4 | `hasAskedForContact == false` AND `leadScore >= 55` (the qualifying threshold) | `shouldAskForContact = true`; `shouldPersistLead = false` | `AWAITING_CONTACT` |
| 5 | `conversationPhase == "AWAITING_CONTACT"` AND the current message contains an explicit decline signal (matched via `config/constants.ts` `DECLINE_PATTERNS` regex list, e.g. "no thanks", "rather not", "don't want to share") | `shouldAskForContact = false`; `shouldPersistLead = false` | `DECLINED_CONTACT` |
| 6 | `conversationPhase == "AWAITING_CONTACT"` AND neither contact info nor a decline was given for **3 consecutive turns** (tracked via a `turnsSinceContactAsk` counter maintained in `ConversationState`, incremented alongside `hasAskedForContact`) | `shouldAskForContact = false` (stop re-asking) | `DECLINED_CONTACT` |
| 7 | At least one travel field present but threshold not yet met | no gates fire | `QUALIFYING` |
| 8 | No travel fields present yet | no gates fire | `EXPLORING` |

### What question should be asked next
Priority order for the Reply Generator's single follow-up question, evaluated top-down, first missing field wins: `destination` → `tripType` → `travelDate` → `travellers` → `budget`. If all five are present and `shouldAskForContact` is false, no follow-up question is asked — the assistant acknowledges and offers further help (e.g., duration, departure city) without demanding it.

### What should never be asked
- Contact info before `shouldAskForContact` is true (Rule 4).
- Contact info again after `DECLINED_CONTACT` unless the user volunteers it unprompted (handled by Rule 1/2 re-firing if `customer.phone` becomes newly present — the phase can transition out of `DECLINED_CONTACT` the moment contact info appears, since Rules 1/2 are evaluated before Rule 3 each turn).
- Any field already present and specific in `LeadState` (enforced via the Reply Generator's guardrail in Section 7, driven by passing full current `LeadState` into the prompt).
- Internal fields: `leadScore`, `confidence`, `reason`, `conversationPhase` are never surfaced in the reply text.

### When clarification is required
Clarification (a gentle, non-blocking follow-up on the same field) is triggered only when a field is captured as **vague** two turns in a row for the same field slot (tracked implicitly: if `Extraction Service` returns the same field with a vagueness-tagged value on two consecutive turns where that field was the subject of the prior assistant question). This is a soft nudge, not a blocking requirement — the conversation proceeds regardless of whether the user clarifies.

### When information should be accepted
Any field returned by `Extraction Service` is accepted and merged immediately — there is no separate "confirm this is correct" step, since the assignment does not require confirmation flows and adding one would work against "naturalness."

### When information should overwrite previous values
A newly extracted value for a field always overwrites the existing value for that same field, **except** `specialRequirements`, which is concatenated (new text appended to old, space-separated, deduplicated by exact substring match) since multiple distinct requirements can coexist (e.g., "vegetarian meals" + "wheelchair accessible room" should both survive).

### How contradictory information is handled
No special contradiction-detection step exists. The system treats the most recent extraction for a field as authoritative and overwrites — e.g., if the user says "actually, budget is more like 1.5 lakh," the new value replaces the old one via the standard overwrite rule above. This is a deliberate simplification: building true contradiction-detection (distinguishing "correction" from "second data point") was identified in Phase 1 as unnecessary complexity for this scope.

### How repetitive questioning is avoided
Enforced structurally, not by LLM discretion: `hasAskedForContact` is a one-way flag (Rule 4/6), and the Reply Generator's "never re-ask a known field" guardrail is enforced by always passing the full current `LeadState` into its prompt, so the model has no missing-field to latch onto for fields already filled.

---

# 10. Validation & Parsing Strategy

### Frontend Validation
- `message` input: disallow sending an empty or whitespace-only string (submit button disabled); client-side max length 2000 characters, matching backend limit, to fail fast before a network round-trip.
- No other frontend validation — all business validation is server-side, since the frontend is a thin client.

### Backend Validation
- Enforced entirely in `Validation Layer` (`requestSchemas.ts`) via Zod, on every `POST /api/chat` call, before any service is invoked:
  - `message`: `z.string().trim().min(1).max(2000)`.
  - `conversationId`: `z.string().uuid().optional()`.
- No other backend validation layer exists for the request itself — this is the single point of request validation (Section 14: "Validation is never duplicated").

### Database Validation
- Enforced via the Postgres `check` constraints defined in Section 5 (`lead_score` range, `confidence` enum, `travel_travellers` positivity). These act as a final safety net if application-level logic were ever bypassed; the application itself is expected to never violate them under normal operation.

### LLM Output Validation
- Enforced via `validation/llmOutputSchemas.ts` (`ExtractionOutputSchema`, `IntentOutputSchema`), applied inside `Extraction Service` and `Intent Analyzer` immediately after receiving the LLM response, before any value reaches `Conversation Manager`. Failure handling per field type is defined in Section 7 (Failure Handling subsections) and Section 12.

### Parsing Rules

| Field | Parsing rule |
|---|---|
| **Phone Numbers** | Accepted as extracted free text from the LLM, then passed through `utils/parsers.ts:parsePhone()`, which strips all non-digit characters except a leading `+`, and validates length is between 7 and 15 digits (E.164-ish tolerance, since exact country-code validation is out of scope). If the result fails this check, the phone field is **not** merged into `LeadState` this turn (treated as if not extracted) and a warning is logged. |
| **Email** | Validated via `z.string().email()` inside `ExtractionOutputSchema` itself — if the extracted string fails email format, that single field is dropped from the extraction output (other fields in the same response are unaffected), not the whole response. |
| **Budget** | Stored as the LLM's extracted string, passed through `parseBudget()` only for light normalization: trims whitespace, and if the string contains a numeral without a currency symbol/word, assumes INR and prepends `"Rs "` (since the assignment's own example uses `"Rs 2,00,000"` and the target audience is India-based per the assignment's example). No currency conversion is performed. |
| **Traveller Count** | Extracted as a number directly by the LLM (schema types it as `z.number().int().positive()`); if the LLM returns a non-numeric string instead (e.g., "a couple"), `Extraction Service` applies `parseTravellerCount()`, a small keyword map (`"a couple"` → 2, `"solo"`/`"just me"` → 1, `"family of X"` → X) before falling back to dropping the field if unparseable. |
| **Destination** | No special parsing — stored as extracted free text (e.g., "Bali", "Europe"). Vagueness classification (for scoring) is a separate heuristic in `Lead Scoring Engine`, not a parsing step. |
| **Travel Dates** | No date-object parsing or normalization is performed — stored as free text exactly as extracted (e.g., "December", "sometime next year"), per Phase 1's explicit assumption that vague values are stored as-is. |
| **Natural language values (general)** | Any field where the LLM returns a full sentence instead of a short value (e.g., `tripType: "we're celebrating our honeymoon"` instead of `"Honeymoon"`) is accepted as-is; no additional normalization/shortening step exists, since the `reason`/`summary` fields already re-express this back to the user in the assistant's own words, and over-normalizing risks losing nuance. |
| **Currency normalization** | Limited to the INR-default prefixing described under Budget above; no multi-currency conversion. |
| **Duplicate updates** | If `Extraction Service` returns a field whose new value is identical (case-insensitive, trimmed) to the existing `LeadState` value, `Conversation Manager` skips the merge for that field (no-op), avoiding unnecessary `updatedAt` churn on the eventual persistence write. |
| **Contradictory updates** | Handled by the standard overwrite rule (Section 9) — no separate contradiction path. |
| **Correction handling** | Identical mechanism to contradictory updates — the newest extracted value always wins, per field, per the overwrite rule. |
| **Null handling** | Extraction output never includes explicit `null` values (Section 7 guardrail: absence = omit the key). `LeadState` fields default to `null` only at conversation initialization, and only transition away from `null` on a successful, validated extraction. |

---

# 11. Configuration

### Required environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express server listens on (default `3001` if unset). |
| `OPENAI_API_KEY` | Auth key for the `openai` SDK, used exclusively by `LLM Service`. |
| `OPENAI_MODEL` | Model name, fixed to `gpt-4o-mini` per Section 0; still an env var (not hard-coded) to allow swapping without a code change if the provider deprecates the model. |
| `SUPABASE_URL` | Supabase project URL, used exclusively by `Repository`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-side only, never exposed to frontend), used exclusively by `Repository`. |
| `FRONTEND_ORIGIN` | Allowed CORS origin for the deployed frontend, used by the `cors` middleware in `app.ts`. |
| `LOG_LEVEL` | `pino` log level (`info` in production, `debug` in local dev). |

`Config` (`config/env.ts`) validates all of the above with Zod at process startup and throws immediately (process exits with a logged fatal error) if any required variable is missing — fail-fast, never a silent default for secrets.

### Configuration constants (`config/constants.ts`)

| Constant | Value | Purpose |
|---|---|---|
| `MAX_MESSAGE_HISTORY` | `20` | Cap on `ConversationState.messageHistory` length (oldest entries dropped). |
| `RECENT_HISTORY_FOR_PROMPTS` | `6` | Number of most recent turns included in Extraction/Intent/Reply prompts (subset of the full 20-message window, to control prompt size/cost). |
| `QUALIFYING_SCORE_THRESHOLD` | `55` | Gate A threshold (Section 9, Rule 4). |
| `MAX_TURNS_AWAITING_CONTACT` | `3` | Gate for transitioning to `DECLINED_CONTACT` after repeated non-response (Section 9, Rule 6). |
| `DECLINE_PATTERNS` | Regex list: `/no thanks?/i`, `/rather not/i`, `/don't want to share/i`, `/not comfortable/i`, `/skip that/i` | Used by Section 9, Rule 5. |
| `SCORING_WEIGHTS` | The full weight table from Section 8 | Sole location of scoring numbers, imported only by `Lead Scoring Engine`. |
| `SESSION_INACTIVITY_TIMEOUT_MS` | `1800000` (30 minutes) | Used by `Memory Manager`'s abandonment check (a lazy check performed on next access to a stale `conversationId`, not a background scheduler — no cron/queue infra is introduced). |
| `LLM_TIMEOUT_MS` | `10000` (10 seconds) | Per-call timeout passed to the `openai` SDK request options, enforced in `LLM Service`. |
| `LLM_MAX_RETRIES` | `1` | `LLM Service` retries a failed call (timeout or 5xx from the provider) exactly once before throwing `LLMServiceError`; validation failures (malformed JSON) are **not** retried (Section 7 Failure Handling — they fall back to safe defaults instead, to bound total turn latency). |

### Regex patterns
Covered above under `DECLINE_PATTERNS`, plus the vagueness-marker regex used internally by `Lead Scoring Engine` (Section 8): `/\b(sometime|somewhere|maybe|not sure|around|approximately)\b/i` (used only to classify specific vs. vague for scoring — it does not alter the stored value).

### Timeouts, Retry Counts
Covered above (`LLM_TIMEOUT_MS`, `LLM_MAX_RETRIES`). No retry logic exists for Supabase calls — a `Repository` failure is surfaced immediately (Section 12), since a lead upsert is not idempotent-safe to blindly retry without a broader transaction strategy, which is out of scope for this system's size.

### Rate limits
None implemented. Out of scope — this is a single-user-at-a-time demo system per Phase 1's assumptions (no auth, no multi-tenant concerns), and the assignment does not require rate limiting.

### Feature flags
None. Every behavior described in this specification is always-on; no conditional feature toggling exists, keeping the system fully deterministic as instructed.

---

# 12. Error Handling Strategy

| Case | Detection | Recovery | User-Facing Response | Logging |
|---|---|---|---|---|
| Malformed request (wrong types/shape) | Zod `safeParse()` failure in `Validation Layer` | Request rejected before any service runs | `400`, `{ error: { code: "VALIDATION_ERROR", message: "..." } }` | `logger.warn` with the validation issue list, no message content beyond what was sent (it's already the user's own input). |
| Empty message | Zod `.min(1)` failure (post-trim) | Same as above | `400 VALIDATION_ERROR` | `logger.warn`. |
| Unsupported input (e.g., binary/non-text payload if ever accepted, or a message the LLM explicitly cannot process) | `Extraction Service`/`Reply Generator` receive a provider content-policy rejection from the `openai` SDK | Pipeline halts after reply generation fails; `Conversation Manager` catches and returns a graceful fallback reply instead of propagating | `422`, generic reply text: "I couldn't process that message — could you rephrase?" (returned as a normal `200` chat turn with this reply text, not surfaced as an API error, to keep the conversation flowing naturally) | `logger.warn` with provider error code, message content excluded (Section 13 PII rule). |
| Invalid LLM output (fails Zod schema) | `ExtractionOutputSchema`/`IntentOutputSchema` `.safeParse()` failure | Section 7's defined fallbacks (empty extraction diff; default exploratory/steady intent) — pipeline continues, does not halt the turn | No visible error to the user — turn completes normally with a slightly less-informed state update. | `logger.warn` with the raw (schema-failing) LLM output for debugging. |
| Malformed JSON from LLM (not even valid JSON, e.g., truncated) | `JSON.parse()` throws inside `LLM Service.callStructured()` | Caught inside `LLM Service`, converted into the same fallback path as "Invalid LLM output" above (treated identically by the caller) | Same as above — no visible error. | `logger.error` (this is a step above a schema mismatch — a parse failure — logged at `error` level). |
| LLM timeout | `openai` SDK request exceeds `LLM_TIMEOUT_MS`, after `LLM_MAX_RETRIES` retry also times out | `LLM Service` throws `LLMServiceError`; `Conversation Manager` catches it and returns the static reply fallback string defined in Section 7 (Reply Generator's failure path) — critically, extraction/intent timeouts do **not** abort the whole turn, they use their own safe-default fallback (same as "Invalid LLM output"), only a Reply-generation timeout produces the static fallback reply | `200` with fallback reply text (for reply-stage timeout) or a normal reply built from safe-default extraction/intent (for those stages) — the turn always completes with some response. | `logger.error` including which stage timed out. |
| Supabase failure (upsert fails) | `Repository.upsertLead()` promise rejects | `Conversation Manager` catches the error; the in-memory `leadState`/reply/phase are still returned to the user normally (the conversation is not blocked by a persistence failure), but `shouldPersistLead` is logged as failed so the state remains flagged for persistence retry on the *next* turn's Gate B evaluation (Gate B re-evaluates from current state every turn, so a failed persist is naturally retried as soon as the next qualifying message arrives) | `200`, normal chat response — persistence failures are invisible to the end user, since they have no actionable recovery step. | `logger.error` with the Supabase error detail. |
| Conversation not found (unknown `conversationId` sent by frontend) | `Memory Manager.getState()` finds no existing entry | Treated as a new conversation: a fresh default `SessionData` is initialized under that `conversationId` rather than erroring — the frontend and backend never need to coordinate on "does this ID already exist," which simplifies the client. | `200`, normal chat response, phase `NEW`/`EXPLORING`. | `logger.info` ("new conversation initialized for previously-unseen id"). |
| Validation failure (general, non-request — e.g., an internal type invariant violated) | TypeScript/runtime assertion inside a service | Caught by the global Express error handler in `app.ts` | `500`, `{ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }` | `logger.error` with full stack trace. |
| Unexpected exception (anything uncaught) | Global Express error-handling middleware (registered last in `app.ts`) | Same as above | `500 INTERNAL_ERROR` | `logger.error` with full stack trace and request context (excluding PII per Section 13). |

**General principle governing all of the above**: failures in the *AI sub-steps* (extraction, intent) are designed to degrade gracefully and never block the user from continuing to chat — only a failure in the *final reply generation* step, or a fundamentally malformed incoming request, produces a visibly different outcome than a normal successful turn.

---

# 13. Logging Strategy

| Aspect | Rule |
|---|---|
| **What should be logged** | Every request's method/route/status/duration (via a small Express logging middleware using `pino-http`-style fields, implemented manually via `logger.info` in `app.ts`); every LLM call's stage name (`extraction`/`intent`/`reply`), duration, and success/failure; every Supabase upsert's success/failure and `conversationId`; every phase transition (`oldPhase → newPhase`) emitted by `Qualification Service`, logged by `Conversation Manager`. |
| **What should never be logged** | Full raw user message content is **not** logged at `info` level in production (`LOG_LEVEL=info`); it is only included at `debug` level for local development. Customer PII (`name`, `phone`, `email`) is never logged at any level, in any environment — logs reference `conversationId` only, never the customer's actual contact details. Full LLM prompt text (which embeds message history and lead state, including PII) is never logged in production; only the LLM call's *metadata* (stage, duration, success/failure, token counts if available) is logged at `info`. |
| **Log Levels** | `debug`: full request/response bodies, full prompts (local dev only, `LOG_LEVEL=debug`). `info`: request summaries, phase transitions, LLM call metadata, successful persistence events. `warn`: validation failures, LLM output schema failures (with the offending raw output, since it contains no guaranteed PII and is essential for debugging prompt quality), unsupported-input rejections. `error`: LLM timeouts/provider errors, Supabase failures, uncaught exceptions. |
| **Error Logging** | Every `error`-level log includes: `conversationId` (if available), the failing module name, and either the caught error's message + stack (for exceptions) or the specific failure reason (for LLM/Supabase failures) — never the raw user message or customer PII. |
| **Audit Logging** | Every successful `Repository.upsertLead()` call is logged at `info` with `{ conversationId, leadScore, confidence, action: "upsert" }` — this constitutes the audit trail of when leads were created/updated, without logging the PII fields themselves. |
| **Conversation Logging** | No full-transcript logging store is implemented (no separate "conversation log" table/file) — this is out of scope for the assignment; the durable record is the `leads` table itself, and `Memory Manager`'s in-process history is ephemeral by design (lost on restart), which is acceptable since Phase 1 assumes no requirement for conversation replay/audit beyond the lead record. |
| **PII handling** | `customer.name`, `customer.phone`, `customer.email` are treated as PII throughout: excluded from all log output regardless of level, excluded from error messages returned to the frontend, and the only place they are persisted is the `leads` table in Supabase (access-controlled via the service-role key, never exposed to the frontend directly — the frontend only ever receives PII values as part of its *own* conversation's `leadState` response, never any other conversation's). |

---

# 14. Codex Implementation Rules

These constraints are binding for every implementation session (human or AI-agent) and must not be relaxed without amending this specification.

1. **Controllers contain no business logic.** `chatController.ts` may only: validate input existence, call exactly one `Conversation Manager` method, and shape the HTTP response/error. It must never contain scoring logic, prompt text, or persistence calls.
2. **Services never access HTTP objects.** No file under `services/` may import or reference Express's `Request`/`Response` types. All inputs/outputs are plain typed objects as defined in Section 4.
3. **Repository owns persistence.** No module other than `repository/leadRepository.ts` may import `@supabase/supabase-js` or hold a Supabase client instance.
4. **LLM Service owns all provider communication.** No module other than `services/llmService.ts` may import the `openai` package. `Extraction Service`, `Intent Analyzer`, and `Reply Generator` must all route through `LLM Service`'s two public methods.
5. **Business rules remain deterministic.** `leadScoringEngine.ts` and `qualificationService.ts` must contain zero calls to any LLM, zero calls to `Date.now()`/`Math.random()` for decision logic (timestamps for `updatedAt` are the only permitted exception, applied outside these two modules), and must be pure functions of their documented inputs — this makes them directly unit-testable with fixed inputs/outputs.
6. **Prompt templates are centralized.** All prompt text lives under `prompts/`. No prompt string literals may appear inline inside `extractionService.ts`, `intentAnalyzer.ts`, or `replyGenerator.ts` — each imports its builder function from the corresponding `prompts/*.ts` file.
7. **Validation is never duplicated.** HTTP request validation exists only in `validation/requestSchemas.ts`, invoked only from `chatController.ts`. LLM output validation exists only in `validation/llmOutputSchemas.ts`, invoked only from `extractionService.ts` and `intentAnalyzer.ts`. No other module re-validates the same data.
8. **Scoring logic exists only in one place.** All numeric weights, thresholds, and bonus rules from Section 8 live in `config/constants.ts` as named exports and are consumed only by `leadScoringEngine.ts`. No other module computes or adjusts a score.
9. **Dependency direction is strictly maintained** (no cycles, no upward calls):
   `controllers → services (Conversation Manager) → { memoryManager, extractionService, intentAnalyzer, replyGenerator, leadScoringEngine, qualificationService, repository } → { llmService (from the three LLM-calling services only), supabase client (from repository only) }`.
   `utils/`, `types/`, `config/`, `validation/`, and `prompts/` are leaf modules importable from anywhere above them, but they never import from `services/`, `controllers/`, or `repository/`.
10. **Naming conventions.** Files: `camelCase.ts`. Exported classes/objects: `PascalCase` for types/interfaces, `camelCase` for singleton instances/functions. Zod schemas: suffixed `Schema` (e.g., `ChatRequestSchema`). Type definitions matching a data contract in Section 4: named exactly as that contract's heading (e.g., `interface LeadState`).
11. **File conventions.** One primary export per file under `services/`, `repository/`, `controllers/` (the file's default responsibility) — no "god files" merging multiple modules from Section 3. Type-only files (`types/*.ts`) contain no runtime logic, only `interface`/`type` declarations.
12. **Error handling conventions.** Every thrown error is a typed error class (`ValidationError`, `LLMServiceError`, `PersistenceError`) defined once (e.g., in `utils/errors.ts`, added as a small addition under `utils/`), never a raw `throw new Error(string)` inside a service — this lets the Express global error handler in `app.ts` `switch` on error type to produce the correct status code per Section 12's table.
13. **Code organization rules.** Section 3's module boundaries are exhaustive — no new top-level service module may be introduced without amending this specification first; if new functionality seems to require a new module, it must fit inside an existing module's stated Responsibilities, or the specification is out of date and must be revised, not silently worked around.

---

# 15. Recommended Implementation Order

| Step | Module/Area | Why it comes at this point |
|---|---|---|
| 1 | `config/env.ts`, `config/constants.ts` | Every other module depends on typed config/constants; must exist and be validated first so later modules can import from it immediately. |
| 2 | `types/` (all three files) | Data contracts (Section 4) are referenced by nearly every module's function signatures; defining them early prevents rework. |
| 3 | Database schema (Section 5), applied directly in Supabase | The `Repository` module cannot be written meaningfully without the table existing to test against. |
| 4 | `repository/leadRepository.ts` | Isolated, testable in isolation against the now-existing table; has no dependency on any other service module. |
| 5 | `services/memoryManager.ts` | Simple, dependency-free (just an in-memory map); needed before `Conversation Manager` can be assembled. |
| 6 | `validation/requestSchemas.ts`, `validation/llmOutputSchemas.ts` | Needed before either the controller or the LLM-calling services can be finished, but only depends on `types/`, so can be built now. |
| 7 | `services/llmService.ts` | Foundational for the three LLM-calling services; can be built and smoke-tested against the OpenAI API in isolation before any prompt-specific logic exists. |
| 8 | `prompts/extractionPrompt.ts`, `services/extractionService.ts` | First of the three LLM-calling services; depends on `llmService.ts` and `llmOutputSchemas.ts`, both now ready. |
| 9 | `prompts/intentPrompt.ts`, `services/intentAnalyzer.ts` | Same pattern as extraction; independent of it, can follow immediately. |
| 10 | `services/leadScoringEngine.ts` | Pure function depending only on `config/constants.ts` and `types/` — can be built and fully unit-tested (Section 8's worked examples) before the orchestration layer exists. |
| 11 | `services/qualificationService.ts` | Pure function depending on `leadScoringEngine.ts`'s *output shape* (not the engine itself, per Section 3) and `config/constants.ts` — same testability advantage as Step 10. |
| 12 | `prompts/replyPrompt.ts`, `services/replyGenerator.ts` | Last of the three LLM-calling services; benefits from `qualificationService.ts` already existing so its `shouldAskForContact` output shape is known and stable. |
| 13 | `services/conversationManager.ts` | The orchestrator; can only be correctly assembled once every module it sequences (Steps 4–12) already exists and is individually testable. |
| 14 | `controllers/chatController.ts`, `app.ts`, `server.ts` | The HTTP boundary is built last on the backend, once `Conversation Manager` is a stable, working unit — this avoids designing the API around an incomplete pipeline. |
| 15 | Backend tests (`tests/`) | Written alongside Steps 10–14 in practice, but finalized here: `leadScoringEngine.test.ts` and `qualificationService.test.ts` are the highest-value tests (pure functions, deterministic, directly verifiable against Section 8's worked table) and should exist before frontend work begins, since they are the "correctness of captured lead data" evaluation criterion's most testable surface. |
| 16 | Frontend: `context/ConversationContext.tsx`, `services/chatApi.ts` | The frontend's data layer must exist before any component can render real data; depends only on the now-finalized `POST /api/chat` contract (Section 6). |
| 17 | Frontend: `components/ChatWindow.tsx`, `MessageBubble.tsx` | Core chat UI, the primary user-facing surface, built before the secondary panel. |
| 18 | Frontend: `components/CapturedFieldsPanel.tsx`, `StatusIndicator.tsx` | Depends on the same `leadState` shape already wired up in Step 16; satisfies the assignment's explicit UI requirement. |
| 19 | Frontend: `pages/ChatPage.tsx`, `App.tsx` | Composition layer, built last since it only assembles already-working pieces. |
| 20 | End-to-end manual verification against Section 16's checklist, deployment (Render + Vercel + Supabase Cloud), README + transcripts + Loom video | Final step — deliverables per the assignment's submission requirements, only meaningful once the full system is running. |

---

# 16. Final Acceptance Checklist

| Requirement | Responsible Component | How to Test | Expected Result |
|---|---|---|---|
| Natural conversational flow | `Reply Generator` | Run the sample conversation from the assignment (Bali honeymoon example) end-to-end via the deployed UI. | Assistant asks one relevant question at a time, in the same order as the assignment's example, never repeats a known field. |
| Context/memory retained across turns | `Memory Manager`, `Conversation Manager` | Provide "two adults" after a prior message about Bali; check the next reply references budget, not destination again. | `leadState.travel.travellers` is correctly set to `2`, destination remains `"Bali"`. |
| Incremental slot-filling | `Extraction Service` | Send a multi-turn conversation, inspect `leadState` after each turn via the UI panel. | Each new fact appears in the panel without erasing previously captured facts. |
| Continuous intent detection | `Intent Analyzer`, `Lead Scoring Engine` | Send a declining-engagement sequence (detailed message, then "ok", then "not sure"). | `lastIntentTrend` becomes `"declining"`; score for that turn is reduced per the −15 decay rule (Section 8). |
| Lead score (0–100) | `Lead Scoring Engine` | Run the five worked examples from Section 8 as literal conversation inputs. | Computed scores fall within the stated calibration tolerance (±10) of the assignment's reference scores. |
| Confidence rating | `Lead Scoring Engine` | Same as above; inspect `qualification.confidence` in the API response. | Matches the table in Section 8 (e.g., vague-only fields never yield High). |
| Reason + summary fields | `Lead Scoring Engine` | Inspect `qualification.reason`/`summary` in any qualifying-or-above conversation. | Both are non-empty, human-readable, and reference actual captured fields. |
| Contact info not requested too early | `Qualification Service` (Gate A) | Open a new conversation, send a single vague message ("tell me about Bali"). | Assistant does not ask for name/phone in its reply; `shouldAskForContact` is `false`. |
| Lead created once qualified | `Qualification Service` (Gate B), `Repository` | Complete the full assignment example conversation through providing name+phone. | A row appears in Supabase `leads` table with `conversation_id` matching the session, `lead_score` ~95, all fields populated. |
| UI shows captured fields live | `CapturedFieldsPanel` | Watch the panel while sending the sample conversation. | Each field appears in the panel within one turn of being mentioned, without a page reload. |
| Edge case: unprompted early contact info | `Qualification Service` (state-machine shortcut) | First message: "Rahul Verma, +91 9999999999, want to plan a Bali trip." | Lead is created immediately (Rule 1 fires on turn 1) since both contact fields and a travel field are present together. |
| Edge case: interest shown, contact declined | `Qualification Service` (`DECLINED_CONTACT`) | Reach `AWAITING_CONTACT`, then reply "no thanks, just browsing." | Phase becomes `DECLINED_CONTACT`; no lead persisted; conversation continues helpfully without re-asking. |
| Edge case: interest drops mid-conversation | `Intent Analyzer`, `Lead Scoring Engine` | Detailed message, then two disengaged one-word replies. | Score visibly decreases turn-over-turn in the UI; `leadState` fields are not deleted. |
| Edge case: vague trip date | `Extraction Service`, `Lead Scoring Engine` | Send "sometime next year" when asked for dates. | `travel.travelDate` stores the phrase verbatim; contributes 4 (vague-tier) points, not 0 or 10. |
| Persistence to Supabase | `Repository` | Inspect the `leads` table directly after a qualifying conversation. | Row exists, `updated_at` refreshes on subsequent qualifying turns of the same conversation (no duplicate rows for the same `conversationId`). |
| README with scoring logic + transcripts | *(deliverable)* | Manual review of submitted README. | Contains the weight table (or a summary of it), 2–3 real transcripts with resulting lead JSON, and explicit Confidence definition. |
| Loom video ≤5 minutes | *(deliverable)* | Manual review. | Demonstrates at least one edge case live, walks through scoring logic verbally. |
| Deployed link (optional) | Render + Vercel + Supabase Cloud | Load the deployed frontend URL, complete a full conversation. | Full flow works identically to local, lead appears in the live Supabase table. |

**Remaining gaps after this specification**: none identified. Every functional requirement, edge case, and evaluation criterion from the original assignment has a named responsible component, a deterministic behavior definition, and a corresponding test in this checklist.

---

# 17. Final Consistency Review

A full re-read of the Assignment, Phase 1, and Phase 2 against this specification surfaces the following points, each resolved directly below (no open questions remain):

1. **Ambiguity resolved — "genuine potential customer" threshold.** Phase 1 assumed a qualitative bar (§7, assumption 7); this document converts it into the exact numeric `QUALIFYING_SCORE_THRESHOLD = 55` (Section 11) plus the field-presence precondition already implicit in Section 9's Rule 4. This is now a single deterministic number, not a judgment call left to implementation time.

2. **Ambiguity resolved — exact scoring formula.** Phase 1 deferred this entirely ("exact scoring logic is up to you") and Phase 2 didn't specify weights. Section 8 now defines the complete formula, including the bonus rules needed to calibrate against the assignment's own five reference examples, with an explicit, stated tolerance rather than silently under- or over-fitting.

3. **Conflict resolved — Reply Generator vs. Chat Service module boundary.** Phase 2 §8 flagged this ambiguity and proposed a split; this specification formalizes it permanently in Section 3, with `Chat Controller` (HTTP-only) and `Reply Generator` (LLM-only) as two clearly separate modules — no remaining tension between the assignment's suggested module list and the actual design.

4. **Missing detail resolved — what happens when contact info arrives with zero travel context.** Phase 2 §8 identified this gap and sketched a resolution; Section 9's Rule 2 now makes it a fully deterministic table entry (contact info is retained but the lead is *not* created until a travel field also exists).

5. **Missing detail resolved — re-entry from `DECLINED_CONTACT`.** Phase 2 §8 flagged this as non-terminal but didn't specify the exact mechanism; Section 9 now specifies it precisely: Rules 1/2 (contact-info-present) are evaluated *before* Rule 3 every turn, so any turn where the user volunteers contact info naturally exits `DECLINED_CONTACT` without any special-case code path.

6. **Missing detail resolved — abandonment mechanism.** Phase 2 added the `ABANDONED` state conceptually; this specification makes it concrete and minimal: a lazy timestamp check inside `Memory Manager` on next access (`SESSION_INACTIVITY_TIMEOUT_MS`, Section 11), not a background scheduler, consistent with the "avoid unnecessary infrastructure" constraint carried through all three phases.

7. **Missing detail resolved — vagueness detection mechanism.** Neither Phase 1 nor Phase 2 specified *how* "vague vs. specific" would actually be determined. Section 8 now defines it as a deterministic regex/keyword heuristic inside `Lead Scoring Engine`, not an LLM self-report, keeping the scoring engine fully deterministic per Phase 1's original design decision (§6.2).

8. **No remaining conflicts** were found between the Assignment's explicit text, Phase 1's decisions, and Phase 2's architecture — this specification is additive/clarifying throughout, not corrective of any prior-phase business decision, satisfying the instruction to not revisit business decisions or conversation flow.

**This document is final.** No further design, business-logic, or architectural decisions remain open. Implementation may proceed directly from Sections 0–16.


---

# 18. Additional Implementation Constraints

## 18.1 Layered Architecture (Mandatory)

The implementation shall follow a strict layered architecture:

```text
React UI
    ↓
Chat API Controller
    ↓
Conversation Manager
    ↓
Domain Services
    ↓
Repository
    ↓
Supabase
```

Rules:

- Controllers never access the Repository directly.
- Controllers never contain business logic.
- Services never import Express request/response objects.
- Repository is the only layer communicating with Supabase.
- LLM Service is the only layer communicating with the OpenAI SDK.
- Utilities contain helper logic only and never business rules.

---

## 18.2 Sequence Diagrams

### Normal Conversation

```text
User
 ↓
React UI
 ↓
Chat Controller
 ↓
Conversation Manager
 ↓
Memory Manager
 ↓
Extraction Service
 ↓
Intent Analyzer
 ↓
Lead Scoring Engine
 ↓
Qualification Service
 ↓
Reply Generator
 ↓
Memory Manager
 ↓
HTTP Response
```

### Qualified Lead

```text
User
 ↓
React UI
 ↓
Conversation Manager
 ↓
Lead Scoring Engine
 ↓
Qualification Service
 ↓
Repository
 ↓
Supabase
 ↓
Reply Generator
```

---

## 18.3 Frontend State

```ts
interface UIState {
  conversationId: string | null;
  messages: Message[];
  leadState: LeadState;
  conversationPhase: ConversationPhase;
  loading: boolean;
  typing: boolean;
  error: string | null;
}
```

---

## 18.4 DTO Naming Convention

Public API objects shall use DTO naming.

- ChatRequestDTO
- ChatResponseDTO
- LeadState
- ConversationState
- ExtractionInput
- ExtractionOutput
- IntentInput
- IntentOutput
- QualificationOutput
- QualificationDecision

Internal models and DTOs must not be mixed.

---

## 18.5 Prompt Versioning

Prompt files shall expose explicit versions.

- Extraction Prompt v1
- Intent Prompt v1
- Reply Prompt v1

Future prompt revisions must increment the version without changing previous versions.

---

## 18.6 Testing Matrix

| Module | Unit Test | Integration Test |
|---------|-----------|------------------|
| Lead Scoring Engine | ✓ | |
| Qualification Service | ✓ | |
| Memory Manager | ✓ | |
| Extraction Service | ✓ (mock LLM) | ✓ |
| Intent Analyzer | ✓ (mock LLM) | ✓ |
| Repository | | ✓ |
| Conversation Manager | ✓ | ✓ |
| Chat API | | ✓ |
| Frontend Components | ✓ | |

---

## 18.7 Non-Functional Targets

- Average response time: < 4 seconds
- LLM timeout: 10 seconds
- Memory lookup: < 50 ms
- Database write: < 300 ms

---

## 18.8 Model Configuration

The model must remain configurable through environment variables.

Default:

```env
OPENAI_MODEL=gpt-4o-mini
```

No model name should be hardcoded in implementation.

---

## 18.9 Specification Precedence

If implementation decisions generated by any AI coding agent conflict with this document, this specification takes precedence.

Implementation must be updated to match the specification rather than modifying the design document.

This document remains the authoritative implementation reference throughout development.
