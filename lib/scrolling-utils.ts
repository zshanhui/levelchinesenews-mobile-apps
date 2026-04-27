/**
 * Article body list scrolling — `FlatList` / `VirtualizedList` behavior for sentence rows
 *
 * ## Context
 *
 * The article body is a **virtualized** `FlatList`: only rows near the viewport are mounted.
 * Each row is a **sentence** with **variable height** (word wrap, optional pinyin, translate UI).
 *
 * React Native’s `scrollToIndex({ index, viewPosition })` asks the list to scroll so the item at
 * `index` appears at a given vertical position in the viewport (`viewPosition` is 0 = top, 1 =
 * bottom of the visible area). Internally, the list must know the **pixel offset** of that row.
 * Without `getItemLayout` (we don’t have fixed row heights), it **estimates** from
 * `averageItemLength` — which is often wrong for our rows. For a bookmark **far down** the
 * article, the first `scrollToIndex` may **fail** or land short; the native layer then calls
 * **`onScrollToIndexFailed`** with `{ index, averageItemLength, … }`.
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
 * ## Recovery when `scrollToIndex` fails (`onScrollToIndexFailed`)
 *
 * 1. Increment a **failure counter** (capped at `MAX_SCROLL_TO_INDEX_RETRIES`).
 * 2. **`scrollToOffset`** to `index * averageItemLength` — gets the window closer so more rows
 *    mount and measurements improve. For far bookmarks this offset jump is **instant** (`animated:
 *    false`) when `useInstantForBookmark` is set; otherwise we keep animation for selection scrolls.
 * 3. After **`scrollRetryDelayAfterOffsetMs`**, call **`scrollToIndex` again** toward the same
 *    target stored in `lastScrollToIndexRequestRef`. This may fire multiple times until the list
 *    can satisfy the scroll or we hit the retry cap.
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
 * ## Refs
 *
 * - **`lastScrollToIndexRequestRef`** — last `{ index, viewPosition, useInstantForBookmark? }` we
 *   requested, so `onScrollToIndexFailed` retries the **same** target.
 * - **`scrollToIndexFailureCountRef`** — reset when starting a **new** `scrollListToSentenceKey`
 *   call; increments on each `onScrollToIndexFailed` until cap.
 *
 * @see https://reactnative.dev/docs/flatlist (scrollToIndex, onScrollToIndexFailed)
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import {
  FlatList,
  InteractionManager,
} from 'react-native';

/**
 * Max recovery steps from `onScrollToIndexFailed` (offset + retry `scrollToIndex` per step).
 * Prevents an infinite loop if estimates never improve.
 */
export const MAX_SCROLL_TO_INDEX_RETRIES = 16;

/**
 * List row index from the top of the body at/above this value is treated as a “far” bookmark:
 * use instant (non-animated) coarse scrolls, then a single animated finalize — see file doc above.
 */
export const FAR_BOOKMARK_SENTENCE_INDEX = 32;

/**
 * Delay before retrying `scrollToIndex` after a compensating `scrollToOffset` in
 * `onScrollToIndexFailed`. Slightly longer on later failures to give the list time to mount rows.
 */
export function scrollRetryDelayAfterOffsetMs(failureCount: number): number {
  return 360 + Math.min(420, (failureCount - 1) * 55);
}

/** Last programmatic scroll request — read in `onScrollToIndexFailed` to retry the same target. */
export type LastScrollToIndexRequest = {
  index: number;
  viewPosition: number;
  /**
   * When true, `scrollToOffset` / follow-up `scrollToIndex` in the failure handler use
   * `animated: false` for far-bookmark recovery (avoids long easing from bad estimates).
   */
  useInstantForBookmark?: boolean;
};

type ScrollListOptions = { useInstantForFarBookmark?: boolean };

/**
 * Encapsulates all `FlatList` scrolling for the article body: study highlight, DB bookmark, and
 * `onScrollToIndexFailed` recovery. See the **file-level comment** in `scrolling-utils.ts` for
 * the full picture.
 */
export function useArticleSmartScroll<Item>({
  sentenceKeyToIndex,
  bookmarkedSentenceKey,
  highlightedSentenceKey,
  hasSelectedWord,
  parsedContentLength,
}: {
  /** Map `sentenceKey` (`"paragraphIdx:sentenceIdx"`) → `FlatList` `data` index. */
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
  listRef: RefObject<FlatList<Item> | null>;
  handleScrollToIndexFailed: (info: {
    index: number;
    averageItemLength: number;
  }) => void;
} {
  const listRef = useRef<FlatList<Item>>(null);
  const lastScrollToIndexRequestRef = useRef<LastScrollToIndexRequest | null>(null);
  const scrollToIndexFailureCountRef = useRef(0);

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
      lastScrollToIndexRequestRef.current = {
        index,
        viewPosition,
        useInstantForBookmark,
      };
      scrollToIndexFailureCountRef.current = 0;
      try {
        listRef.current.scrollToIndex({
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
      lastScrollToIndexRequestRef.current = {
        index,
        viewPosition: 0.4,
        useInstantForBookmark: false,
      };
      scrollToIndexFailureCountRef.current = 0;
      try {
        listRef.current.scrollToIndex({
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

  /**
   * Wired to `FlatList`’s `onScrollToIndexFailed` — see file-level “Recovery” section.
   */
  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      const target = lastScrollToIndexRequestRef.current;
      if (!listRef.current || !target) {
        return;
      }
      scrollToIndexFailureCountRef.current += 1;
      const n = scrollToIndexFailureCountRef.current;
      if (n > MAX_SCROLL_TO_INDEX_RETRIES) {
        return;
      }
      const instant = Boolean(target.useInstantForBookmark);
      const offset = Math.max(0, info.index * info.averageItemLength);
      listRef.current.scrollToOffset({ offset, animated: !instant });
      const delay = scrollRetryDelayAfterOffsetMs(n);
      setTimeout(() => {
        if (!listRef.current) {
          return;
        }
        try {
          listRef.current.scrollToIndex({
            index: target.index,
            viewPosition: target.viewPosition,
            animated: !instant,
          });
        } catch {
          // ignore
        }
      }, delay);
    },
    [],
  );

  return { listRef, handleScrollToIndexFailed };
}
