/* Dropdown.tsx
   Single select dropdown, built to replace the native <select>.

   Why it exists: a native select draws its option list at the operating system
   level, not in the page, so CSS cannot limit its height. On Windows Chrome the
   Season list was long enough to run off the top of the screen. This renders the
   panel as normal page elements, so max-height and overflow actually apply.

   What that costs: everything the native element gave us free has to be rebuilt
   here. Keyboard navigation, typeahead, focus return, ARIA roles. That is most
   of the code below.

   Two rendering modes:
   - Inline, the default. Panel is absolutely positioned inside the wrapper.
   - Portal, rendered into document.body. Needed inside modals, because every
     modal panel is overflow-y: auto, which clips an absolutely positioned child
     at the modal edge.
*/
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Dropdown.module.css";

export interface DropdownOption {
  value: string;
  label: string;
}

type DropdownSize = "xs" | "sm" | "md";

interface DropdownProps {
  /** Selected value. Use "" for the placeholder / unfiltered state. */
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  /** Shown when nothing is selected; also the reset row inside the list. */
  placeholder?: string;
  /** false hides the reset row, for pickers that must always have a value. */
  allowClear?: boolean;
  /** false disables the accent "filter is active" styling (per-page, modals). */
  highlightWhenSet?: boolean;
  /** xs = 28px (per-page), sm = 32px (page filters), md = 36px (modal forms). */
  size?: DropdownSize;
  /** Stretch to fill the container. Modal form fields want this. */
  block?: boolean;
  /**
   * Render the panel into document.body instead of inline.
   * Required inside modals: every modal panel is `overflow-y: auto`, which
   * clips an absolutely-positioned child at the modal edge.
   */
  portal?: boolean;
  /**
   * "auto" follows [data-theme]. "light" pins light colours. Escape hatch for a
   * dropdown sitting on a permanently light surface. Nothing passes it now that
   * the modals are themed.
   */
  theme?: "auto" | "light";
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when there's no visible label. */
  ariaLabel?: string;
}

/* Panel sizing. MIN_HEIGHT is the floor: below this the panel is too short to be
   worth showing, so we flip it above the trigger instead. VIEWPORT_MARGIN keeps
   it off the very edge of the window. */
const MAX_HEIGHT: Record<DropdownSize, number> = { xs: 200, sm: 260, md: 260 };
const MIN_HEIGHT = 140;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

