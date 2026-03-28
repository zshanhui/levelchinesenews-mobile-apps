import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEY_NATIVE_LANGUAGE } from './constants';
import {
  NativeLanguage,
  NATIVE_LANGUAGE_CODES,
  parseStoredNativeLanguage,
} from './nativeLanguage';

export { NativeLanguage } from './nativeLanguage';

type NativeLanguageContextValue = {
  nativeLanguage: NativeLanguage;
  setNativeLanguage: (value: NativeLanguage) => void;
};

const NativeLanguageContext = createContext<NativeLanguageContextValue | null>(
  null,
);

export function NativeLanguageProvider({ children }: { children: ReactNode }) {
  const [nativeLanguage, setNativeLanguageState] = useState<NativeLanguage>(
    NativeLanguage.EN,
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_NATIVE_LANGUAGE).then((stored) => {
      const parsed = parseStoredNativeLanguage(stored);
      if (!parsed) return;
      setNativeLanguageState(parsed);
      if (stored && !NATIVE_LANGUAGE_CODES.has(stored)) {
        AsyncStorage.setItem(STORAGE_KEY_NATIVE_LANGUAGE, parsed);
      }
    });
  }, []);

  const setNativeLanguage = useCallback((value: NativeLanguage) => {
    setNativeLanguageState(value);
    AsyncStorage.setItem(STORAGE_KEY_NATIVE_LANGUAGE, value);
  }, []);

  const value: NativeLanguageContextValue = {
    nativeLanguage,
    setNativeLanguage,
  };

  return (
    <NativeLanguageContext.Provider value={value}>
      {children}
    </NativeLanguageContext.Provider>
  );
}

export function useNativeLanguage() {
  const ctx = useContext(NativeLanguageContext);
  if (!ctx) {
    throw new Error('useNativeLanguage must be used within NativeLanguageProvider');
  }
  return ctx;
}
