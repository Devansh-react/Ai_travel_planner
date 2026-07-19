import type { Message } from "../types";

export function MessageBubble({ message }: { message: Message }): JSX.Element {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-coral-500 text-white shadow-glow"
            : "bg-white/90 text-slate-800 border border-white/70"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
