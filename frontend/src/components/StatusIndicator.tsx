import type { ConversationPhase, LeadState } from "../types";

export function StatusIndicator({
  phase,
  leadState
}: {
  phase: ConversationPhase;
  leadState: LeadState;
}): JSX.Element {
  return (
    <div className="rounded-3xl border border-white/15 bg-ink-900/90 p-4 text-sand-50 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sand-100/70">Conversation</p>
          <p className="mt-1 text-lg font-semibold">{phase}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-sm">
          {leadState.qualification.leadScore} / 100
        </div>
      </div>
      <p className="mt-3 text-sm text-sand-100/80">
        Confidence: <span className="font-medium text-white">{leadState.qualification.confidence}</span>
      </p>
      <p className="mt-2 text-sm text-sand-100/70">{leadState.qualification.reason || "Waiting for more context."}</p>
    </div>
  );
}
