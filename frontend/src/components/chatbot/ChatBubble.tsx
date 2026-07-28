/* ChatBubble.tsx
   The floating button that opens and closes the assistant. Swaps between a
   speech bubble and a close icon depending on state.

   Not my file. Worth noting that it is a real <button> with aria-expanded and a
   changing aria-label, so screen readers announce it as a toggle and say which
   action it will perform. A styled div would have needed keyboard and role
   handling added by hand.
*/
import styles from "./ChatWidget.module.css";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

// This is a controlled component. It holds no state of its own.
// Whether the panel is open, and what happens on click, are both passed in
// as props from the ChatWidget file. This keeps ChatBubble simple. It
// only knows how to render based on the state it's given, and reports
// clicks back up rather than deciding anything itself. That makes it easy
// to test and reuse, since it doesn't know or care about the rest of the
// chat logic (messages, sending, etc.). It just cares about "am I open, and what happens when clicked."
const ChatBubble = ({ isOpen, onClick }: ChatBubbleProps) => {
  return (
    <button
      className={styles.bubble}
      onClick={onClick}
      // Accessibility: aria-label changes based on state so a screen reader
      // announces the actual current action ("Open chat assistant" vs.
      // "Close chat"), not a generic label that wouldn't make sense once
      // the panel is already open.
      aria-label={isOpen ? "Close chat" : "Open chat assistant"}
      // aria-expanded tells assistive tech and browser devtools whether
      // the element this button controls (the chat panel) is currently
      // expanded or hidden. This is important for accessibility, so users know the current state of the panel.
      aria-expanded={isOpen}
    >
      {/* We swap between two different SVG icons based on isOpen, rather
          than using CSS to rotate/hide a single icon. This keeps the
          markup simple and avoids any icon library dependency. */}
      {isOpen ? (
        // This SVG is the "X" (close) icon, shown when the panel is open
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true" // hidden from screen readers because aria-label on the button already describes the action
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // This SVG is the Chat bubble icon, shown when the panel is closed (default)
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* An SVG path, a series of draw commands (move, curve, line, close) 
          that together trace out the chat bubble icon shape (default state). */}
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )}
    </button>
  );
};

export default ChatBubble;
