 # AI-Powered Travel Lead Assistant

React + Node.js take-home implementation for qualifying travel enquiries into scored leads.

## What’s included

- React 18 + Vite frontend
- Express 4 + TypeScript backend
- Supabase repository layer
- OpenAI-based extraction, intent analysis, and reply generation
- Deterministic scoring and qualification logic
- Live captured-fields panel in the UI
- Backend and frontend test scaffolding

## Folder Layout

- `backend/` - API, services, repository, tests
- `frontend/` - chat UI, captured fields panel, tests

## Environment Variables

Backend:

```env
PORT=3001
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Scoring Summary

The qualification engine uses a deterministic, additive model:

- Destination
- Trip type
- Travel date
- Traveller count
- Budget
- Duration
- Departure city
- Special requirements
- Customer name
- Customer phone

The score is then adjusted using intent strength:

- `exploratory`
- `considering`
- `ready_to_book`

Confidence is derived separately:

- `High` when the lead is strong and specific
- `Medium` when there is useful structure but not complete certainty
- `Low` when the conversation is still vague or mostly exploratory

## Conversation Policy

- The assistant does not request contact details too early.
- Once the user is a genuine prospect, it asks for name and phone in one message.
- If the user declines contact sharing, the flow continues helpfully without nagging.
- If the user is inactive long enough, the conversation can transition to `ABANDONED`.

## Sample Transcripts

### 1. Early exploration

**User:** Tell me about Bali.

**Assistant:** Bali is a great choice for beaches, culture, and easy resort stays. Are you looking for a honeymoon, family trip, or something else?

**Resulting lead JSON**

```json
{
  "conversationId": "conv_demo_1",
  "customer": {
    "name": null,
    "phone": null,
    "email": null
  },
  "travel": {
    "destination": "Bali",
    "departureCity": null,
    "travelDate": null,
    "travellers": null,
    "budget": null,
    "duration": null,
    "tripType": null,
    "specialRequirements": null
  },
  "qualification": {
    "leadScore": 5,
    "confidence": "Low",
    "reason": "destination Bali",
    "summary": "to Bali"
  }
}
```

### 2. Qualified travel plan

**User:** I’m planning a honeymoon in Bali this December.

**Assistant:** That sounds lovely. Approximately how many people will be travelling?

**User:** Two adults.

**Assistant:** Great. Do you already have a budget in mind?

**User:** Around Rs 2 lakh.

**Assistant:** Perfect. If you’d like a consultant to help with packages, may I have your name and contact number?

**User:** Rahul Verma, +91 99999999999

**Resulting lead JSON**

```json
{
  "conversationId": "conv_demo_2",
  "customer": {
    "name": "Rahul Verma",
    "phone": "+919999999999",
    "email": null
  },
  "travel": {
    "destination": "Bali",
    "departureCity": null,
    "travelDate": "December",
    "travellers": 2,
    "budget": "Rs 2 lakh",
    "duration": null,
    "tripType": "Honeymoon",
    "specialRequirements": null
  },
  "qualification": {
    "leadScore": 95,
    "confidence": "High",
    "reason": "destination Bali; trip type Honeymoon; travel date December; 2 travellers; budget Rs 2 lakh; contact info captured",
    "summary": "planning a honeymoon trip to Bali in December for 2 travellers with a budget of Rs 2 lakh"
  }
}
```

### 3. Early unprompted contact details

**User:** Rahul Verma, +91 9999999999, want to plan a Bali trip.

**Assistant:** Thanks, Rahul. A travel consultant can help with this. What kind of trip are you planning?

**Resulting lead JSON**

```json
{
  "conversationId": "conv_demo_3",
  "customer": {
    "name": "Rahul Verma",
    "phone": "+919999999999",
    "email": null
  },
  "travel": {
    "destination": "Bali",
    "departureCity": null,
    "travelDate": null,
    "travellers": null,
    "budget": null,
    "duration": null,
    "tripType": null,
    "specialRequirements": null
  },
  "qualification": {
    "leadScore": 95,
    "confidence": "High",
    "reason": "destination Bali; contact info captured",
    "summary": "to Bali"
  }
}
```

## Run Locally

Install dependencies inside `backend/` and `frontend/`, then start each app in its own terminal.

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Notes

- The repository is intentionally split into small modules so the backend orchestration remains testable.
- Prompt text is centralized under `backend/src/prompts/`.
- Lead scoring and qualification are deterministic and live in the backend services layer.

