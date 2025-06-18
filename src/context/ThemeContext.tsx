
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'default' | 'blue' | 'pink' | 'orange';
export type Mode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_THEME_KEY = 'footyScheduleTheme';
const LOCAL_STORAGE_MODE_KEY = 'footyScheduleMode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mode, setModeState] = useState<Mode>('system');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
    const storedMode = localStorage.getItem(LOCAL_STORAGE_MODE_KEY) as Mode | null;

    if (storedTheme) {
      setThemeState(storedTheme);
    }
    if (storedMode) {
      setModeState(storedMode);
    }
  }, []);

  const applyTheme = useCallback((currentTheme: Theme, currentMode: Mode) => {
    if (!isMounted) return; // Prevent applying theme before client-side hydration

    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-default', 'theme-blue', 'theme-pink', 'theme-orange', 'light');

    if (currentTheme !== 'default') {
      root.classList.add(`theme-${currentTheme}`);
    }

    if (currentMode === 'dark') {
      root.classList.add('dark');
    } else if (currentMode === 'light') {
      root.classList.add('light'); // Explicitly add light for non-dark, non-system modes
    } else { // System mode
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    }
  }, [isMounted]);

  useEffect(() => {
    applyTheme(theme, mode);
  }, [theme, mode, applyTheme]);

  // Listener for system preference changes
  useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(theme, 'system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mode, applyTheme]);


  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
  };

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, newMode);
  };
  
  if (!isMounted) {
    // To prevent hydration mismatch, render nothing or a placeholder until mounted
    // Or, you can ensure the initial server render matches a known state (e.g., default light)
    // and then apply localStorage themes client-side. For now, children are rendered
    // but theme application is deferred until mount.
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
