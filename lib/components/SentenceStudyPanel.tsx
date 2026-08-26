import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextLayoutEvent,
  type TextStyle,
} from 'react-native';
import { i18n, useTranslation } from '../i18n';
import { getTotalLcnDictEntriesCount } from '../localDatabase';
import { useTheme } from '../ThemeContext';
import {
  resolveDictLookup,
  type DictLookupMatch,
} from '../useLocalDictService';
import type { Theme } from '../theme';

const showPlecoButton = true;
const useOptimisticPlecoOpen = true;

const plecoLogoSource = require('../../assets/component-image-assets/pleco-logo.jpg');

const STUDY_PANEL_ENTER_MS = 280;

/** Smaller = easier to dismiss by dragging down (px). */
const STUDY_PANEL_DISMISS_DRAG_PX = 72;
/** Downward velocity above this (px/ms) can dismiss with a short flick. */
const STUDY_PANEL_DISMISS_VY = 0.42;
/** Minimum drag distance when using velocity-only dismiss. */
const STUDY_PANEL_DISMISS_VY_MIN_DY = 22;

/** Definitions longer than this many lines collapse with an ellipsis; tap to expand/collapse. */
const DEFINITION_MAX_LINES = 3;

/** A word with multiple dict entries (polyphonic 行/重/得) shows this many entry
 * lines by default; "show more" reveals the rest. */
const DEFAULT_VISIBLE_ENTRY_LINES_MAX = 2;

/**
 * Dictionary definition capped at DEFINITION_MAX_LINES. A hidden (absolute, opacity-0) clone
 * measures the untruncated line count; when it exceeds the cap, the visible text truncates
 * and tapping toggles between full length and collapsed.
 */
function ExpandableDefinitionText({
  text,
  textStyle,
}: {
  text: string;
  textStyle: StyleProp<TextStyle>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const onFullTextLayout = useCallback((e: TextLayoutEvent) => {
    setNeedsTruncation(e.nativeEvent.lines.length > DEFINITION_MAX_LINES);
  }, []);

  const onPress = useCallback(() => {
    setExpanded((v) => !v);
  }, []);

  return (
    <Pressable
      onPress={onPress}
      disabled={!needsTruncation}
      accessibilityRole={needsTruncation ? 'button' : 'text'}
      accessibilityLabel={text}
    >
      <View>
        <Text
          style={textStyle}
          numberOfLines={expanded || !needsTruncation ? undefined : DEFINITION_MAX_LINES}
        >
          {text}
        </Text>
        {/* Hidden measurement clone — same width/styles, never truncated. */}
        <Text
          style={[textStyle, hiddenMeasureStyle]}
          onTextLayout={onFullTextLayout}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          {text}
        </Text>
      </View>
    </Pressable>
  );
}

const hiddenMeasureStyle: TextStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  opacity: 0,
};

export type SentenceStudyPanelProps = {
  word: string;
  pinyin: string | null;
  articleId: string;
  highlightedWordKey: string;
  highlightedSentenceKey: string;
  bottomInset: number;
  /** Called after the panel finishes sliding off-screen (downward dismiss). */
  onRequestClose?: () => void;
};

function buildPlecoUrl(
  word: string,
  pinyin: string | null,
  articleId: string,
  wordKey: string,
  sentenceKey: string
): string {
  const returnParams = new URLSearchParams({ word, wordKey, sentenceKey });
  const xSuccess = `lcn://article/${articleId}?${returnParams.toString()}`;

  const useSearch = word.length >= 2;
  const baseParams: Record<string, string> = {
    'x-source': i18n.t('plecoSource'),
    'x-success': xSuccess,
  };

  if (useSearch) {
    baseParams.q = word;
    return `plecoapi://x-callback-url/s?${new URLSearchParams(baseParams).toString()}`;
  }

  const dfParams = new URLSearchParams({ hw: word, ...baseParams });
  if (pinyin) dfParams.set('py', pinyin);
  return `plecoapi://x-callback-url/df?${dfParams.toString()}`;
}

