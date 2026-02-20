import {
  NotoSansSC_400Regular,
  NotoSansSC_600SemiBold,
} from '@expo-google-fonts/noto-sans-sc';
import { useFonts } from '@expo-google-fonts/noto-sans-sc/useFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const STORAGE_KEY_FONT = '@lcn/useNotoSansSC';
const STORAGE_KEY_PINYIN = '@lcn/showPinyin';
const STORAGE_KEY_LINE_SPACING = '@lcn/lineSpacing';

export type LineSpacingLevel = 'compact' | 'normal' | 'relaxed';

type FontContextValue = {
  /** Whether to use Noto Sans SC for Chinese text */
  useNotoSansSC: boolean;
  setUseNotoSansSC: (value: boolean) => void;
  /** Whether to show Pinyin above Chinese words in article view */
  showPinyin: boolean;
  setShowPinyin: (value: boolean) => void;
  /** Line spacing level for article content */
  lineSpacing: LineSpacingLevel;
  setLineSpacing: (value: LineSpacingLevel) => void;
  /** Style to apply to Text for Chinese content */
  chineseFontStyle: { fontFamily?: string };
  /** Bold variant for headings */
  chineseFontBoldStyle: { fontFamily?: string };
  /** Whether fonts are ready (when useNotoSansSC is true) */
  fontsReady: boolean;
};

const FontContext = createContext<FontContextValue | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [useNotoSansSC, setUseNotoSansSCState] = useState(true);
  const [showPinyin, setShowPinyinState] = useState(true);
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingLevel>('normal');

  const [fontsLoaded] = useFonts({
    NotoSansSC_400Regular,
    NotoSansSC_600SemiBold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_FONT).then((stored) => {
      if (stored !== null) {
        setUseNotoSansSCState(stored === 'true');
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_PINYIN).then((stored) => {
      if (stored !== null) {
        setShowPinyinState(stored === 'true');
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_LINE_SPACING).then((stored) => {
      if (stored === 'compact' || stored === 'normal' || stored === 'relaxed') {
        setLineSpacingState(stored);
      }
    });
  }, []);

  const setUseNotoSansSC = useCallback((value: boolean) => {
    setUseNotoSansSCState(value);
    AsyncStorage.setItem(STORAGE_KEY_FONT, String(value));
  }, []);

  const setShowPinyin = useCallback((value: boolean) => {
    setShowPinyinState(value);
    AsyncStorage.setItem(STORAGE_KEY_PINYIN, String(value));
  }, []);

  const setLineSpacing = useCallback((value: LineSpacingLevel) => {
    setLineSpacingState(value);
    AsyncStorage.setItem(STORAGE_KEY_LINE_SPACING, value);
  }, []);

  const chineseFontStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_400Regular' as const }
      : {};

  const chineseFontBoldStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_600SemiBold' as const }
      : {};

  const value: FontContextValue = {
    useNotoSansSC,
    setUseNotoSansSC,
    showPinyin,
    setShowPinyin,
    lineSpacing,
    setLineSpacing,
    chineseFontStyle,
    chineseFontBoldStyle,
    fontsReady: !useNotoSansSC || fontsLoaded,
  };

  return (
    <FontContext.Provider value={value}>{children}</FontContext.Provider>
  );
}

export function useFont() {
  const ctx = useContext(FontContext);
  if (!ctx) throw new Error('useFont must be used within FontProvider');
  return ctx;
}
