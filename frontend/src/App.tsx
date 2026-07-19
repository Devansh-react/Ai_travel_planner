import { ConversationProvider } from "./context/ConversationContext";
import { ChatPage } from "./pages/ChatPage";

export function App(): JSX.Element {
  return (
    <ConversationProvider>
      <ChatPage />
    </ConversationProvider>
  );
}
