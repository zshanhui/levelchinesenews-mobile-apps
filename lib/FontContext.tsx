import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
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
import { Platform } from 'react-native';
import {
  STORAGE_KEY_FONT_SIZE,
  STORAGE_KEY_LINE_SPACING,
  STORAGE_KEY_PINYIN,
  STORAGE_KEY_WORD_HIGHLIGHT,
} from './constants';
import {
  type ArticleFontId,
  type RemoteFontId,
} from './fonts/remoteFonts';
import {
  useArticleFont,
  type ArticleFontOption,
  type RemoteFontStatus,
} from './fonts/useArticleFont';

export type { ArticleFontOption, RemoteFontStatus };

export type LineSpacingLevel = 'compact' | 'normal' | 'relaxed';
export type FontSizeLevel = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Minor third (×1.2) scale anchored at md = 18px. */
export const ARTICLE_FONT_SIZE_MAP: Record<FontSizeLevel, number> = {
  xs: 13,
  sm: 15,
  md: 18,
  lg: 22,
  xl: 26,
};

/** OS default for article content when bundled Noto Sans SC is off. */
export const systemArticleContentFontLabel =
  Platform.select({
    ios: 'PingFang SC',
    android: 'Android Default',
    default: 'System',
  }) ?? 'System';

export const bundledArticleContentFontLabel = 'Noto Sans SC';

type FontContextValue = {
  /** Whether to use Noto Sans SC for Chinese text */
  useNotoSansSC: boolean;
  setUseNotoSansSC: (value: boolean) => void;
  /** Whether to show Pinyin above Chinese words in article view */
  showPinyin: boolean;
  setShowPinyin: (value: boolean) => void;
  /** Whether to draw corner brackets around the tapped word in article view */
  showWordHighlight: boolean;
  setShowWordHighlight: (value: boolean) => void;
  /** Line spacing level for article content */
  lineSpacing: LineSpacingLevel;
  setLineSpacing: (value: LineSpacingLevel) => void;
  /** Font size level for article content */
  fontSize: FontSizeLevel;
  setFontSize: (value: FontSizeLevel) => void;
  /** Style to apply to article content body text (hanzi) */
  articleContentFontStyle: { fontFamily?: string };
  /** Lighter weight for pinyin above characters in article content (Noto 200) */
  articleContentPinyinFontStyle: { fontFamily?: string };
  /** Bold/emphasis in article content — same glyph source as body (no heavier weight bundled) */
  articleContentFontBoldStyle: { fontFamily?: string };
  /** Playfair Display semibold for decorative UI (e.g. Load more) */
  fancyDisplayFontStyle: { fontFamily?: string };
  /** Resolved numeric font size for article content */
  articleFontSize: number;
  /** Whether fonts are ready (when useNotoSansSC is true) */
  fontsReady: boolean;
  selectedArticleFontId: ArticleFontId;
  articleFontOptions: ArticleFontOption[];
  selectArticleFont: (fontId: ArticleFontId) => Promise<void>;
  downloadArticleFont: (fontId: RemoteFontId) => Promise<void>;
  clearRemoteFonts: () => Promise<void>;
};

const FontContext = createContext<FontContextValue | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const articleFont = useArticleFont(systemArticleContentFontLabel);
  const [showPinyin, setShowPinyinState] = useState(true);
  const [showWordHighlight, setShowWordHighlightState] = useState(true);
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingLevel>('normal');
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('md');

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_PINYIN).then((stored) => {
      if (stored !== null) {
        setShowPinyinState(stored === 'true');
      }
    });
    AsyncStorage.getItem(STORAGE_KEY_WORD_HIGHLIGHT).then((stored) => {
      if (stored !== null) {
        setShowWordHighlightState(stored === 'true');
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

  const setShowPinyin = useCallback((value: boolean) => {
    setShowPinyinState(value);
    AsyncStorage.setItem(STORAGE_KEY_PINYIN, String(value));
  }, []);

  const setShowWordHighlight = useCallback((value: boolean) => {
    setShowWordHighlightState(value);
    AsyncStorage.setItem(STORAGE_KEY_WORD_HIGHLIGHT, String(value));
  }, []);

  const setLineSpacing = useCallback((value: LineSpacingLevel) => {
    setLineSpacingState(value);
    AsyncStorage.setItem(STORAGE_KEY_LINE_SPACING, value);
  }, []);

  const setFontSize = useCallback((value: FontSizeLevel) => {
    setFontSizeState(value);
    AsyncStorage.setItem(STORAGE_KEY_FONT_SIZE, value);
  }, []);

  const fancyDisplayFontStyle = fontsLoaded
    ? { fontFamily: 'PlayfairDisplay_600SemiBold' as const }
    : {};

  const articleFontSize = useMemo(
    () => ARTICLE_FONT_SIZE_MAP[fontSize],
    [fontSize],
  );

  const value: FontContextValue = {
    useNotoSansSC: articleFont.useNotoSansSC,
    setUseNotoSansSC: articleFont.setUseNotoSansSC,
    showPinyin,
    setShowPinyin,
    showWordHighlight,
    setShowWordHighlight,
    lineSpacing,
    setLineSpacing,
    fontSize,
    setFontSize,
    articleContentFontStyle: articleFont.articleContentFontStyle,
    articleContentPinyinFontStyle: articleFont.articleContentPinyinFontStyle,
    articleContentFontBoldStyle: articleFont.articleContentFontBoldStyle,
    fancyDisplayFontStyle,
    articleFontSize,
    fontsReady: articleFont.fontsReady,
    selectedArticleFontId: articleFont.selectedArticleFontId,
    articleFontOptions: articleFont.articleFontOptions,
    selectArticleFont: articleFont.selectArticleFont,
    downloadArticleFont: articleFont.downloadArticleFont,
    clearRemoteFonts: articleFont.clearRemoteFonts,
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
