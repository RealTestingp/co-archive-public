import { useState } from "react";
import ChatBubble from "./ChatBubble";
import ChatPanel, { type ChatMessage } from "./ChatPanel";
import styles from "./ChatWidget.module.css";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = (text: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Placeholder reply — COA-192 will wire this up to the real chatbot API
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "…" },
      ]);
    }, 500);
  };

  return (
    <div className={styles.widget}>
      {isOpen && (
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          onClose={() => setIsOpen(false)}
        />
      )}
      <ChatBubble isOpen={isOpen} onClick={() => setIsOpen((o) => !o)} />
    </div>
  );
};

export default ChatWidget;
