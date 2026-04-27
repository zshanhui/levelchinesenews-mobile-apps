/**
 * Article body list scrolling — `FlashList` behavior for sentence rows
 *
 * ## Context
 *
 * The article body is a **virtualized** `FlashList`: rows near the viewport are mounted and recycled.
 * Each row is a **sentence** with **variable height** (word wrap, optional pinyin, translate UI).
 *
 * We use **`FlashListRef.scrollToIndex`**, which measures item layouts and performs multi-step
 * scrolls internally so the target index lands correctly (unlike `FlatList` + bad
 * `averageItemLength` estimates). There is no separate `onScrollToIndexFailed` hook on FlashList.
 *
 * ## Two scroll “modes”
 *
 * 1. **Study / selection** — user tapped a word; we scroll the highlighted sentence into view.
 *    We use **animated** `scrollToIndex` for a normal smooth scroll.
 *
 * 2. **Saved sentence bookmark** — DB stores `(paragraphIndex, sentenceIndex)`; we scroll to that
 *    sentence on load. For **near** bookmarks (low list index), animated scroll is fine. For
 *    **far** bookmarks (`index >= FAR_BOOKMARK_SENTENCE_INDEX`), a long **animated** scroll through
 *    thousands of points feels janky; we use **instant** (non-animated) jumps for coarse
 *    positioning, then **one** final **animated** `scrollToIndex` to polish (`finalizeBookmarkScroll`).
 *
 * ## Bookmark-specific timing (effects)
 *
 * - **Highlight effect** — when `highlightedSentenceKey` is set, scroll after
 *   `InteractionManager.runAfterInteractions` so we don’t fight the transition.
 * - **Bookmark effect** — runs when there is a bookmark and **no** sentence highlight (study
 *   takes priority). It:
 *   - Calls `scrollListToSentenceKey` once when interactions are idle, then **backup** timers
 *     (e.g. 450ms / 1200ms for near; more for far) so a late layout or async DB still triggers
 *     a scroll — e.g. opening from the list where bookmark loads after the first paint.
 *   - For **far** bookmarks, schedules **`finalizeBookmarkScroll`** after the last backup **+ 650ms**:
 *     one **animated** `scrollToIndex` after instant steps have (hopefully) brought the target
 *     near the viewport.
 *
 * @see https://shopify.github.io/flash-list/
 */
import type { FlashListRef } from '@shopify/flash-list';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { InteractionManager } from 'react-native';

/**
 * List row index from the top of the body at/above this value is treated as a “far” bookmark:
 * use instant (non-animated) coarse scrolls, then a single animated finalize — see file doc above.
 */
export const FAR_BOOKMARK_SENTENCE_INDEX = 32;

type ScrollListOptions = { useInstantForFarBookmark?: boolean };

/**
 * Encapsulates all `FlashList` scrolling for the article body: study highlight and DB bookmark.
 * See the **file-level comment** in `scrolling-utils.ts` for the full picture.
 */
