import { createContext, useContext, useState, useEffect } from "react";

// Three modes. "system" follows the OS live; "light"/"dark" are explicit
// overrides. This is what fixes automatic dark mode: previously any stored
// value permanently blocked system-follow, so once you clicked the toggle the
// OS was ignored forever. Now "system" is a real, persistable choice.
type ThemeMode = "light" | "dark" | "system";
// The resolved theme actually applied to the UI.
type Theme = "light" | "dark";

interface ThemeContextType {
  /** The user's chosen mode: light, dark, or system. */
  mode: ThemeMode;
  /** The resolved theme after applying system preference. */
  theme: Theme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  /** Cycles light → dark → system → light. Kept for the existing toggle. */
  toggleTheme: () => void;
  colors: {
    background: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderLight: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    accentHover: string;
    accentLight: string;
  };
}

const lightColors = {
  background: "#ffffff",
  surface: "#f9fafb",
  surfaceHover: "#fafafa",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  textPrimary: "#111111",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
  accent: "#9B1C1C",
  accentHover: "#7a1515",
  accentLight: "#f3e8e8",
};

const darkColors = {
  background: "#111111",
  surface: "#1c1c1c",
  surfaceHover: "#242424",
  border: "#2a2a2a",
  borderLight: "#222222",
  textPrimary: "#f9f9f9",
  textSecondary: "#9ca3af",
  textTertiary: "#6b7280",
  accent: "#c0392b",
  accentHover: "#a93226",
  accentLight: "rgba(192, 57, 43, 0.15)",
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
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitialMode = (): ThemeMode => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Accept only known modes; anything else (including nothing) → system.
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  };

  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  // Tracked separately so a live OS change re-resolves the theme while in
  // system mode without needing a reload.
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Keep systemDark in sync with the OS, always — cheap, and it means
  // switching back to system mode is instantly correct.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const theme: Theme = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  const isDark = theme === "dark";

  // Drive the CSS. data-theme is always the *resolved* theme so stylesheets
  // never need to know about "system".
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setMode = (next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  };

  // Existing single-button toggle now cycles through all three so "system"
  // (automatic) is reachable again: light → dark → system → light.
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
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);