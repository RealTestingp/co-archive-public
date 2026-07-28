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

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const res = await api.post("/api/chat", { message: text, history });

      if (!res.ok)
        throw new Error(`Chat request failed with status ${res.status}`);

      const data: { reply: string } = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch (err) {
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
      setIsSending(false);
    }
  };

  return (
    <div className={styles.widget}>
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
