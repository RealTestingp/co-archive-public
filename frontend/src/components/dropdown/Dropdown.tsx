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
  /** false hides the reset row — for pickers that must always have a value. */
  allowClear?: boolean;
  /** false disables the accent "filter is active" styling (per-page, modals). */
  highlightWhenSet?: boolean;
  /** xs = 28px (per-page), sm = 32px (page filters), md = 36px (modal forms). */
  size?: DropdownSize;
  /** Stretch to fill the container — modal form fields want this. */
  block?: boolean;
  /**
   * Render the panel into document.body instead of inline.
   * Required inside modals: every modal panel is `overflow-y: auto`, which
   * clips an absolutely-positioned child at the modal edge.
   */
  portal?: boolean;
  /**
   * "auto" follows [data-theme]. "light" pins light colours — the modals are
   * hardcoded white and don't consume ThemeContext, so an auto-darkening
   * dropdown inside one would render a dark panel on a white form.
   */
  theme?: "auto" | "light";
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when there's no visible label. */
  ariaLabel?: string;
}

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
  const typeahead = useRef<{ query: string; timer?: number }>({ query: "" });

  const id = useId();

  const rows = useMemo<DropdownOption[]>(
    () => (allowClear ? [{ value: "", label: placeholder }, ...options] : options),
    [allowClear, options, placeholder]
  );

  const selected = rows.find((o) => o.value === value);
  const hasValue = value !== "";
  const displayLabel = selected && hasValue ? selected.label : placeholder;

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
    measure();
    setOpen(true);
    const i = rows.findIndex((o) => o.value === value);
    setHighlighted(i >= 0 ? i : 0);
  };

  const closeList = (refocus = true) => {
    setOpen(false);
    setHighlighted(-1);
    if (refocus) buttonRef.current?.focus();
  };

  const commit = (option: DropdownOption) => {
    onChange(option.value);
    closeList();
  };

  // Outside click. In portal mode the panel is not a DOM descendant of the
  // wrapper, so it has to be checked separately or every click inside the
  // list would count as "outside" and close it.
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

  // Keep the panel pinned to the trigger while anything scrolls or resizes.
  // Capture phase so it also fires for the modal's own scroll container.
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

  useEffect(() => {
    if (!open || highlighted < 0) return;
    const node = listRef.current?.children[highlighted] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

  useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

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

  const listStyle: React.CSSProperties = portal
    ? {
        position: "fixed",
        left: `${geo.left}px`,
        width: `${geo.width}px`,
        maxHeight: `${geo.maxHeight}px`,
        ...(geo.dropUp
          ? { bottom: `${geo.bottom}px`, top: "auto" }
          : { top: `${geo.top}px`, bottom: "auto" }),
        // Modal overlays sit at z-index 50.
        zIndex: 1000,
      }
    : { maxHeight: `${geo.maxHeight}px` };

  const list = (
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      className={[
        styles.list,
        portal ? styles.portalList : "",
        theme === "light" ? styles.light : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={listStyle}
      data-drop-up={!portal && geo.dropUp ? "" : undefined}
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
          data-highlighted={i === highlighted || undefined}
          data-selected={(option.value === value && hasValue) || undefined}
          data-muted={option.value === "" || undefined}
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

      {/* data-placeholder lets CSS tell a real selection apart from the
          placeholder, so a chosen value renders in primary ink while the
          placeholder stays muted. data-active-value can't do that job: modals
          pass highlightWhenSet: false, so it is never set on form fields. */}
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

      {open && (portal ? createPortal(list, document.body) : list)}
    </div>
  );
}