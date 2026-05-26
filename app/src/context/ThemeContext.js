import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT, DARK } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(Appearance.getColorScheme() || 'dark');

  useEffect(() => {
    AsyncStorage.getItem('wb_theme').then(saved => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  async function toggleTheme() {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    await AsyncStorage.setItem('wb_theme', next);
  }

  const colors = mode === 'light' ? LIGHT : DARK;
  const isDark  = mode === 'dark';

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
