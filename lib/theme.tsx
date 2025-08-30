import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

type ThemeColors = {
  bg: string;
  text: string;
  inactive: string;
  active: string;
  border: string;
};

type ThemeCtx = {
  colors: ThemeColors;
  isDark: boolean;
  choice: ThemeChoice;        // what the user picked in Settings
  resolved: ResolvedScheme;   // actual scheme in use (system or override)
  setChoice: (c: ThemeChoice) => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);
const KEY = 'theme_choice';

function palette(scheme: ResolvedScheme): ThemeColors {
  return scheme === 'dark'
    ? { bg: '#000000', text: '#e5e7eb', inactive: '#9ca3af', active: '#38bdf8', border: '#1f2937' }
    : { bg: '#ffffff', text: '#111827', inactive: '#6b7280', active: '#0ea5e9', border: '#e5e7eb' };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system: ResolvedScheme = (Appearance.getColorScheme() ?? 'dark') as ResolvedScheme;
  const [choice, setChoiceState] = useState<ThemeChoice>('dark');
  const [systemScheme, setSystemScheme] = useState<ResolvedScheme>(system);

  // Load persisted choice
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(KEY);
        if (v === 'system' || v === 'light' || v === 'dark') setChoiceState(v);
      } catch {}
    })();
  }, []);

  // Listen for OS theme changes (only matters when choice === 'system')
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme ?? 'light') as ResolvedScheme);
    });
    return () => sub.remove();
  }, []);

  const setChoice = useCallback(async (c: ThemeChoice) => {
    setChoiceState(c);
    try { await AsyncStorage.setItem(KEY, c); } catch {}
  }, []);

  const resolved: ResolvedScheme = choice === 'system' ? systemScheme : (choice as ResolvedScheme);
  const colors = useMemo(() => palette(resolved), [resolved]);
  const isDark = resolved === 'dark';

  const value = useMemo(() => ({ colors, isDark, choice, resolved, setChoice }), [colors, isDark, choice, resolved, setChoice]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback (in case provider not mounted yet)
    const resolved: ResolvedScheme = (Appearance.getColorScheme() ?? 'light') as ResolvedScheme;
    return { colors: palette(resolved), isDark: resolved === 'dark', choice: 'system', resolved, setChoice: () => {} };
  }
  return ctx;
}