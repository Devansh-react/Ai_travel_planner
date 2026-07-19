# AI-Powered Travel Lead Assistant — Design Analysis

*(Pre-architecture phase: problem understanding, requirements, hidden expectations, technical challenges, and key design decisions)*

---

## 1. Problem Understanding

### The business problem, in plain terms
A travel company receives a large volume of inbound enquiries — through a website chat widget, presumably. Most of these are low-value browsing questions ("tell me about Bali"), and only a fraction represent people who are actually ready to book a trip. Today, a human sales team either has to triage every conversation manually (expensive, slow, inconsistent) or risks missing genuine buyers in the noise.

The company wants an AI chat assistant that does two jobs at once:
1. **Acts as a helpful travel conversational agent** — answers questions, asks relevant follow-ups, feels natural.
2. **Acts as a silent sales analyst running in the background** — continuously judges how "hot" the conversation is, extracts structured travel requirements as they emerge, and — once the visitor looks like a real prospect — asks for contact details and hands off a clean, scored lead record to the sales team.

### What the company is actually evaluating
This is explicitly framed as an "AI Engineer" take-home, and the instructions repeatedly emphasize that **lead detection and qualification logic is the core of the assignment** ("This is the core of the assignment," "the main part of the assignment we want to see your thinking on"). So the company is not primarily testing whether the candidate can build a chat UI — that's table stakes. They are testing:

- Whether the candidate can turn a fuzzy, subjective judgment ("is this person a genuine buyer?") into a **repeatable, explainable system** rather than just asking an LLM "give me a score" and hoping for consistency.
- Whether the candidate thinks about **conversation design** — not asking for a phone number too early, handling reluctant users, handling vague answers — the kind of judgment a real product/UX-aware engineer applies, not just a model-caller.
- Whether the candidate can **structure state** (partial lead data accumulating over multiple turns) cleanly, since a chat is stateful and lead data must survive across turns, not be re-derived per message.
- Whether the candidate can communicate their reasoning clearly in a README, since "exact scoring logic is up to you" — the grading is on the *justification* as much as the output.
- General engineering hygiene: working code, sensible stack usage, a deployable/runnable artifact, and a short video walkthrough (communication skill, not just code).

### Primary objective
Build a conversational assistant that reliably distinguishes casual browsers from genuine prospects, and — once a threshold of intent + information is reached — produces a complete, structured, scored lead record with contact details, stored for a human consultant to follow up on.

