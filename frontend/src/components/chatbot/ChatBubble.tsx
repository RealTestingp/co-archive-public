/* ChatBubble.tsx
   Floating open/close button. Swaps between a speech bubble icon and an X depending on state.
   
   It's a real <button> with aria-expanded and a changing aria-label — a styled div would've
   needed keyboard/role handling added by hand for the same accessibility.
*/
import styles from "./ChatWidget.module.css";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

// Controlled component, holds no state — open/closed and onClick are just passed in as props.
const ChatBubble = ({ isOpen, onClick }: ChatBubbleProps) => {
  return (
    <button
      className={styles.bubble}
      onClick={onClick}
      // Label changes with state so screen readers announce the actual next action.
      aria-label={isOpen ? "Close chat" : "Open chat assistant"}
      // Tells assistive tech whether the panel this button controls is open or closed.
      aria-expanded={isOpen}
    >
      {/* Two separate icons swapped by state, instead of CSS-rotating one — simpler, no icon library. */}
      {isOpen ? (
        // "X" icon, shown when open.
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true" // aria-label on the button already covers this.
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // Chat bubble icon, shown when closed (default).
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
          {/* Path draws the chat bubble shape. */}
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )}
    </button>
  );
};

export default ChatBubble;
