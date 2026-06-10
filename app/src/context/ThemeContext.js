import React, { createContext, useContext } from 'react';
import { DARK } from '../theme';

const ThemeContext = createContext(null);

// App is locked to dark mode — consistent across all screens and system settings
export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ colors: DARK, isDark: true, mode: 'dark', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
