import { createContext, useContext } from "react";

/**
 * Minimal theme API so shared UI (ported from `frontend UI New`) can call `useTheme()`.
 * Default is light; wrap app with ThemeProvider later if you add dark mode to legacy.
 */
const defaultValue = { theme: "light", toggleTheme: () => {} };

const ThemeContext = createContext(defaultValue);

export function useTheme() {
  return useContext(ThemeContext);
}

export { ThemeContext };