interface Geometry {
  dropUp: boolean;
  maxHeight: number;
  /** Only populated in portal mode. */
  left: number;
  width: number;
  top: number;
  bottom: number;
}

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowClear = true,
  highlightWhenSet = true,
  size = "sm",
  block = false,
  portal = false,
  theme = "auto",
  label,
  disabled = false,
  className,
  ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  /* Which row the keyboard cursor is on. -1 means none. Kept separate from the
     selected value, since you can move the cursor without choosing anything. */
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
  /* Typeahead buffer lives in a ref, not state, because typing into it should
     not trigger a re-render. Only the resulting highlight change should. */
  const typeahead = useRef<{ query: string; timer?: number }>({ query: "" });

  /* useId gives a stable unique id per instance, which the aria-controls and
     aria-labelledby wiring below needs. Doing this by hand would collide when
     two dropdowns are on the same page. */
  const id = useId();

  /* Prepend the clear row so it is part of the same list the keyboard walks.
     Making it a real row rather than a special case is what lets arrow keys and
     typeahead reach it without extra index maths. */
  const rows = useMemo<DropdownOption[]>(
    () => (allowClear ? [{ value: "", label: placeholder }, ...options] : options),
    [allowClear, options, placeholder]
  );

  const selected = rows.find((o) => o.value === value);
  const hasValue = value !== "";
  const displayLabel = selected && hasValue ? selected.label : placeholder;

  /* Works out where the panel goes and how tall it can be.
     - Measures the trigger's position on screen with getBoundingClientRect
     - Flips above the trigger only if there is genuinely not enough room below
       AND there is more room above, so it does not flip needlessly
     - Clamps the height between MIN_HEIGHT and the preferred size, so the panel
       shrinks to fit rather than overflowing the window
     - Also stores left/width/top/bottom, which portal mode needs because the
       panel is no longer positioned relative to the wrapper */
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
      // Distance from viewport bottom to the top of the trigger.
      bottom: window.innerHeight - rect.top + GAP,
    });
  };

  const openList = () => {
    if (disabled) return;
    // Measure before opening, so the panel never paints in the wrong place.
    measure();
    setOpen(true);
    // Start the cursor on the current value rather than the top of the list.
    const i = rows.findIndex((o) => o.value === value);
    setHighlighted(i >= 0 ? i : 0);
  };

  /* refocus puts focus back on the trigger, which matters for keyboard users so
     they do not get dumped at the top of the page. Skipped when the user closed
     it by clicking the trigger itself, since it already has focus. */
  const closeList = (refocus = true) => {
    setOpen(false);
    setHighlighted(-1);
    if (refocus) buttonRef.current?.focus();
  };

  const commit = (option: DropdownOption) => {
    onChange(option.value);
    closeList();
  };

  /* Close on a click outside.
     In portal mode the panel is not a DOM descendant of the wrapper, so a click
     inside the list would look like an outside click and close the panel before
     the option's onClick ever fired. Hence checking listRef separately.
     pointerdown rather than click so it fires before focus moves. */
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

  /* Keep the panel pinned to the trigger while anything scrolls or resizes.
     The panel is positioned from coordinates measured at open time, so those go
     stale the moment the page moves.
     The third argument to addEventListener is capture: true. Scroll events do
     not bubble, so without capture this would miss a modal's own scroll
     container and only catch the window. */
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

  /* Scroll the highlighted row into view when arrow keys move past the edge of
     the visible area. block: "nearest" scrolls the minimum needed instead of
     jumping the row to the centre. */
  useEffect(() => {
    if (!open || highlighted < 0) return;
    const node = listRef.current?.children[highlighted] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

  // Clear the pending typeahead timer if the component unmounts mid-type.
  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

  /* Typeahead, matching what a native select does. Characters accumulate into a
     buffer so typing "mad" jumps to Madama Butterfly rather than landing on M,
     then A, then D. The buffer resets after 600ms of no typing.
     If the list is closed this selects the match outright, which is again what
     the native element does. */
  const handleTypeahead = (char: string) => {
    const state = typeahead.current;
    window.clearTimeout(state.timer);
    state.query += char.toLowerCase();
    state.timer = window.setTimeout(() => {
      state.query = "";
    }, 600);

    const match = rows.findIndex((o) => o.label.toLowerCase().startsWith(state.query));
    if (match < 0) return;
    if (open) setHighlighted(match);
    else commit(rows[match]);
  };

  /* Keyboard handling. This is the ARIA listbox pattern:
     - Closed: arrows, Enter or Space open it. Any printable character starts
       typeahead.
     - Open: Escape closes and refocuses, Tab closes without refocusing so focus
       moves on normally, Home and End jump to the ends.
     - Arrow wrap-around uses modulo, and the + rows.length on ArrowUp is there
       because JavaScript's % returns a negative for a negative left operand.
     - preventDefault stops Space and the arrows scrolling the page underneath. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        e.preventDefault();
        handleTypeahead(e.key);
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
        setHighlighted((i) => (i + 1) % rows.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((i) => (i - 1 + rows.length) % rows.length);
        break;
      case "Home":
        e.preventDefault();
        setHighlighted(0);
        break;
      case "End":
        e.preventDefault();
        setHighlighted(rows.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlighted >= 0) commit(rows[highlighted]);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          e.preventDefault();
          handleTypeahead(e.key);
        }
    }
  };

  /* Inline mode only needs a max height, since CSS handles the rest.
     Portal mode needs everything, because the panel now sits on document.body
     with no positioned ancestor to anchor to. position: fixed is used rather
     than absolute so the coordinates are viewport relative, matching what
     getBoundingClientRect returned. */
  const listStyle: React.CSSProperties = portal
    ? {
        position: "fixed",
        left: `${geo.left}px`,
        width: `${geo.width}px`,
        maxHeight: `${geo.maxHeight}px`,
        ...(geo.dropUp
          ? { bottom: `${geo.bottom}px`, top: "auto" }
          : { top: `${geo.top}px`, bottom: "auto" }),
        // Modal overlays sit at z-index 50, so the panel has to clear them.
        zIndex: 1000,
      }
    : { maxHeight: `${geo.maxHeight}px` };

  /* The panel is built once as a variable, then either rendered inline or
     portalled at the bottom of the component. Building it once means the two
     modes cannot drift apart. */
  const list = (
    <ul
      ref={listRef}
      id={id}
      // role="listbox" is what makes this announce as a select to screen readers.
      role="listbox"
      className={[
        styles.list,
        portal ? styles.portalList : "",
        theme === "light" ? styles.light : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={listStyle}
      // Inline mode flips via CSS; portal mode already did it inline above.
      data-drop-up={!portal && geo.dropUp ? "" : undefined}
      // Focusable programmatically, but kept out of the tab order.
      tabIndex={-1}
      aria-label={!label ? (ariaLabel ?? placeholder) : undefined}
      aria-labelledby={label ? `${id}-label` : undefined}
      onKeyDown={onKeyDown}
    >
      {rows.map((option, i) => (
        <li
          key={option.value || "__clear"}
          role="option"
          aria-selected={option.value === value}
          className={styles.option}
          /* State goes out as data-* attributes and CSS reacts to them. Setting
             them to undefined rather than false removes the attribute entirely,
             so the CSS attribute selectors do not match. */
          data-highlighted={i === highlighted || undefined}
          data-selected={(option.value === value && hasValue) || undefined}
          data-muted={option.value === "" || undefined}
          /* Hover moves the same highlight the keyboard uses, so mouse and
             keyboard never show two cursors at once. */
          onMouseEnter={() => setHighlighted(i)}
          onClick={() => commit(option)}
        >
          {option.label}
        </li>
      ))}
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
    >
      {label && (
        <span className={styles.label} id={`${id}-label`}>
          {label}
        </span>
      )}

      {/* aria-haspopup, aria-expanded and aria-controls are what make this
          announce as a collapsed listbox rather than a plain button.

          data-active-value drives the accent "a filter is set" styling.
          data-placeholder is separate because modals pass highlightWhenSet
          false, so data-active-value is never set on form fields and cannot be
          used to tell a real selection from the placeholder. */}
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={!label ? (ariaLabel ?? placeholder) : undefined}
        aria-labelledby={label ? `${id}-label` : undefined}
        data-active-value={(highlightWhenSet && hasValue) || undefined}
        data-placeholder={!hasValue || undefined}
      >
        <span className={styles.triggerText}>{displayLabel}</span>
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

      {/* The whole point, in one line: same panel, two places it can live. */}
      {open && (portal ? createPortal(list, document.body) : list)}
    </div>
  );
}