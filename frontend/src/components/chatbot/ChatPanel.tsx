/* ChatPanel.tsx
   The chat window itself. Presentational: it holds the draft message and
   scrolling, while ChatWidget owns the conversation and the API call.

   Not my file, but two things in it are worth knowing.

   The effect on messages scrolls to the bottom whenever the list changes, so a
   new reply is visible without the user scrolling. block behaviour is smooth
   rather than instant so it reads as the conversation moving rather than
   jumping.

   Replies render through react-markdown rather than being injected as HTML. The
   assistant returns markdown, and react-markdown parses it to React elements
   instead of setting innerHTML, so model output cannot inject script into the
   page. That is the right answer if anyone asks how you handle untrusted text
   from an AI service.
*/
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
  // DRAFT holds whatever the user is currently typing, before it's sent.
  const [draft, setDraft] = useState("");

  // useRef gives us a direct reference to the actual scrollable message
  // list DOM element, so we can call scrollTo() on it manually. We need
  // this because React doesn't have a built-in "auto-scroll to bottom"
  // behavior.
  const listRef = useRef<HTMLDivElement>(null);

  // Every time `messages` changes (a new message is added, either from
  // the user or the assistant), scroll the list down to the bottom so the
  // newest message is always visible, instead of the user having to
  // manually scroll down after every reply.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    // Forms reload the page by default on submit — preventDefault stops
    // that, we're handling the "submission" entirely in JS instead.
    e.preventDefault();
    const trimmed = draft.trim();
    // Guard clause: don't send an empty/whitespace-only message, and
    // don't let the user send a second message while we're still waiting
    // on a response to the first one (isSending).
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
          // Empty state shown before the user has sent their first message
          <div className={styles.emptyState}>
            Ask me anything about the Calgary Opera archive — productions,
            artists, seasons, and more.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              // Different styling depending on who sent the message, so
              // user messages and assistant replies look visually distinct.
              className={`${styles.message} ${m.role === "user" ? styles.messageUser : styles.messageAssistant}`}
            >
              {/* ReactMarkdown renders the message content as formatted
                  markdown instead of plain text. This matters because the AI model's replies often come back
                  with markdown formatting.

                  EX: **bold** opera titles - this is how users would see them formatted,
                  with asterisks instead of actually bolded. */}
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          ))
        )}
        {isSending && (
          // "Typing" indicator. The three animated dots shown while we're
          // waiting on a reply from the chatbot.
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
          // Disabled while waiting for a response, so the user can't
          // queue up multiple messages before the first one finishes.
          disabled={isSending}
        />
        <button
          className={styles.sendButton}
          type="submit"
          aria-label="Send message"
          disabled={isSending}
        >
          {/* Paper-plane "send" icon — a diagonal line plus a triangular
              polygon shape, same inline-SVG approach as the other icons
              in this component and others (no icon library dependency). */}
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
