import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoFont from 'expo-font';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  STORAGE_KEY_ARTICLE_FONT,
  STORAGE_KEY_FONT,
} from '../constants';
import {
  clearDownloadedRemoteFonts,
  downloadRemoteFont,
  getDownloadedRemoteFontSources,
} from './remoteFontStorage';
import {
  NOTO_SANS_SC_FONT_ID,
  SYSTEM_ARTICLE_FONT_ID,
  getRemoteArticleFont,
  getRemoteFontDownloadSizeBytes,
  remoteArticleFonts,
  type ArticleFontId,
  type RemoteFontDescriptor,
  type RemoteFontId,
} from './remoteFonts';

export type RemoteFontStatus = 'idle' | 'downloading' | 'ready' | 'failed';

export type ArticleFontOption = {
  id: ArticleFontId;
  label: string;
  isRemote: boolean;
  isSelected: boolean;
  status: RemoteFontStatus;
  downloadSizeBytes?: number;
  error?: string;
};

export type ArticleFontState = {
  useNotoSansSC: boolean;
  setUseNotoSansSC: (value: boolean) => void;
  articleContentFontStyle: { fontFamily?: string };
  articleContentPinyinFontStyle: { fontFamily?: string };
  articleContentFontBoldStyle: { fontFamily?: string; fontWeight?: '600' };
  fontsReady: boolean;
  selectedArticleFontId: ArticleFontId;
  articleFontOptions: ArticleFontOption[];
  selectArticleFont: (fontId: ArticleFontId) => Promise<void>;
  downloadArticleFont: (fontId: RemoteFontId) => Promise<void>;
  clearRemoteFonts: () => Promise<void>;
};

function createInitialRemoteFontStatuses(): Record<RemoteFontId, RemoteFontStatus> {
  return remoteArticleFonts.reduce((acc, font) => {
    acc[font.id] = 'idle';
    return acc;
  }, {} as Record<RemoteFontId, RemoteFontStatus>);
}

