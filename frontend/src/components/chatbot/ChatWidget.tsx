/* ChatWidget.tsx
   This file holds the conversation and talks to the API;
   ChatBubble is just the floating button, ChatPanel is the actual chat window.

   Lives outside <Routes> in App.tsx so the conversation doesn't reset when you
   navigate between pages while the chat is open.

   Every message sends the whole conversation so far, not just the new one — the
   backend doesn't remember past messages on its own, so we remind it every time.

   This file has no idea what AI model is answering — it just sends text and
   displays whatever comes back.

   If a request fails, it shows a normal-looking chat message instead of an error
   screen, so it never looks like the widget itself broke.
*/
import { useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import styles from "./ChatWidget.module.css";
import { api } from "../../api";

// Owns all state; ChatBubble/ChatPanel are simple components that just render what they're given.
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // True while waiting on a reply — drives the typing indicator and disables input.
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    // Snapshot conversation so far — backend needs full history since it has no memory.
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    // Show the user's message immediately, before the network call finishes.
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      // Shared fetch wrapper — calls the gateway directly (see api.ts).
      const res = await api.post("/api/chat", { message: text, history });

      if (!res.ok) {
        // Try to use the backend's actual error message (e.g. rate limit, message too long)
        // instead of always showing a generic fallback.
        const errorText = await res.text().catch(() => "");

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: errorText || "Something went wrong. Please try again.",
          },
        ]);
        return;
      }

      const data: { reply: string } = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      // Network failure or unexpected error (not an HTTP error response).
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
      // Always re-enables input/button, success or failure.
      setIsSending(false);
    }
  };

  return (
    <div className={styles.widget}>
      {/* Panel unmounts entirely when closed, not just hidden. */}
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