### Secondary objectives
- Natural, non-pushy conversation flow (don't interrogate the user for a form).
- Transparent, explainable qualification logic (score + reason + confidence), not a black box.
- Graceful handling of the edge cases the assignment explicitly calls out (early unsolicited contact info, interest without consent to share contact info, cooling interest, vague dates).
- A UI that gives at-a-glance visibility into what's been captured so far, without reading the transcript.
- Clear documentation of assumptions and reasoning (the assignment explicitly rewards this: "We care more about how you handle unclear situations than about getting every detail perfect").

---

## 2. Functional Requirements

### Core Requirements
1. Conversational chat interface where a user can describe their travel plans in natural language.
2. The assistant must maintain **context/memory** across the conversation (a later answer like "two adults" must be understood as answering an earlier question about traveller count).
3. **Incremental slot-filling**: extract and accumulate structured travel details as they're mentioned, across multiple turns — not just from a single message.
4. **Continuous intent/buying-signal detection**: on an ongoing basis (not just once), judge how likely the user is to be a genuine prospect.
5. **Lead scoring**: produce a numeric score from 0–100 reflecting lead value/intent.
6. **Confidence rating**: Low / Medium / High, alongside the score.
7. **Qualification reasoning**: a human-readable reason explaining why the score was assigned.
8. **Requirement summary**: a natural-language summary of what the customer wants.
9. **Deferred contact capture**: the assistant must NOT ask for name/phone early; it should first understand travel needs, and only request contact details once the user shows genuine intent.
10. **Lead creation trigger**: once sufficient information (including name + phone) is present, the assistant must create, score, and persist a lead record.
11. **Persistence**: store the lead (Supabase or MongoDB) in a structured schema covering Customer, Travel, and AI Qualification fields as specified.
12. **UI panel**: a visible, live-updating panel/card showing which fields have been captured so far for the current conversation (destination, dates, travellers, budget, name, phone, etc.).
13. Handle the four explicitly named edge cases:
    - User volunteers contact info unprompted, very early.
    - User shows interest but refuses to share contact details.
    - User's interest appears to drop mid-conversation.
    - Vague/incomplete detail values (e.g., "sometime next year").

### Supporting Requirements
14. A backend (Node.js) that orchestrates calls to an LLM provider and mediates between frontend, AI, and storage.
15. A frontend (React) that renders the chat and the live-captured-fields panel.
16. Integration with a chosen LLM API (candidate's choice of provider) using the candidate's own key.
17. A conversation/session identifier (`conversationId`) that ties a lead back to its originating chat.
18. README documenting the approach, especially the lead-scoring logic, including how "Confidence" is defined and how it relates to score.
19. 2–3 sample conversation transcripts with their resulting lead JSON, included in the README.
20. A short (≤5 min) Loom video walking through logic and a live demo.

### Optional Requirements
21. Deployed, publicly accessible link to the running app.
22. Use of an AI orchestration framework (LangChain or similar) — explicitly stated as not required.

---

## 3. Non-Functional Requirements

- **Conversation quality / naturalness** — explicitly an evaluation criterion. The assistant must not feel like a form filled one field at a time; questions should feel like a helpful travel agent's, not a bot's.
- **Response quality / correctness of extraction** — the "Correctness of captured lead data" is a named evaluation criterion, meaning extraction must be accurate and not hallucinate values the user never stated.
- **Explainability** — score and confidence must be accompanied by a stated reason; scoring can't be an opaque number.
- **Consistency / determinism (as much as possible)** — the same kind of conversation should roughly map to a similar score band across runs; wildly inconsistent scoring would undermine trust in the "AI Qualification" fields.
- **Maintainability / code quality** — explicitly an evaluation criterion; implies reasonably separated concerns (chat logic vs. extraction logic vs. scoring logic vs. persistence), not a monolithic prompt-and-pray script.
- **Simplicity / appropriate scope** — a take-home, time-boxed assignment; over-engineering (multi-agent orchestration, event buses, etc.) would work against the "practical" spirit of the brief, even though not explicitly penalized.
- **Reliability under ordinary use** — the demo/video and transcripts need to reliably reproduce the intended behavior; flaky extraction or scoring would look bad in a recorded demo.
- **Extensibility (implicit, moderate priority)** — new travel fields, new scoring signals, or a different LLM provider should be addable without a rewrite, since real-world CRMs evolve, but this is secondary to just making the take-home work well.
- **Latency (implicit, light)** — chat should feel responsive enough for a live demo video; not a hard real-time constraint, but a multi-second hang per message would hurt the "naturalness" evaluation.
- **Data integrity of stored leads** — since the record is meant for a human consultant to act on, stored leads need consistent structure (matching the specified schema) even when some fields are null/unknown.

---

## 4. Hidden Expectations

These aren't stated outright, but the assignment's own example JSON, evaluation criteria, and edge cases strongly imply them.

1. **Conversation state management.** The example shows details accumulating turn-by-turn ("Bali" → "two adults" → "Rs 2 lakh" → contact info) and the UI requirement asks to show "fields captured so far" — this is impossible without a session-scoped state object that persists and merges new information across turns. This is expected even though the word "state" never appears.

2. **Separation of "conversational" logic from "extraction/scoring" logic.** If a single prompt tried to both chat naturally *and* silently emit a lead score every turn, replies would likely leak scoring artifacts into the chat, or scoring would be inconsistent with what was actually said. The clean way to satisfy "natural conversation" + "correct lead data" + "explainable score" simultaneously is to treat these as related but distinct responsibilities. This is implied by the fact that three separate evaluation criteria (naturalness, correctness of data, quality of intent detection) are listed as if they could vary independently.

3. **Deterministic or semi-deterministic scoring rather than "ask the LLM for a score and trust it blindly."** The assignment gives concrete expected scores for example conversations (10, 25, 60, 80, 95) as a calibration reference, and asks candidates to "explain your approach clearly, including how you define Confidence and how it relates to the Lead Score." That level of specificity signals they want a *reasoned, reproducible methodology* (even if LLM-assisted), not "the model just says 73." A pure black-box LLM score would be hard to justify against their reference numbers.

4. **Idempotent / controlled lead creation.** Because the lead-creation trigger is a judgment call ("once you have enough information... the assistant should create a lead"), there's an implicit expectation that leads aren't created multiple times for the same evolving conversation, or spammed on every turn once qualified — i.e., a single lead per conversation that gets created (or updated) at the right moment, not duplicated.

5. **Graceful degradation / null-safety in the schema.** The sample JSON shows fields like `departureCity: null` — this signals the schema is expected to tolerate partial information rather than requiring every field to be present before anything is stored.

6. **Explainability as a first-class output, not an afterthought.** `reason` and `summary` are treated as required output fields alongside the numeric score — this is effectively asking for interpretable AI, which is a step beyond just "classify intent."

7. **Production-lean (not production-grade) code quality.** "Code quality" is graded, but this is a time-boxed take-home with no mention of tests, CI, auth, or infra — the hidden expectation is *clean, readable, sensibly organized* code appropriate to the scope, not enterprise-grade hardening.

8. **Respect for user consent around contact info.** The edge case "a user who shows interest but declines to give contact details" implies the system must handle a *no* gracefully — continue being useful without contact info, rather than repeatedly pressuring the user, since that would fail both "naturalness" and basic UX judgment (even though it isn't stated as a hard requirement).

9. **A single conversation → single evolving lead object**, not disconnected extraction snapshots per message — implied by the `conversationId` field and by the UI requirement to see the *current* state of captured fields (singular, not a list of historical states).

---

## 5. Major Technical Challenges

1. **Intent detection over a moving target.** Buying intent isn't a single classifiable utterance — it's a trend across a conversation (interest can build, or it can *decline*, per the explicit edge case). This requires either re-evaluating a running signal each turn, or maintaining some notion of "intent trajectory," which is harder than one-shot text classification.

2. **Incremental, cumulative information extraction.** Each user message may contain zero, one, or several relevant facts, and later messages may *update* earlier ones (e.g., user first says "December," then later says "actually, maybe January"). The system must merge new extracted facts into existing state without overwriting correct data with hallucinated or misread values, and without losing previously captured facts when a new message doesn't mention them.

3. **Distinguishing "vague but real" from "missing."** "Sometime next year" is a real answer, not an empty field — the system has to decide whether to store it as-is (a soft/fuzzy value), silently normalize it, or treat it as a prompt to gently ask for more precision, without becoming annoying or repeatedly re-asking.

4. **Calibrating a numeric score against qualitative signals.** Turning "destination + trip type + traveller count + budget + contact info all present" into a specific number like 95 — and doing so *consistently* across different conversations — requires a defensible scoring model. Pure LLM judgment tends to be noisy turn-to-turn; a pure hand-coded rule engine can miss nuance (e.g., urgency language, explicit dates vs. vague ones). Balancing these is the crux of the assignment.

5. **Deciding the right moment to ask for contact details.** Ask too early and it feels like a form/spam bot (explicitly penalized by "do not ask for contact details too early"); ask too late and a hot lead may leave without being captured. This is a conversation-policy problem, not just an extraction problem — it requires some kind of readiness/threshold gate tied to the intent signal.

6. **Context retention vs. prompt cost/complexity.** As the conversation grows, the model needs enough history to stay coherent, but naively resending the entire transcript each turn (plus asking the same call to also do extraction and scoring) risks slow, expensive, and error-prone responses. Structuring what context is passed to the LLM per turn, and for which sub-task, is a real design problem.

7. **Separating "what the user said" from "what we infer."** E.g., inferring `tripType: "Honeymoon"` from "planning a honeymoon in Bali" is easy, but the system must avoid inventing values that weren't stated or reasonably implied (over-eager hallucination would directly hurt "correctness of captured lead data").

8. **Handling contradiction and correction gracefully.** If a user changes their mind ("actually, budget is now 1.5 lakh"), extraction has to overwrite the old value convincingly rather than appending duplicate/conflicting entries.

9. **Triggering lead persistence exactly once, at the right time**, without re-triggering on every subsequent turn of an already-qualified, ongoing conversation, and without missing the moment when it *should* fire (e.g., contact info arrives unprompted very early, per the edge case).

---

## 6. Major Design Decisions

### 6.1 Single AI orchestrator vs. multi-agent
**Options:**
- (a) One LLM call per turn that both converses *and* returns structured extraction/score as part of one structured response.
- (b) Multiple specialized calls per turn (e.g., one for the conversational reply, one for extraction, one for scoring) — a light "multi-agent" flavor without full agent frameworks.
- (c) A true multi-agent framework (LangChain agents, planner/executor, tool-calling loops).

**Recommendation:** (b) — a small number of purpose-specific LLM calls (or a single call with a well-structured JSON output containing both the reply *and* the extracted/updated fields, with scoring computed separately in code from those fields) orchestrated by plain application logic, not a "multi-agent" framework.

**Justification:** Full multi-agent orchestration (c) is overkill for a single-user chat flow and directly contradicts the assignment's own "avoid overengineering" spirit (LangChain is explicitly called out as optional, not expected). A single call doing everything (a) risks conflating "sound natural" with "extract precisely" — the same generation that produces a warm reply is also being asked to emit clean structured data, which tends to degrade either the tone or the data quality. Splitting reply-generation from extraction (or at least clearly separating extraction as a structured-output step from the free-text reply) keeps each sub-task simple, testable, and debuggable, while remaining simple to build in a take-home timeframe.

### 6.2 Rule-based scoring vs. LLM-generated scoring
**Options:**
- (a) Pure LLM-generated score ("just ask the model for 0–100").
- (b) Pure rule-based score (fixed points per field present: destination +X, dates +Y, budget +Z, contact info +N, etc.).
- (c) Hybrid: LLM performs extraction + a light qualitative "intent" judgment (e.g., is this specific/urgent vs. vague/exploratory), and a deterministic rule/weight function converts the *extracted structured facts + intent judgment* into the final score.

**Recommendation:** (c), hybrid, weighted toward deterministic rules with a small LLM-derived intent modifier.

**Justification:** The assignment gives concrete example scores that increase predictably as concrete facts (destination, trip type, budget, traveller count, contact) accumulate — this pattern is naturally suited to a transparent, additive rule model, which also directly satisfies the "explainability"/hidden-expectation concern (a reason can be generated by pointing at which rules fired). A pure LLM score would be hard to reproduce or justify against the reference numbers and would drift between runs. A pure rule-based model, though, can't capture qualitative intent signals like urgency or specificity ("tell me about Bali" vs. "planning a honeymoon in Bali" both mention only a destination, yet the assignment scores them very differently: 10 vs. 60) — so a small LLM-derived "intent strength" signal is needed on top of field-presence rules to explain that gap. This hybrid is practical, explainable, and matches the assignment's own worked examples.

### 6.3 Database choice: Supabase vs. MongoDB
**Options:** Supabase (Postgres, relational) or MongoDB (document store) — assignment allows either.

**Recommendation:** Supabase (Postgres).

**Justification:** The lead schema, while nested, is fixed and well-specified in the assignment (Customer / Travel / AI Qualification), which suits a relational or even a simple JSON-in-Postgres model well; Supabase additionally gives an instant hosted Postgres + auto-generated REST layer + free tier, which reduces setup time in a time-boxed take-home. That said, MongoDB is an equally valid, arguably even simpler choice for this specific nested-document shape (the sample output is literally a JSON document), so this is a low-stakes decision either way — the recommendation favors Supabase mainly for speed of provisioning and the "supporting requirement" of keeping infra minimal, but MongoDB remains a fully reasonable alternative to note in the README as a considered option.

### 6.4 Memory strategy
**Options:**
- (a) Re-send the full raw transcript to the LLM every turn.
- (b) Maintain a structured "lead state" object server-side (the accumulated extracted fields) plus a bounded recent-message window for conversational flow, rather than relying on the LLM to re-derive everything from full history each time.
- (c) Vector-store/embeddings-based retrieval memory.

**Recommendation:** (b).

**Justification:** The conversations in scope are short, linear, single-session sales chats — not long-running or knowledge-base-style interactions — so embedding-based retrieval (c) is unnecessary complexity. Relying purely on raw transcript replay (a) works but conflates "remembering the conversation" with "remembering the extracted facts," and re-derives structured state from scratch every turn, which is wasteful and can produce inconsistent extraction between turns. Explicitly maintaining a structured, incrementally-updated state object is both simpler to reason about and is exactly what the UI requirement (show captured fields at a glance) needs to render directly, without re-summarizing history on each render.

### 6.5 Prompt strategy
**Options:**
- (a) One large prompt per turn instructing the model to reply, extract, and score all at once, free-text.
- (b) One prompt for the natural-language reply; a separate, tightly-scoped structured-output prompt (JSON schema) for extraction; scoring computed in code from the extracted state.
- (c) Fully dynamic prompt construction driven by a planning/agent loop.

**Recommendation:** (b).

**Justification:** This mirrors the 6.1 decision and is chosen for the same reasons: cleanly separating the "sound human" task from the "produce clean structured data" task tends to improve both, is easy to unit-test independently (feed a fixed transcript, assert on the JSON extracted), and avoids the fragility of parsing structured data out of a conversational free-text reply. It's also the simplest strategy that still satisfies every functional requirement, in keeping with the "avoid overengineering" guidance.

### 6.6 Conversation lifecycle
**Options:**
- (a) Lead record only ever created once, at the qualifying moment, and left static afterward.
- (b) Lead record created once qualification threshold is hit, then upserted/updated as the conversation continues (e.g., user adds more detail after providing contact info).
- (c) A new lead record on every qualifying message (append-only log of snapshots).

**Recommendation:** (b).

**Justification:** (c) would create duplicate/noisy lead records for what a human consultant would rightly see as *one* prospect (undermining "correctness of captured lead data" and violating the implicit "single lead per conversation" expectation from the `conversationId`-keyed schema). (a) is close to right but too rigid — real conversations keep going after contact is shared (e.g., the user adds "actually we'd also want 3 days in Ubud"), and a static snapshot would go stale. Upserting the same lead record keyed by `conversationId` as the conversation evolves keeps exactly one accurate, current lead per conversation, which is both simpler for the sales team and simpler to implement.

### 6.7 Lead creation trigger (readiness gate)
**Options:**
- (a) A fixed rule: create as soon as name + phone are present, regardless of anything else.
- (b) A readiness gate: contact details are requested only after intent/completeness crosses a threshold, and the lead is created once contact details are captured (matching the explicit instruction: "ask for name and phone only once the user seems like a genuine potential customer... once you have enough information, including a name and phone").
- (c) Always ask for contact details immediately at the start of the chat.

**Recommendation:** (b).

**Justification:** This is directly and explicitly specified by the assignment ("Do not ask for contact details too early... only once the user seems like a genuine potential customer"), so (c) is a direct violation and (a) skips the "genuine potential customer" judgment the assignment asks for. The trigger logic therefore needs two gates: (1) an intent/completeness threshold that decides *when to ask* for contact info at all, and (2) the arrival of contact info as the final trigger that *creates/finalizes* the lead — while still handling the "unprompted, very early" edge case as a shortcut path that skips gate (1) if the user volunteers contact info before being asked.

---

## 7. Assumptions

Because the assignment intentionally leaves several details open ("How you detect intent, structure the conversation, and decide when a lead is ready to store is entirely up to you"), the following assumptions would need to be made explicit in the README:

1. The assistant serves one user per conversation session (no multi-user concurrent chat merging).
2. A "lead" maps 1:1 to a `conversationId`; re-opening or continuing the same session updates the same lead rather than creating a new one.
3. If a user never provides contact details, no lead record is created — the conversation still proceeds normally and only the live UI panel reflects captured (non-contact) fields, but nothing persists to the database, since the schema requires phone as part of "Customer."
4. Email is genuinely optional and never blocks lead creation.
5. Vague values (e.g., "sometime next year") are stored as-is as free text rather than being force-normalized into a strict date, unless the user later gives a more specific value, at which point it overwrites the vague one.
6. "Interest dropping mid-conversation" is treated as a signal that can *lower* an already-computed score/confidence on subsequent turns, rather than deleting previously captured facts — the assistant doesn't retroactively erase data the user already gave.
7. A reasonable minimum bar for "genuine potential customer" (to trigger asking for contact info) requires at least a destination or clear travel intent *plus* at least one more concrete detail (e.g., trip type, dates, budget, or traveller count) — a single vague question like "tell me about Bali" does not trigger the contact-info ask.
8. The scoring scale and field weights are calibrated by hand against the assignment's own worked examples (10/25/60/80/95) rather than derived from any external dataset, since none is provided.
9. "Confidence" is treated as a function of *how much structured data is present and how directly it was stated* (explicit vs. inferred), separate from the "Lead Score" which reflects *how valuable/ready* the lead is — i.e., a lead can be high-score but medium-confidence if key facts were inferred rather than stated outright.
10. No authentication/user-account system is required; conversations are anonymous and identified only by a generated `conversationId`.
11. The free-tier LLM API key and free-tier database are sufficient for the scope of a demo; no discussion of production scaling, rate-limiting, or cost optimization is expected.
12. The deployed link, if provided, does not need to handle real production traffic — it's a demo instance.

---

## Summary: Overall Implementation Strategy (10–15 bullets)

1. Build a React frontend with two panels: a chat window and a live "captured fields" side panel bound to a single evolving lead-state object.
2. Build a Node.js backend exposing a chat endpoint that receives the user's message, current conversation history, and current lead-state, and returns an updated reply + updated lead-state.
3. Use a single LLM provider (candidate's choice) with two distinct call responsibilities per turn: (a) generate the natural conversational reply, (b) extract/update structured travel + customer fields via a structured JSON-output prompt.
4. Maintain conversation state server-side per `conversationId`: message history (bounded window) + the cumulative structured lead-state object, merged/updated (not replaced) on every turn.
5. Compute the Lead Score deterministically in application code from the structured lead-state, using a weighted point system per field present/specificity (destination, trip type, dates, travellers, budget, contact info, etc.), calibrated against the assignment's worked examples.
6. Add a small LLM-derived "intent strength" modifier (e.g., specific/urgent vs. vague/exploratory) layered on top of the rule-based score to explain cases like "tell me about Bali" (10) vs. "planning a honeymoon in Bali" (60) that pure field-counting alone wouldn't distinguish.
7. Derive Confidence from data completeness/directness (explicit vs. inferred fields), separately from the Lead Score itself.
8. Generate the `reason` and `summary` fields by templating off of which scoring rules fired and what was extracted — not as a free-floating LLM guess disconnected from the actual score.
9. Implement a two-gate lead-creation trigger: gate 1 (intent/completeness threshold) decides when the assistant is allowed to ask for name/phone; gate 2 (contact info received) creates/upserts the lead record. Add a shortcut path so unprompted early contact info still gets captured and eventually triggers lead creation once minimal travel context also exists.
10. Persist leads to the chosen store (Supabase recommended) keyed by `conversationId`, upserting rather than duplicating on subsequent qualifying turns.
11. Explicitly handle the four named edge cases in the conversation policy layer: early unsolicited contact info, refusal to share contact info (continue helpfully, don't persist a lead, don't nag), declining interest (allow score to soften, keep prior data intact), and vague values (store as-is, optionally ask one gentle clarifying follow-up without blocking on it).
12. Keep the architecture modular but simple: clearly separated concerns for (chat/reply generation) / (extraction) / (scoring) / (persistence) / (UI state), implemented as plain functions/services — no agent framework, no event bus, no microservices.
13. Write the README to foreground the scoring methodology and confidence definition, include 2–3 real transcripts with resulting JSON, and document all assumptions from Section 7.
14. Record the Loom video around a live demo that intentionally exercises at least one or two of the named edge cases, since that best demonstrates the "thinking" the assignment says it's grading.
15. Defer any discussion of scaling, multi-tenant auth, or production hardening — explicitly out of scope for a time-boxed take-home.
