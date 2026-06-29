import { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
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
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceHover: '#fafafa',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  textPrimary: '#111111',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  accent: '#9B1C1C',
  accentHover: '#7a1515',
  accentLight: '#f3e8e8',
};

const darkColors = {
  background: '#111111',
  surface: '#1c1c1c',
  surfaceHover: '#242424',
  border: '#2a2a2a',
  borderLight: '#222222',
  textPrimary: '#f9f9f9',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  accent: '#c0392b',
  accentHover: '#a93226',
  accentLight: 'rgba(192, 57, 43, 0.15)',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getInitialTheme = (): Theme => {
    // Check localStorage first (manual override)
    const stored = localStorage.getItem('coa-theme') as Theme | null;
    if (stored) return stored;
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only follow system if user hasn't manually overridden
      if (!localStorage.getItem('coa-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('coa-theme', next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        colors: theme === 'dark' ? darkColors : lightColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);