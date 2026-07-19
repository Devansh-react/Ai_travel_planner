import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MessageBubble } from "./MessageBubble";
import { useConversation } from "../context/ConversationContext";

export function ChatWindow(): JSX.Element {
  const [draft, setDraft] = useState("");
  const { state, sendUserMessage } = useConversation();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!draft.trim() || state.loading) {
      return;
    }
    const value = draft;
    setDraft("");
    await sendUserMessage(value);
  }

  return (
    <div className="flex h-full min-h-[620px] flex-col rounded-[2rem] border border-white/20 bg-ink-950/90 shadow-[0_30px_120px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.3em] text-sand-100/60">AI Travel Lead Assistant</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Plan trips, qualify leads, capture context.</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {state.messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sand-100/80">
            Start with a destination, a rough idea, or even your contact details if you prefer. The assistant will keep the flow natural.
          </div>
        ) : null}
        {state.messages.map((message, index) => (
          <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
        ))}
        {state.loading ? <div className="text-sm text-sand-100/60">Thinking...</div> : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Tell me about your trip..."
            className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-sand-100/40 outline-none transition focus:border-coral-400 focus:bg-white/15"
          />
          <button
            type="submit"
            disabled={!draft.trim() || state.loading}
            className="rounded-2xl bg-coral-500 px-5 py-3 font-medium text-white transition hover:bg-coral-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {state.error ? <p className="mt-3 text-sm text-red-200">{state.error}</p> : null}
      </form>
    </div>
  );
}
