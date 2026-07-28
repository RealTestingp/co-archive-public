/* MultiSelect.tsx
   The multi select sibling of Dropdown. Shares Dropdown.module.css so the two
   are visually identical, and repeats the same placement logic: flip up when
   cramped, shrink to fit, reposition on scroll.

   Kept as a separate component rather than a mode on Dropdown because the value
   type differs, string versus string[], and about half the behaviour changes
   with it. Merging them would mean branching on nearly every line. The honest
   tradeoff is the duplicated geometry code, which is the part worth pulling into
   a shared hook if this were revisited.

   Differences from Dropdown:
   - Selecting toggles an item and leaves the panel open
   - The trigger shows a summary, collapsing to "N selected" once the list is long
   - There is a clear row instead of a placeholder row
   - No typeahead, since jumping by letter is ambiguous once several are checked
*/
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Dropdown.module.css";
import type { DropdownOption } from "./Dropdown";

type Size = "xs" | "sm" | "md";

interface MultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: DropdownOption[];
  /** Shown on the trigger when nothing is selected. */
  placeholder?: string;
  /** Above this many selections the trigger shows "N selected". */
  summaryThreshold?: number;
  size?: Size;
  block?: boolean;
  portal?: boolean;
  theme?: "auto" | "light";
  label?: string;
  disabled?: boolean;
  /** Tooltip shown when disabled. Explains why it is unavailable, rather than
      just going grey, which is the frustrating version. */
  disabledHint?: string;
  className?: string;
  ariaLabel?: string;
}

/* Same panel sizing rules as Dropdown. MIN_HEIGHT is the floor below which the
   panel flips above the trigger instead of squashing. */
const MAX_HEIGHT: Record<Size, number> = { xs: 200, sm: 260, md: 260 };
const MIN_HEIGHT = 140;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

interface Geometry {
  dropUp: boolean;
  maxHeight: number;
  /** Only used in portal mode. */
  left: number;
  width: number;
  top: number;
  bottom: number;
}

