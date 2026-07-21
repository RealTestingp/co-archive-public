import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Dropdown.module.css";
import type { DropdownOption } from "./Dropdown";

/**
 * Multi-select sibling of Dropdown. Shares Dropdown.module.css so the two are
 * visually identical — same trigger metrics, same panel, same placement logic
 * (flip up when cramped, shrink to available space, reposition on scroll).
 */

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
  /** Tooltip shown when disabled — explains *why* it's unavailable. */
  disabledHint?: string;
  className?: string;
  ariaLabel?: string;
}

const MAX_HEIGHT: Record<Size, number> = { xs: 200, sm: 260, md: 260 };
const MIN_HEIGHT = 140;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

interface Geometry {
  dropUp: boolean;
  maxHeight: number;
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

  const id = useId();

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= summaryThreshold
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

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
      bottom: window.innerHeight - rect.top + GAP,
    });
  };

  const openList = () => {
    if (disabled) return;
    measure();
    setOpen(true);
    setHighlighted(0);
  };

  const closeList = (refocus = true) => {
    setOpen(false);
    setHighlighted(-1);
    if (refocus) buttonRef.current?.focus();
  };

  // Selecting does NOT close the panel — that's the point of a multi-select.
  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );

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
    const node = listRef.current?.children[highlighted] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, highlighted]);

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

  const list = (
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      aria-multiselectable="true"
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
      {options.length === 0 ? (
        <li className={styles.emptyRow}>No options available.</li>
      ) : (
        <>
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
                data-highlighted={i === highlighted || undefined}
                data-selected={checked || undefined}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => toggle(option.value)}
              >
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

      {open && (portal ? createPortal(list, document.body) : list)}
    </div>
  );
}