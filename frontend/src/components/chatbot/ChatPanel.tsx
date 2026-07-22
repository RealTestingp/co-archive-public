import { useState, useRef, useEffect, type SyntheticEvent } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./ChatWidget.module.css";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  isSending: boolean;
}

const ChatPanel = ({
  messages,
  onSend,
  onClose,
  isSending,
}: ChatPanelProps) => {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setDraft("");
  };

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Archive assistant chat"
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Archive Assistant</span>
        <button
          className={styles.panelClose}
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.messageList} ref={listRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            Ask me anything about the Calgary Opera archive — productions,
            artists, seasons, and more.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.message} ${m.role === "user" ? styles.messageUser : styles.messageAssistant}`}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ))
        )}
        {isSending && (
          <div className={`${styles.message} ${styles.messageAssistant}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <form className={styles.inputRow} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="text"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Chat message"
          disabled={isSending}
        />
        <button
          className={styles.sendButton}
          type="submit"
          aria-label="Send message"
          disabled={isSending}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