export default function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Any",
  summaryThreshold = 2,
  size = "md",
  block = true,
  portal = false,
  theme = "auto",
  label,
  disabled = false,
  disabledHint,
  className,
  ariaLabel,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  /* Keyboard cursor position. Separate from value, since moving the cursor is
     not the same as checking something. */
  const [highlighted, setHighlighted] = useState(-1);
  const [geo, setGeo] = useState<Geometry>({
    dropUp: false,
    maxHeight: MAX_HEIGHT[size],
    left: 0,
    width: 0,
    top: 0,
    bottom: 0,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* Stable unique id per instance, so aria-controls and aria-labelledby do not
     collide when several of these are on one page. */
  const id = useId();

  /* Derived from options rather than stored, so the labels cannot go stale if
     the options list changes underneath a selection. */
  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  /* Trigger text. Names while the selection is short, a count once it is long,
     so the trigger never grows or overflows its fixed width. */
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= summaryThreshold
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  /* Works out where the panel goes and how tall it can be.
     - Measures the trigger on screen with getBoundingClientRect
     - Flips above only when there is genuinely not enough room below AND more
       room above, so it does not flip needlessly
     - Clamps the height so the panel shrinks to fit rather than overflowing
     - left/width/top/bottom are for portal mode, where the panel has no
       positioned ancestor to anchor to */
  const measure = () => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const preferred = MAX_HEIGHT[size];

    const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;

    const dropUp = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow;
    const available = dropUp ? spaceAbove : spaceBelow;

    setGeo({
      dropUp,
      maxHeight: Math.max(MIN_HEIGHT, Math.min(preferred, available)),
      left: rect.left,
      width: rect.width,
      top: rect.bottom + GAP,
      // Distance from the viewport bottom to the top of the trigger.
      bottom: window.innerHeight - rect.top + GAP,
    });
  };

  const openList = () => {
    if (disabled) return;
    // Measure first, so the panel never paints in the wrong place.
    measure();
    setOpen(true);
    // Nothing is "current" in a multi select, so the cursor starts at the top.
    setHighlighted(0);
  };

  /* refocus returns focus to the trigger so keyboard users are not dropped at
     the top of the page. Skipped when the trigger itself was clicked. */
  const closeList = (refocus = true) => {
    setOpen(false);
    setHighlighted(-1);
    if (refocus) buttonRef.current?.focus();
  };

  /* Selecting does NOT close the panel. That is the whole point of a multi
     select, and it is why there is no commit() here like Dropdown has.
     Builds a new array rather than mutating, so React sees a new reference and
     re-renders. Mutating value in place would change nothing on screen. */
  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );

  /* Close on a click outside.
     In portal mode the panel is not a DOM descendant of the wrapper, so a click
     inside the list would look like an outside click and close the panel before
     the option's onClick fired. Hence checking listRef separately.
     pointerdown rather than click so it runs before focus moves. */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
      setHighlighted(-1);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Keep the panel pinned to the trigger while anything scrolls or resizes,
     since the coordinates were measured once at open time and go stale.
     The third argument is capture: true. Scroll events do not bubble, so without
     it this would miss a modal's own scroll container and only catch the window. */
  useEffect(() => {
    if (!open) return;
    const onReflow = () => measure();
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, size]);

  /* Scroll the highlighted row into view when the arrow keys walk past the edge
     of the visible area. block: "nearest" moves the minimum needed rather than
     yanking the row to the centre. */
  useEffect(() => {
    if (!open || highlighted < 0) return;
    const node = listRef.current?.children[highlighted] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

  /* Keyboard handling, the ARIA listbox pattern.
     - Closed: arrows, Enter or Space open it.
     - Open: Escape closes and refocuses, Tab closes without refocusing so focus
       moves on normally, Home and End jump to the ends.
     - Enter and Space toggle rather than select and close, matching toggle().
     - Wrap-around uses modulo. The + options.length on ArrowUp is there because
       JavaScript's % returns a negative for a negative left operand.
     - preventDefault stops Space and the arrows scrolling the page underneath.
     No typeahead here, unlike Dropdown. Typing to jump is ambiguous once several
     items are checked, and the native element has no equivalent to match. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "Tab":
        setOpen(false);
        setHighlighted(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setHighlighted(0);
        break;
      case "End":
        e.preventDefault();
        setHighlighted(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlighted >= 0 && options[highlighted])
          toggle(options[highlighted].value);
        break;
    }
  };

  /* Inline mode only needs a max height, CSS handles the rest.
     Portal mode needs the full geometry, because the panel sits on document.body
     with nothing to anchor to. position: fixed rather than absolute so the
     coordinates are viewport relative, matching getBoundingClientRect.
     z-index 1000 because modal overlays sit at 50. */
  const listStyle: React.CSSProperties = portal
    ? {
        position: "fixed",
        left: `${geo.left}px`,
        width: `${geo.width}px`,
        maxHeight: `${geo.maxHeight}px`,
        ...(geo.dropUp
          ? { bottom: `${geo.bottom}px`, top: "auto" }
          : { top: `${geo.top}px`, bottom: "auto" }),
        zIndex: 1000,
      }
    : { maxHeight: `${geo.maxHeight}px` };

  /* Built once as a variable, then rendered either inline or through a portal at
     the bottom of the component, so the two modes cannot drift apart. */
  const list = (
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      // Tells screen readers more than one option can be chosen at a time.
      aria-multiselectable="true"
      className={[
        styles.list,
        portal ? styles.portalList : "",
        theme === "light" ? styles.light : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={listStyle}
      // Inline mode flips via CSS; portal mode already handled it inline above.
      data-drop-up={!portal && geo.dropUp ? "" : undefined}
      // Focusable programmatically, but kept out of the tab order.
      tabIndex={-1}
      aria-label={!label ? (ariaLabel ?? placeholder) : undefined}
      aria-labelledby={label ? `${id}-label` : undefined}
      onKeyDown={onKeyDown}
    >
      {options.length === 0 ? (
        // Never render an empty panel, it reads as broken rather than empty.
        <li className={styles.emptyRow}>No options available.</li>
      ) : (
        <>
          {/* Only rendered when something is selected, so it does not take up a
              row in the common empty case. */}
          {value.length > 0 && (
            <li>
              <button
                type="button"
                className={styles.clearRow}
                onClick={() => onChange([])}
              >
                Clear selection
              </button>
            </li>
          )}
          {options.map((option, i) => {
            const checked = value.includes(option.value);
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={checked}
                className={`${styles.option} ${styles.optionCheckable}`}
                /* State goes out as data-* attributes and CSS reacts to them.
                   undefined rather than false removes the attribute entirely, so
                   the CSS attribute selectors do not match. */
                data-highlighted={i === highlighted || undefined}
                data-selected={checked || undefined}
                /* Hover drives the same highlight the keyboard uses, so mouse
                   and keyboard never show two cursors at once. */
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => toggle(option.value)}
              >
                {/* Styled span, not a real <input type="checkbox">, so it looks
                    the same in every browser. The accessibility contract is
                    carried by role="option" and aria-selected on the row, which
                    is the correct pattern inside a listbox. A real checkbox
                    nested in role="option" would actually be invalid ARIA. */}
                <span className={styles.checkbox} data-checked={checked || undefined}>
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {option.label}
              </li>
            );
          })}
        </>
      )}
    </ul>
  );

  return (
    <div
      ref={wrapperRef}
      className={[
        styles.wrapper,
        styles[size],
        block ? styles.block : "",
        theme === "light" ? styles.light : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={disabled ? { opacity: 0.45 } : undefined}
    >
      {label && (
        <span className={styles.label} id={`${id}-label`}>
          {label}
        </span>
      )}

      {/* aria-haspopup, aria-expanded and aria-controls are what make this
          announce as a collapsed listbox rather than a plain button.
          The title attribute does double duty: the reason it is disabled when it
          is, otherwise the full selection, since the visible text may have been
          collapsed to a count. */}
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        title={disabled ? disabledHint : selectedLabels.join(", ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={!label ? (ariaLabel ?? placeholder) : undefined}
        aria-labelledby={label ? `${id}-label` : undefined}
        data-active-value={value.length > 0 || undefined}
      >
        <span className={styles.triggerText}>
          {disabled ? "N/A" : summary}
        </span>
        <svg
          className={styles.chevron}
          data-open={open || undefined}
          viewBox="0 0 10 6"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Same panel, two places it can live. */}
      {open && (portal ? createPortal(list, document.body) : list)}
    </div>
  );
}