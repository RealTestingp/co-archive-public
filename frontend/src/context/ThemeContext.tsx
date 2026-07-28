import { createContext, useContext, useState, useEffect } from "react";

/* ============================================================================
   THEME + DESIGN TOKENS
   ----------------------------------------------------------------------------
   `colors` mirrors the CSS custom properties in index.css so inline styles and
   CSS Modules stay in lockstep. `type` and `weight` are the same 4-size /
   2-weight scale, exposed to TypeScript so a component can never invent a new
   font size — the type system rejects it.

   Old colour keys (textPrimary, accentLight, …) are kept as aliases so nothing
   breaks while pages migrate. New code should use the 60/30/10 names.
   ========================================================================== */

type ThemeMode = "light" | "dark" | "system";
type Theme = "light" | "dark";

/* ── Typography: 4 sizes, 2 weights. Same for both themes.
   Every step is an even number of px: 12 / 16 / 26 / 40.

   Four steps, not six. 14px folded up into 16 and 20px folded up into 26.
   Because 16px is exactly the threshold below which iOS Safari auto-zooms a
   focused input, putting body text at 16 removed the need for the mobile
   input-zoom workaround altogether. ── */
export const type = {
  /** 12px — overlines, chips, counts, meta, form labels */
  xs: "0.75rem",
  /** 16px — DEFAULT. Body, UI text, inputs, buttons, card titles */
  sm: "1rem",
  /** 26px — page titles AND section headings */
  lg: "1.625rem",
  /** 40px — hero and 404 only */
  xl: "2.5rem",
} as const;

export const weight = {
  regular: 400,
  semibold: 600,
} as const;

export type TypeScale = typeof type;
export type WeightScale = typeof weight;

interface Palette {
  /* ══ 60% — surfaces ══ */
  bg: string;
  surface: string;
  surfaceHover: string;

  /* ══ 30% — ink and structure ══
     Only TWO tones carry text: `ink` and `inkMuted`. A third grey light
     enough to read as "tertiary" cannot clear 4.5:1 on white, so hierarchy
     below inkMuted is expressed with SIZE + UPPERCASE, not another colour. */
  ink: string;
  inkMuted: string;
  /** NON-TEXT ONLY — decorative icons, dividers, disabled states. */
  inkFaint: string;
  /** Decorative dividers. */
  border: string;
  /** Form-control outlines — meets the 3:1 required by WCAG 1.4.11. */
  borderStrong: string;
  borderSubtle: string;

  /* ══ 10% — brand ══ */
  /** Solid fills only. Pair with `brandOn`. */
  brand: string;
  /** Brand-coloured TEXT, icons and 1px lines. Differs from `brand` in dark
      mode, where #c0392b is only 3.47:1 on the page background. */
  brandText: string;
  brandHover: string;
  brandTint: string;
  brandRing: string;
  /** Text/icon colour to sit on top of a solid brand fill. */
  brandOn: string;

  /* ── Functional status (outside the 60/30/10 budget) ── */
  success: string;
  successTint: string;

  /* ── Deprecated aliases — kept so existing pages keep compiling ── */
  background: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderLight: string;
  accent: string;
  accentHover: string;
  accentLight: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  theme: Theme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: Palette;
  type: TypeScale;
  weight: WeightScale;
}

const lightColors: Palette = {
  bg: "#ffffff",
  surface: "#f9fafb",
  surfaceHover: "#f3f4f6",

  ink: "#111111",       // 5.21–18.88:1
  inkMuted: "#666d7a",  // 4.73–5.21:1  (was #6b7280 → 4.39:1 on hover rows)
  inkFaint: "#9ca3af",  // NON-TEXT ONLY — 2.54:1, fails AA as text
  border: "#e5e7eb",
  borderStrong: "#828994", // 3.20–3.53:1
  borderSubtle: "#f3f4f6",

  brand: "#9B1C1C",
  brandText: "#9B1C1C",
  brandHover: "#7a1515",
  brandTint: "rgba(155, 28, 28, 0.08)",
  brandRing: "rgba(155, 28, 28, 0.20)",
  brandOn: "#ffffff",

  success: "#16a34a",
  successTint: "#f0fdf4",

  // aliases — textTertiary now points at the accessible tone on purpose;
  // the old #9ca3af failed AA everywhere it was used as text.
  background: "#ffffff",
  textPrimary: "#111111",
  textSecondary: "#666d7a",
  textTertiary: "#666d7a",
  borderLight: "#f3f4f6",
  accent: "#9B1C1C",
  accentHover: "#7a1515",
  accentLight: "rgba(155, 28, 28, 0.08)",
};

const darkColors: Palette = {
  bg: "#111111",
  surface: "#1c1c1c",
  surfaceHover: "#242424",

  ink: "#f9f9f9",       // 14.74–17.94:1
  inkMuted: "#9ca3af",  // 6.11–7.44:1
  inkFaint: "#6b7280",  // NON-TEXT ONLY — 3.53:1, fails AA as text
  border: "#2a2a2a",
  borderStrong: "#757575", // 3.37–4.10:1
  borderSubtle: "#222222",

  // #c0392b is 3.47:1 on #111 — safe as a FILL behind white (5.44:1), but it
  // fails AA as text. brandText is the lifted red for red glyphs and lines.
  brand: "#c0392b",
  brandText: "#e26a5c", // 4.77–5.80:1
  brandHover: "#a93226",
  brandTint: "rgba(192, 57, 43, 0.18)",
  brandRing: "rgba(226, 106, 92, 0.30)",
  brandOn: "#ffffff",

  success: "#22c55e",
  successTint: "#052e16",

  // aliases
  background: "#111111",
  textPrimary: "#f9f9f9",
  textSecondary: "#9ca3af",
  textTertiary: "#9ca3af",
  borderLight: "#222222",
  accent: "#c0392b",
  accentHover: "#a93226",
  accentLight: "rgba(192, 57, 43, 0.18)",
};

const STORAGE_KEY = "coa-theme";

const prefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  theme: "light",
  isDark: false,
  setMode: () => {},
  toggleTheme: () => {},
  colors: lightColors,
  type,
  weight,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitialMode = (): ThemeMode => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  };

  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const theme: Theme = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Lets the browser paint native controls (scrollbars, date pickers,
    // autofill) in the matching scheme instead of always-light.
    document.documentElement.style.colorScheme = theme;

    // Tint the mobile browser chrome (Safari's toolbar, Chrome's status bar)
    // to match the page, so dark mode doesn't leave a white bar above the app.
    // The tag is created if index.html doesn't already have one, which means
    // this works whether or not the static meta tag is present.
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = isDark ? "#111111" : "#ffffff"; // matches --c-bg
  }, [theme, isDark]);

  const setMode = (next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  };

  const toggleTheme = () => {
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        isDark,
        setMode,
        toggleTheme,
        colors: isDark ? darkColors : lightColors,
        type,
        weight,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);