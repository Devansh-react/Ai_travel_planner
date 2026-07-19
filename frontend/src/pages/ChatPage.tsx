import { CapturedFieldsPanel } from "../components/CapturedFieldsPanel";
import { ChatWindow } from "../components/ChatWindow";
import { StatusIndicator } from "../components/StatusIndicator";
import { useConversation } from "../context/ConversationContext";

export function ChatPage(): JSX.Element {
  const { state } = useConversation();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#0b1a2b_45%,_#10243b_100%)] px-4 py-6 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="space-y-4">
          <StatusIndicator phase={state.conversationPhase} leadState={state.leadState} />
          <ChatWindow />
        </div>
        <CapturedFieldsPanel leadState={state.leadState} />
      </div>
    </main>
  );
}