export function useArticleFont(
  systemArticleContentFontLabel: string,
): ArticleFontState {
  const [selectedArticleFontId, setSelectedArticleFontId] =
    useState<ArticleFontId>(SYSTEM_ARTICLE_FONT_ID);
  const [remoteFontStatuses, setRemoteFontStatuses] = useState(
    createInitialRemoteFontStatuses,
  );
  const [remoteFontErrors, setRemoteFontErrors] = useState<
    Partial<Record<RemoteFontId, string>>
  >({});
  const [isInitializingFonts, setIsInitializingFonts] = useState(true);

  const setRemoteFontStatus = useCallback(
    (fontId: RemoteFontId, status: RemoteFontStatus) => {
      setRemoteFontStatuses((current) => ({
        ...current,
        [fontId]: status,
      }));
    },
    [],
  );

  const setRemoteFontError = useCallback(
    (fontId: RemoteFontId, error?: string) => {
      setRemoteFontErrors((current) => ({
        ...current,
        [fontId]: error,
      }));
    },
    [],
  );

  const loadRemoteFontSources = useCallback(
    async (
      font: RemoteFontDescriptor,
      sources: Record<string, string>,
    ): Promise<void> => {
      // Downloaded font files still need to be registered with Expo Font
      // every time the app process starts.
      const requiredFamiliesLoaded = font.files.every((file) =>
        ExpoFont.isLoaded(file.family),
      );

      if (!requiredFamiliesLoaded) {
        setRemoteFontStatus(font.id, 'downloading');
        await ExpoFont.loadAsync(sources);
      }

      setRemoteFontStatus(font.id, 'ready');
      setRemoteFontError(font.id);
    },
    [setRemoteFontError, setRemoteFontStatus],
  );

  const selectSystemArticleFont = useCallback(async () => {
    setSelectedArticleFontId(SYSTEM_ARTICLE_FONT_ID);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_ARTICLE_FONT, SYSTEM_ARTICLE_FONT_ID),
      AsyncStorage.setItem(STORAGE_KEY_FONT, 'false'),
    ]);
  }, []);

  const saveSelectedRemoteFont = useCallback(
    async (font: RemoteFontDescriptor) => {
      setSelectedArticleFontId(font.id);
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_ARTICLE_FONT, font.id),
        // Keep the old boolean preference in sync for code paths or installs
        // that still know the article font choice as "use Noto".
        AsyncStorage.setItem(
          STORAGE_KEY_FONT,
          String(font.id === NOTO_SANS_SC_FONT_ID),
        ),
      ]);
    },
    [],
  );

  const downloadArticleFont = useCallback(
    async (fontId: RemoteFontId) => {
      const font = getRemoteArticleFont(fontId);
      if (!font) return;

      setRemoteFontStatus(font.id, 'downloading');
      setRemoteFontError(font.id);

      try {
        const sources = await downloadRemoteFont(font);
        await loadRemoteFontSources(font, sources);
        await saveSelectedRemoteFont(font);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setRemoteFontStatus(font.id, 'failed');
        setRemoteFontError(font.id, message);
        console.warn('Failed to download remote font:', err);
      }
    },
    [
      loadRemoteFontSources,
      saveSelectedRemoteFont,
      setRemoteFontError,
      setRemoteFontStatus,
    ],
  );

  const selectArticleFont = useCallback(
    async (fontId: ArticleFontId) => {
      if (fontId === SYSTEM_ARTICLE_FONT_ID) {
        await selectSystemArticleFont();
        return;
      }

      const font = getRemoteArticleFont(fontId);
      if (!font) return;

      try {
        const sources = await getDownloadedRemoteFontSources(font);
        if (!sources) {
          await downloadArticleFont(font.id);
          return;
        }

        await loadRemoteFontSources(font, sources);
        await saveSelectedRemoteFont(font);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setRemoteFontStatus(font.id, 'failed');
        setRemoteFontError(font.id, message);
        console.warn('Failed to select remote font:', err);
      }
    },
    [
      downloadArticleFont,
      loadRemoteFontSources,
      saveSelectedRemoteFont,
      selectSystemArticleFont,
      setRemoteFontError,
      setRemoteFontStatus,
    ],
  );

  const clearRemoteFonts = useCallback(async () => {
    await clearDownloadedRemoteFonts();
    setSelectedArticleFontId(SYSTEM_ARTICLE_FONT_ID);
    setRemoteFontStatuses(createInitialRemoteFontStatuses());
    setRemoteFontErrors({});
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_ARTICLE_FONT, SYSTEM_ARTICLE_FONT_ID),
      AsyncStorage.setItem(STORAGE_KEY_FONT, 'false'),
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeSelectedFont() {
      try {
        const storedFontId =
          (await AsyncStorage.getItem(STORAGE_KEY_ARTICLE_FONT)) ??
          SYSTEM_ARTICLE_FONT_ID;

        const font = getRemoteArticleFont(storedFontId);
        if (!font) {
          if (!cancelled) {
            setSelectedArticleFontId(SYSTEM_ARTICLE_FONT_ID);
          }
          return;
        }

        const sources = await getDownloadedRemoteFontSources(font);
        if (!sources) {
          // A saved remote selection should never block app startup; fall back
          // to the system font if the on-disk cache was cleared or corrupted.
          if (!cancelled) {
            setRemoteFontStatus(font.id, 'idle');
            setSelectedArticleFontId(SYSTEM_ARTICLE_FONT_ID);
          }
          return;
        }

        if (!cancelled) {
          setRemoteFontStatus(font.id, 'downloading');
        }
        await loadRemoteFontSources(font, sources);
        if (!cancelled) {
          setSelectedArticleFontId(font.id);
        }
      } catch (err) {
        console.warn('Failed to initialize selected article font:', err);
        if (!cancelled) {
          setSelectedArticleFontId(SYSTEM_ARTICLE_FONT_ID);
        }
      } finally {
        if (!cancelled) {
          setIsInitializingFonts(false);
        }
      }
    }

    initializeSelectedFont();

    return () => {
      cancelled = true;
    };
  }, [loadRemoteFontSources, setRemoteFontStatus]);

  useEffect(() => {
    remoteArticleFonts.forEach((font) => {
      // Populate settings UI with "already downloaded" state even when the
      // user has not selected that font in this session.
      getDownloadedRemoteFontSources(font)
        .then((sources) => {
          if (sources) {
            setRemoteFontStatuses((current) => {
              if (
                current[font.id] === 'ready' ||
                current[font.id] === 'downloading'
              ) {
                return current;
              }
              return {
                ...current,
                [font.id]: 'ready',
              };
            });
          }
        })
        .catch(() => {
          // Keep the option downloadable if local inspection fails.
        });
    });
  }, []);

  const setUseNotoSansSC = useCallback(
    (value: boolean) => {
      void selectArticleFont(
        value ? NOTO_SANS_SC_FONT_ID : SYSTEM_ARTICLE_FONT_ID,
      );
    },
    [selectArticleFont],
  );

  const selectedRemoteFont = getRemoteArticleFont(selectedArticleFontId);
  const selectedRemoteFontLoaded =
    selectedRemoteFont != null &&
    remoteFontStatuses[selectedRemoteFont.id] === 'ready';
  const useNotoSansSC =
    selectedArticleFontId === NOTO_SANS_SC_FONT_ID && selectedRemoteFontLoaded;

  const articleContentFontStyle =
    selectedRemoteFont && selectedRemoteFontLoaded
      ? { fontFamily: selectedRemoteFont.families.body }
      : {};

  const articleContentPinyinFontStyle =
    selectedRemoteFont?.families.pinyin && selectedRemoteFontLoaded
      ? { fontFamily: selectedRemoteFont.families.pinyin }
      : {};

  const articleContentFontBoldStyle =
    selectedRemoteFont && selectedRemoteFontLoaded
      ? {
        fontFamily:
          selectedRemoteFont.families.bold ?? selectedRemoteFont.families.body,
        fontWeight: '600' as const,
      }
      : {};

  const articleFontOptions = useMemo<ArticleFontOption[]>(
    () => [
      {
        id: SYSTEM_ARTICLE_FONT_ID,
        label: systemArticleContentFontLabel,
        isRemote: false,
        isSelected: selectedArticleFontId === SYSTEM_ARTICLE_FONT_ID,
        status: 'ready',
      },
      ...remoteArticleFonts.map((font) => ({
        id: font.id,
        label: font.label,
        isRemote: true,
        isSelected:
          selectedArticleFontId === font.id &&
          remoteFontStatuses[font.id] === 'ready',
        status: remoteFontStatuses[font.id],
        downloadSizeBytes: getRemoteFontDownloadSizeBytes(font),
        error: remoteFontErrors[font.id],
      })),
    ],
    [
      remoteFontErrors,
      remoteFontStatuses,
      selectedArticleFontId,
      systemArticleContentFontLabel,
    ],
  );

  return {
    useNotoSansSC,
    setUseNotoSansSC,
    articleContentFontStyle,
    articleContentPinyinFontStyle,
    articleContentFontBoldStyle,
    fontsReady:
      !isInitializingFonts &&
      (selectedArticleFontId === SYSTEM_ARTICLE_FONT_ID ||
        selectedRemoteFontLoaded),
    selectedArticleFontId,
    articleFontOptions,
    selectArticleFont,
    downloadArticleFont,
    clearRemoteFonts,
  };
}
