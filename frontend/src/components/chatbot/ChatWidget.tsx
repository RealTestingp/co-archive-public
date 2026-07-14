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
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const res = await api.post("/api/chat", { message: text });

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