export function useArticleSmartScroll<Item>({
  sentenceKeyToIndex,
  bookmarkedSentenceKey,
  highlightedSentenceKey,
  hasSelectedWord,
  parsedContentLength,
}: {
  /** Map `sentenceKey` (`"paragraphIdx:sentenceIdx"`) → `FlashList` `data` index. */
  sentenceKeyToIndex: Map<string, number>;
  /** Current saved bookmark key, or null. */
  bookmarkedSentenceKey: string | null;
  /** When set (user is in “study” mode), bookmark auto-scroll is skipped. */
  highlightedSentenceKey: string | null;
  /** Affects `viewPosition` when scrolling to the highlighted sentence (word panel vs sentence-only). */
  hasSelectedWord: boolean;
  /**
   * Paragraph count (or any stable length signal for `parsed_content`); when it changes, bookmark
   * effect re-runs (e.g. after refetch) without depending on a new `parsedContent` **reference** only.
   */
  parsedContentLength: number;
}): {
  listRef: RefObject<FlashListRef<Item> | null>;
} {
  const listRef = useRef<FlashListRef<Item>>(null);

  /**
   * Scroll so the row for `sentenceKey` appears at `viewPosition` (0–1) in the viewport.
   * Optional `useInstantForFarBookmark`: only for bookmark flows; for indices >=
   * `FAR_BOOKMARK_SENTENCE_INDEX`, use non-animated first `scrollToIndex` (see file doc).
   */
  const scrollListToSentenceKey = useCallback(
    (sentenceKey: string, viewPosition: number, options?: ScrollListOptions) => {
      const index = sentenceKeyToIndex.get(sentenceKey);
      if (index == null || !listRef.current) return;
      const useInstantForBookmark =
        Boolean(options?.useInstantForFarBookmark) &&
        index >= FAR_BOOKMARK_SENTENCE_INDEX;
      try {
        void listRef.current.scrollToIndex({
          index,
          viewPosition,
          animated: !useInstantForBookmark,
        });
      } catch {
        // e.g. index temporarily invalid while `data` updates
      }
    },
    [sentenceKeyToIndex],
  );

  /**
   * **Far bookmarks only** — after cold instant jumps, one **animated** `scrollToIndex` to align
   * the row (better UX than animating the entire distance from the top).
   */
  const finalizeBookmarkScroll = useCallback(
    (sentenceKey: string) => {
      if (!bookmarkedSentenceKey || bookmarkedSentenceKey !== sentenceKey) {
        return;
      }
      const index = sentenceKeyToIndex.get(sentenceKey);
      if (index == null || !listRef.current) return;
      if (index < FAR_BOOKMARK_SENTENCE_INDEX) {
        return;
      }
      try {
        void listRef.current.scrollToIndex({
          index,
          viewPosition: 0.4,
          animated: true,
        });
      } catch {
        // ignore
      }
    },
    [bookmarkedSentenceKey, sentenceKeyToIndex],
  );

  // --- Study: scroll to the sentence the user selected (word highlight / sentence focus) ---

  useEffect(() => {
    if (!highlightedSentenceKey) {
      return;
    }
    const viewPosition = hasSelectedWord ? 0.22 : 0.38;
    const task = InteractionManager.runAfterInteractions(() => {
      scrollListToSentenceKey(highlightedSentenceKey, viewPosition);
    });
    return () => task.cancel();
  }, [hasSelectedWord, highlightedSentenceKey, scrollListToSentenceKey]);

  // --- Bookmark: scroll to the saved sentence (no study highlight) ---

  useEffect(() => {
    if (!bookmarkedSentenceKey || highlightedSentenceKey) {
      return;
    }
    const key = bookmarkedSentenceKey;
    const tryScroll = () => {
      scrollListToSentenceKey(key, 0.4, { useInstantForFarBookmark: true });
    };
    const bookmarkIndex = sentenceKeyToIndex.get(key) ?? 0;
    const isFarBookmark = bookmarkIndex >= FAR_BOOKMARK_SENTENCE_INDEX;
    const backupDelaysMs = isFarBookmark ? [800, 2200, 4000] : [450, 1200];
    const task = InteractionManager.runAfterInteractions(tryScroll);
    const timeoutIds = backupDelaysMs.map((ms) => setTimeout(tryScroll, ms));
    const lastBackupMs = backupDelaysMs[backupDelaysMs.length - 1] ?? 0;
    const finalizeId = isFarBookmark
      ? setTimeout(() => finalizeBookmarkScroll(key), lastBackupMs + 650)
      : null;
    return () => {
      task.cancel();
      timeoutIds.forEach(clearTimeout);
      if (finalizeId != null) clearTimeout(finalizeId);
    };
  }, [
    bookmarkedSentenceKey,
    highlightedSentenceKey,
    parsedContentLength,
    finalizeBookmarkScroll,
    scrollListToSentenceKey,
    sentenceKeyToIndex,
  ]);

  return { listRef };
}
