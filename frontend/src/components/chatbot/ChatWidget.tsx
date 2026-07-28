/* ChatWidget.tsx
   The archive assistant. Owns the conversation state and the call to the API;
   ChatBubble is the floating button and ChatPanel is the window.

   Note: the chat feature is the one part of the frontend I did not build. These
   comments describe how it works from the outside, which is what the rest of the
   app depends on.

   Mounted in App.tsx outside <Routes>, so the thread survives navigation. Move
   between pages with the panel open and the conversation is still there.

   Every message posts to /api/chat with the full prior history, because HTTP is
   stateless and the backend keeps no session. The assistant only knows what is
   sent with each request, which is why follow up questions work at all.

   The frontend deliberately knows nothing about the model. It sends text and
   renders whatever reply comes back. All the AI logic lives behind the endpoint
   in chatbot-service, which is what keeps the credentials out of the browser and
   lets the model change without touching this file.

   Failures are caught and turned into a message in the thread rather than an
   error state, so a failed request looks like the assistant answering rather
   than the widget breaking.
*/
import { useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import styles from "./ChatWidget.module.css";
import { api } from "../../api";

// ChatWidget is the "container" component. It owns all the real state (is the panel open, what messages exist,
// are we waiting on a reply) and passes that down as props to ChatBubble and ChatPanel, which are both
// simple components that just render based on what they're given.

// This keeps the state in one place instead of scattered across components,
// which matters here specifically because both the bubble (open/close)
// and the panel (messages) need to react to the same shared state.
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // isSending tracks if we're currently waiting on a reply from the
  // backend. This drives the typing indicator in ChatPanel and disables
  // the input/send button while a request is in flight.
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    // Conversation memory: before adding the new message to state, we
    // convert everything already in `messages` into a plain history array
    // and send it along with the new message. Without this, every message
    // would be sent to the backend in total isolation.

    // This history resets naturally on page refresh or when the widget is
    // closed and reopened, since it only lives in this component's state,
    // not in any persistent storage. This was an intentional and accepted
    // tradeoff for simplicity.
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    // Add the user's message to the UI immediately, before we even hear
    // back from the server. Makes the chat feel responsive instead
    // of waiting on a network round trip before showing what was typed.
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      // api.post is our shared fetch wrapper (api.ts). It points at
      // the gateway's real URL (via VITE_API_BASE_URL) rather than a
      // relative path, since the frontend calls the gateway directly.
      const res = await api.post("/api/chat", { message: text, history });

      if (!res.ok)
        throw new Error(`Chat request failed with status ${res.status}`);

      const data: { reply: string } = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      // If the request fails for any reason, this shows a generic fallback message
      // in the chat instead of leaving the user staring at a stuck typing indicator
      // with no explanation.
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      // Runs whether the request succeeded or failed, so the input/button
      // always get re-enabled and the typing indicator always disappears —
      // no scenario where the UI gets stuck waiting forever.
      setIsSending(false);
    }
  };

  return (
    <div className={styles.widget}>
      {/* The panel only renders when isOpen is true. The panel
          (and its message list) doesn't exist in the DOM at all until the
          user opens it. */}
      {isOpen && (
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onClose={() => setIsOpen(false)}
          isSending={isSending}
        />
      )}
      <ChatBubble isOpen={isOpen} onClick={() => setIsOpen((o) => !o)} />
    </div>
  );
};

export default ChatWidget;
