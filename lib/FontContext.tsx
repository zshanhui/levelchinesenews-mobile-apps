import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import {
  NotoSansSC_400Regular,
  NotoSansSC_600SemiBold,
} from '@expo-google-fonts/noto-sans-sc';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  STORAGE_KEY_FONT,
  STORAGE_KEY_FONT_SIZE,
  STORAGE_KEY_LINE_SPACING,
  STORAGE_KEY_PINYIN,
} from './constants';

export type LineSpacingLevel = 'compact' | 'normal' | 'relaxed';
export type FontSizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const FONT_SIZE_MAP: Record<FontSizeLevel, number> = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 22,
};

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
  /** Font size level for article content */
  fontSize: FontSizeLevel;
  setFontSize: (value: FontSizeLevel) => void;
  /** Style to apply to Text for Chinese content */
  chineseFontStyle: { fontFamily?: string };
  /** Bold variant for headings */
  chineseFontBoldStyle: { fontFamily?: string };
  /** Playfair Display semibold for decorative UI (e.g. Load more) */
  fancyDisplayFontStyle: { fontFamily?: string };
  /** Resolved numeric font size for article content */
  articleFontSize: number;
  /** Whether fonts are ready (when useNotoSansSC is true) */
  fontsReady: boolean;
};

const FontContext = createContext<FontContextValue | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [useNotoSansSC, setUseNotoSansSCState] = useState(
    Platform.OS === 'android' ? false : true,
  );
  const [showPinyin, setShowPinyinState] = useState(true);
  /** Web: Noto (non-Android default), 22px (xl), relaxed — until AsyncStorage overrides. */
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingLevel>(
    Platform.OS === 'web' ? 'relaxed' : 'normal',
  );
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>(
    Platform.OS === 'web' ? 'xl' : 'md',
  );

  const [fontsLoaded] = useFonts({
    NotoSansSC_400Regular,
    NotoSansSC_600SemiBold,
    PlayfairDisplay_600SemiBold,
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_FONT_SIZE).then((stored) => {
      if (stored === 'xs' || stored === 'sm' || stored === 'md' || stored === 'lg' || stored === 'xl') {
        setFontSizeState(stored);
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

  const setFontSize = useCallback((value: FontSizeLevel) => {
    setFontSizeState(value);
    AsyncStorage.setItem(STORAGE_KEY_FONT_SIZE, value);
  }, []);

  const chineseFontStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_400Regular' as const }
      : {};

  const chineseFontBoldStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_600SemiBold' as const }
      : {};

  const fancyDisplayFontStyle = fontsLoaded
    ? { fontFamily: 'PlayfairDisplay_600SemiBold' as const }
    : {};

  const articleFontSize = FONT_SIZE_MAP[fontSize];

  const value: FontContextValue = {
    useNotoSansSC,
    setUseNotoSansSC,
    showPinyin,
    setShowPinyin,
    lineSpacing,
    setLineSpacing,
    fontSize,
    setFontSize,
    chineseFontStyle,
    chineseFontBoldStyle,
    fancyDisplayFontStyle,
    articleFontSize,
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
