import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
/** Deep paths avoid `@expo-google-fonts/noto-sans-sc` barrel (pulls all ~9 weights, ~90 MB). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NotoSansSC_200ExtraLight = require('@expo-google-fonts/noto-sans-sc/200ExtraLight/NotoSansSC_200ExtraLight.ttf');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NotoSansSC_400Regular = require('@expo-google-fonts/noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf');
import { useWindowDimensions } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

/**
 * Web only: gently increase article body size on wider viewports (reading comfort on desktop).
 * Narrow / tablet widths keep scale 1; scales up toward ~1.18 on large monitors.
 */
/** Exported for article chrome (title, etc.) on web — matches body tier scaling. */
export function webArticleFontScale(screenWidth: number): number {
  if (screenWidth <= 0) return 1;
  const minW = 720;
  const maxW = 1280;
  const maxScale = 1.18;
  if (screenWidth <= minW) return 1;
  if (screenWidth >= maxW) return maxScale;
  return 1 + ((screenWidth - minW) / (maxW - minW)) * (maxScale - 1);
}

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
  /** Style to apply to Text for Chinese body (hanzi) */
  chineseFontStyle: { fontFamily?: string };
  /** Lighter weight for pinyin above characters (Noto 200) */
  chinesePinyinFontStyle: { fontFamily?: string };
  /** Bold/emphasis — same glyph source as body (no heavier weight bundled) */
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
  const { width: windowWidth } = useWindowDimensions();

  const [useNotoSansSC, setUseNotoSansSCState] = useState(true);
  const [showPinyin, setShowPinyinState] = useState(true);
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingLevel>('relaxed');
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('xl');

  const [fontsLoaded] = useFonts({
    NotoSansSC_200ExtraLight,
    NotoSansSC_400Regular,
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

  const chinesePinyinFontStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_200ExtraLight' as const }
      : {};

  const chineseFontBoldStyle =
    useNotoSansSC && fontsLoaded
      ? { fontFamily: 'NotoSansSC_400Regular' as const, fontWeight: '600' as const }
      : {};

  const fancyDisplayFontStyle = fontsLoaded
    ? { fontFamily: 'PlayfairDisplay_600SemiBold' as const }
    : {};

  const articleFontSize = useMemo(() => {
    const base = FONT_SIZE_MAP[fontSize];
    return Math.round(base * webArticleFontScale(windowWidth));
  }, [fontSize, windowWidth]);

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
    chinesePinyinFontStyle,
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
