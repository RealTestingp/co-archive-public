/* ChatPanel.tsx
   The chat window itself. Presentational — ChatWidget owns state/API calls, this just renders.

   Two things worth knowing: messages auto-scroll to bottom on update, and replies render via
   react-markdown (not raw HTML) so model output can't inject scripts into the page.
*/
import { useState, useRef, useEffect, type SyntheticEvent } from "react";
import ReactMarkdown from "react-markdown";
import styles from "./ChatWidget.module.css";
import remarkGfm from "remark-gfm";

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
  // What the user is currently typing.
  const [draft, setDraft] = useState("");

  // Ref to the message list so we can manually scroll it (React has no built-in auto-scroll).
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stop the default page reload on submit.
    const trimmed = draft.trim();
    if (!trimmed || isSending) return; // No empty sends, no overlapping sends.
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
        <span className={styles.panelTitle}>Pagliacci</span>
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
          // Shown before the first message is sent.
          <div className={styles.emptyState}>
            Ask me anything about the Calgary Opera archive — productions,
            artists, seasons, and more.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              // Style differs based on who sent it.
              className={`${styles.message} ${m.role === "user" ? styles.messageUser : styles.messageAssistant}`}
            >
              {/* Renders tables and other GFM markdown formatting (added remark-gfm plugin). */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          ))
        )}
        {isSending && (
          // Animated "typing" dots while waiting on a reply.
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
          disabled={isSending} // Prevents overlapping requests.
        />
        <button
          className={styles.sendButton}
          type="submit"
          aria-label="Send message"
          disabled={isSending}
        >
          {/* Paper-plane send icon — inline SVG, no icon library. */}
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