export function SentenceStudyPanel({
  word,
  pinyin,
  articleId,
  highlightedWordKey,
  highlightedSentenceKey,
  bottomInset,
  onRequestClose,
}: SentenceStudyPanelProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [dictMatches, setDictMatches] = useState<DictLookupMatch[]>([]);
  const [lookupComplete, setLookupComplete] = useState(false);
  /** True after tapping "show more": reveal all entries instead of the default cap. */
  const [entriesExpanded, setEntriesExpanded] = useState(false);
  const [hasLocalDictData, setHasLocalDictData] = useState<boolean | null>(null);
  const [isPlecoInstalled, setIsPlecoInstalled] = useState(false);
  const stackPinyinUnderWord = word.length >= 4;

  /** Starts below the fold; slides up only when opening from a closed panel (mount or remount). */
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const dragStartRef = useRef(0);
  const onRequestCloseRef = useRef(onRequestClose);
  onRequestCloseRef.current = onRequestClose;
  /** False until the enter animation has run once for this mounted panel. */
  const hasPlayedEnterAnimationRef = useRef(false);

  useEffect(() => {
    translateY.stopAnimation();
    if (!hasPlayedEnterAnimationRef.current) {
      hasPlayedEnterAnimationRef.current = true;
      translateY.setValue(windowHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: STUDY_PANEL_ENTER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      translateY.setValue(0);
    }
  }, [word, translateY, windowHeight]);

  const dismissThreshold = useMemo(
    () =>
      Math.min(
        STUDY_PANEL_DISMISS_DRAG_PX,
        Math.max(48, windowHeight * 0.14),
      ),
    [windowHeight],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation((val) => {
            dragStartRef.current = Number.isFinite(val) ? val : 0;
          });
        },
        onPanResponderMove: (_, g) => {
          const y = Math.max(0, dragStartRef.current + g.dy);
          translateY.setValue(y);
        },
        onPanResponderRelease: (_, g) => {
          const y = Math.max(0, dragStartRef.current + g.dy);
          const close =
            onRequestCloseRef.current &&
            (y > dismissThreshold ||
              (g.vy > STUDY_PANEL_DISMISS_VY && y > STUDY_PANEL_DISMISS_VY_MIN_DY));
          if (close) {
            Animated.timing(translateY, {
              toValue: windowHeight,
              duration: STUDY_PANEL_ENTER_MS,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) {
                onRequestCloseRef.current?.();
              }
            });
          } else {
            dragStartRef.current = 0;
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: false,
              friction: 7,
              tension: 78,
            }).start();
          }
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [dismissThreshold, translateY, windowHeight],
  );

  useEffect(() => {
    let cancelled = false;
    setDictMatches([]);
    setLookupComplete(false);
    setHasLocalDictData(null);
    setEntriesExpanded(false);
    const runLookup = async () => {
      try {
        const [lookupResult, totalCount] = await Promise.all([
          resolveDictLookup(word),
          getTotalLcnDictEntriesCount(),
        ]);
        if (cancelled) return;
        setDictMatches(lookupResult.matches);
        setHasLocalDictData(totalCount > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn(`Study panel lookup warning for "${word}":`, err);
        setDictMatches([]);
        setHasLocalDictData(false);
      } finally {
        if (!cancelled) {
          setLookupComplete(true);
        }
      }
    };
    void runLookup();
    return () => {
      cancelled = true;
    };
  }, [word]);

  useEffect(() => {
    if (!showPlecoButton) {
      setIsPlecoInstalled(false);
      return;
    }
    if (useOptimisticPlecoOpen) {
      setIsPlecoInstalled(true);
    };
  }, []);

  const openInPleco = useCallback(async () => {
    const url = buildPlecoUrl(
      word,
      pinyin,
      articleId,
      highlightedWordKey,
      highlightedSentenceKey
    );
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL('https://www.pleco.com?from=levelchinesenews.app');
    }
  }, [word, pinyin, articleId, highlightedWordKey, highlightedSentenceKey]);

  const openLocalDictSettings = useCallback(() => {
    router.push('/settings/localdict');
  }, [router]);

  const showMissingDictSetup = lookupComplete && !hasLocalDictData;
  const showDefinitionText =
    !lookupComplete ||
    dictMatches.some((match) => match.entries.some((entry) => Boolean(entry.definitions)));
  const showSplitMatches = dictMatches.length > 1;
  const singleMatch = dictMatches[0] ?? null;
  const singleMatchEntries = singleMatch?.entries ?? [];
  // Longer definitions first — richer senses surface before terse ones.
  const sortedSingleEntries = [...singleMatchEntries].sort(
    (a, b) => (b.definitions?.length ?? 0) - (a.definitions?.length ?? 0),
  );
  const visibleSingleEntries = entriesExpanded
    ? sortedSingleEntries
    : sortedSingleEntries.slice(0, DEFAULT_VISIBLE_ENTRY_LINES_MAX);
  const hiddenSingleEntryCount = sortedSingleEntries.length - visibleSingleEntries.length;
  /** Tighten list + header spacing when many sub-word lines would make the panel very tall. */
  const compactMultiSplit = dictMatches.length >= 3;

  return (
    <Animated.View
      style={[
        styles.panelOuter,
        {
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.dragHandleTrack}>
        <View style={styles.dragHandle} />
      </View>
      <View
        style={[
          styles.panel,
          compactMultiSplit && styles.panelCompact,
          { paddingBottom: Math.max(bottomInset, 16) },
        ]}
      >
      <View style={[styles.panelHeader, compactMultiSplit && styles.panelHeaderCompact]}>
        <View
          style={[
            styles.panelHeaderContent,
            stackPinyinUnderWord ? styles.panelHeaderContentStacked : null,
            stackPinyinUnderWord && compactMultiSplit
              ? styles.panelHeaderContentStackedCompact
              : null,
          ]}
        >
          <Text
            style={[
              styles.panelWord,
              compactMultiSplit && styles.panelWordCompact,
            ]}
          >
            {word}
          </Text>
          {pinyin ? (
            <Text
              style={[
                styles.panelPinyin,
                stackPinyinUnderWord ? styles.panelPinyinUnderWord : null,
                compactMultiSplit && styles.panelPinyinCompact,
              ]}
            >
              {pinyin}
            </Text>
          ) : null}
        </View>
        <View style={styles.panelHeaderRight}>
          {showPlecoButton ? (
            <Pressable
              onPress={() => {
                void openInPleco();
              }}
              style={({ pressed }) => [
                styles.plecoButton,
                compactMultiSplit && styles.plecoButtonCompact,
                pressed && styles.plecoButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isPlecoInstalled ? t('openInPleco') : t('openPlecoWebsite')
              }
            >
              <Image
                source={plecoLogoSource}
                style={[
                  styles.plecoLogo,
                  compactMultiSplit && styles.plecoLogoCompact,
                ]}
                resizeMode="cover"
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      {showMissingDictSetup || showDefinitionText ? (
        <View
          style={[styles.panelDefinition, compactMultiSplit && styles.panelDefinitionCompact]}
        >
          {showMissingDictSetup ? (
            <View style={styles.panelDefinitionMissingDict}>
              <Text
                style={[
                  styles.panelDefinitionText,
                  styles.panelDefinitionTextMissing,
                ]}
              >
                {t('loadLocalDictFirstHint')}
              </Text>
              <Pressable onPress={openLocalDictSettings} accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    style={[
                      styles.panelDefinitionLinkRow,
                      pressed && styles.panelDefinitionLinkRowPressed,
                    ]}
                  >
                    <Text style={styles.panelDefinitionLink}>{t('setupLocalDict')}</Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={14}
                      color={theme.accent}
                    />
                  </View>
                )}
              </Pressable>
            </View>
          ) : showSplitMatches ? (
            <View
              style={[
                styles.panelDefinitionList,
                compactMultiSplit && styles.panelDefinitionListCompact,
              ]}
            >
              {dictMatches.map((match, idx) => (
                <View
                  key={`${match.lookupText}:${match.entries[0]?.id ?? idx}`}
                  style={[
                    styles.panelDefinitionItem,
                    compactMultiSplit && styles.panelDefinitionItemCompact,
                    idx > 0
                      ? [
                          styles.panelDefinitionItemDivider,
                          compactMultiSplit && styles.panelDefinitionItemDividerCompact,
                        ]
                      : null,
                  ]}
                >
                  <View
                    style={[
                      styles.panelDefinitionItemHeader,
                      compactMultiSplit && styles.panelDefinitionItemHeaderCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.panelDefinitionItemWord,
                        compactMultiSplit && styles.panelDefinitionItemWordCompact,
                      ]}
                    >
                      {match.lookupText}
                    </Text>
                    {match.entries[0]?.pinyin ? (
                      <Text
                        style={[
                          styles.panelDefinitionItemPinyin,
                          compactMultiSplit && styles.panelDefinitionItemPinyinCompact,
                        ]}
                      >
                        {match.entries[0]?.pinyin}
                      </Text>
                    ) : null}
                  </View>
                  <ExpandableDefinitionText
                    text={match.entries[0]?.definitions ?? ''}
                    textStyle={[
                      styles.panelDefinitionText,
                      compactMultiSplit && styles.panelDefinitionTextSplitCompact,
                      styles.panelDefinitionTextLoaded,
                    ]}
                  />
                </View>
              ))}
            </View>
          ) : singleMatchEntries.length > 0 ? (
            // One line per dict entry (polyphonic words have several); default cap
            // of DEFAULT_VISIBLE_ENTRY_LINES_MAX until "show more" is tapped.
            <View style={styles.panelDefinitionList}>
              {visibleSingleEntries.map((entry, idx) => (
                <View
                  key={entry.id}
                  style={[
                    styles.panelDefinitionItem,
                    idx > 0 ? styles.panelDefinitionItemDivider : null,
                  ]}
                >
                  {entry.pinyin ? (
                    <Text style={styles.panelDefinitionItemPinyin}>{entry.pinyin}</Text>
                  ) : null}
                  <ExpandableDefinitionText
                    text={entry.definitions}
                    textStyle={[
                      styles.panelDefinitionText,
                      styles.panelDefinitionTextLoaded,
                    ]}
                  />
                </View>
              ))}
              {hiddenSingleEntryCount > 0 ? (
                <Pressable
                  onPress={() => setEntriesExpanded(true)}
                  accessibilityRole="button"
                  style={({ pressed }) =>
                    pressed ? styles.panelDefinitionLinkRowPressed : null
                  }
                >
                  <Text style={styles.panelDefinitionShowMore}>
                    {t('showMoreEntries')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <ExpandableDefinitionText
              key="placeholder"
              text={t('nativeLanguageDefinitionPlaceholder')}
              textStyle={styles.panelDefinitionText}
            />
          )}
        </View>
      ) : null}
      </View>
    </Animated.View>
  );
}

function createStyles(theme: Theme, isDark: boolean) {
  return StyleSheet.create({
    panelOuter: {
      width: '100%',
    },
    dragHandleTrack: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 12,
    },
    dragHandle: {
      width: 72,
      height: 4,
      borderRadius: 3,
      backgroundColor: theme.textMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.textSecondary,
    },
    panel: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    panelCompact: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    panelHeaderCompact: {
      marginBottom: 6,
    },
    panelHeaderContent: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
    },
    panelHeaderContentStacked: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2,
    },
    panelHeaderContentStackedCompact: {
      gap: 0,
    },
    panelHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    panelPinyin: {
      fontSize: 14,
      color: theme.textMuted,
    },
    panelPinyinUnderWord: {
      fontSize: 13,
    },
    panelPinyinCompact: {
      fontSize: 12,
    },
    panelWord: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? theme.text : theme.accent,
    },
    panelWordCompact: {
      fontSize: 20,
    },
    panelDefinition: {
      paddingTop: 8,
    },
    panelDefinitionCompact: {
      paddingTop: 4,
    },
    panelDefinitionMissingDict: {
      gap: 8,
    },
    panelDefinitionList: {
      gap: 12,
    },
    panelDefinitionListCompact: {
      gap: 5,
    },
    panelDefinitionItem: {
      gap: 6,
    },
    panelDefinitionItemCompact: {
      gap: 2,
    },
    panelDefinitionItemDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    panelDefinitionItemDividerCompact: {
      paddingTop: 5,
    },
    panelDefinitionItemHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      flexWrap: 'wrap',
    },
    panelDefinitionItemHeaderCompact: {
      gap: 5,
    },
    panelDefinitionItemWord: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? theme.text : theme.accent,
    },
    panelDefinitionItemWordCompact: {
      fontSize: 16,
    },
    panelDefinitionItemPinyin: {
      fontSize: 13,
      color: theme.textMuted,
    },
    panelDefinitionItemPinyinCompact: {
      fontSize: 12,
    },
    panelDefinitionText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    panelDefinitionTextSplitCompact: {
      fontSize: 12,
      lineHeight: 16,
    },
    panelDefinitionTextLoaded: {
      color: theme.textSecondary,
    },
    panelDefinitionTextMissing: {
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    panelDefinitionShowMore: {
      fontSize: 12,
      color: theme.accent,
      paddingVertical: 2,
      textAlign: 'center',
      alignSelf: 'stretch',
    },
    panelDefinitionLink: {
      fontSize: 14,
      color: theme.accent,
      textDecorationLine: 'underline',
    },
    panelDefinitionLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      alignSelf: 'flex-end',
    },
    panelDefinitionLinkRowPressed: {
      opacity: 0.75,
    },
    /** Hit area kept at the original 34px; the visible logo is 20% smaller and centered. */
    plecoButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      // Muted so the bright logo blends into the panel; full color on tap.
      opacity: 0.8,
    },
    plecoButtonCompact: {
      width: 28,
      height: 28,
    },
    plecoLogo: {
      width: 27,
      height: 27,
      borderRadius: 7,
    },
    plecoLogoCompact: {
      width: 22,
      height: 22,
      borderRadius: 6,
    },
    plecoButtonPressed: {
      opacity: 1,
    },
  });
}
