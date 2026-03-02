import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { STORAGE_KEY_THEME } from './constants';
import { darkTheme, lightTheme, type Theme } from './theme';

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setDark: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDarkState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_THEME).then((stored) => {
      if (stored !== null) {
        setIsDarkState(stored === 'true');
      }
    });
  }, []);

  const setDark = useCallback((value: boolean) => {
    setIsDarkState(value);
    AsyncStorage.setItem(STORAGE_KEY_THEME, String(value));
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
