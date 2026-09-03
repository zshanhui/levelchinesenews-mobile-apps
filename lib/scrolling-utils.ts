/**
 * Article body list scrolling — `FlashList` behavior for sentence rows
 *
 * ## Context
 *
 * The article body is a **virtualized** `FlashList`: rows near the viewport are mounted and recycled.
 * Each row is a **sentence** with **variable height** (word wrap, optional pinyin, translate UI).
 *
 * We use **`FlashListRef.scrollToIndex`** for most rows; for the **last** sentence row,
 * `scrollToIndex` + `viewPosition` is unreliable near the list end (FlashList scrolls the wrong
 * way). For that row we **`scrollToEnd`** instead.
 *
 * ## Scroll “modes”
 *
 * 1. **Study / selection** — user tapped a word; we scroll the highlighted sentence into view
 *    only if it is **not** already fully visible (see `fullyVisibleSentenceKeysRef` in `ArticleContent`).
 *    We use **animated** `scrollToIndex` when scrolling is needed.
 *
 * 2. **Saved sentence bookmark** — DB stores `(paragraphIndex, sentenceIndex)`; we scroll to that
 *    sentence on load. For **near** bookmarks (low list index), animated scroll is fine. For
 *    **far** bookmarks (`index >= FAR_BOOKMARK_SENTENCE_INDEX`), a long **animated** scroll through
 *    thousands of points feels janky; we use **instant** (non-animated) jumps for coarse
 *    positioning, then **one** final **animated** `scrollToIndex` to polish (`finalizeBookmarkScroll`).
 *
 * ## Bookmark-specific timing (effects)
 *
 * - **Highlight effect** — when `highlightedSentenceKey` is set, scroll after an idle tick
 *   (`requestIdleCallback` / `setImmediate` fallback) so we don’t fight the transition.
 * - **Bookmark effect** — runs when there is a bookmark and **no** sentence highlight (study
 *   takes priority). It runs **once per session** (`articleId` + bookmark key + content length):
 *   after the first auto-scroll (or after skipping because study was active), closing study mode
 *   must **not** jump back to the bookmark.
 *   - Calls `scrollListToSentenceKey` once when interactions are idle, then **backup** timers
 *     (e.g. 450ms / 1200ms for near; more for far) so a late layout or async DB still triggers
 *     a scroll — e.g. opening from the list where bookmark loads after the first paint.
 *   - For **far** bookmarks, schedules **`finalizeBookmarkScroll`** after the last backup **+ 650ms**:
 *     one **animated** `scrollToIndex` after instant steps have (hopefully) brought the target
 *     near the viewport.
 *
 * 3. **Reader layout restore** — pinyin on/off or article font size changes row height while
 *    the pixel scroll offset stays put, so the reader jumps. We snapshot the **topmost visible
 *    sentence** during render (before the new layout), then `scrollToIndex` that row (instant)
 *    after FlashList relayouts.
 *
 * @see https://shopify.github.io/flash-list/
 */
import type { FlashListRef } from '@shopify/flash-list';
import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Schedules work after the current batch of work / gestures (replacing deprecated
 * `InteractionManager.runAfterInteractions`; RN docs suggest `requestIdleCallback`).
 */
function scheduleAfterInteractions(callback: () => void): { cancel: () => void } {
  const g = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof g.requestIdleCallback === 'function') {
    const id = g.requestIdleCallback(callback, { timeout: 500 });
    return {
      cancel: () => {
        g.cancelIdleCallback?.(id);
      },
    };
  }
  const immediateId = setImmediate(callback);
  return {
    cancel: () => clearImmediate(immediateId),
  };
}

/**
 * List row index from the top of the body at/above this value is treated as a “far” bookmark:
 * use instant (non-animated) coarse scrolls, then a single animated finalize — see file doc above.
 */
export const FAR_BOOKMARK_SENTENCE_INDEX = 32;

type ScrollListOptions = { useInstantForFarBookmark?: boolean; animated?: boolean };

/**
 * Encapsulates all `FlashList` scrolling for the article body: study highlight and DB bookmark.
 * See the **file-level comment** in `scrolling-utils.ts` for the full picture.
 */
export function useArticleSmartScroll<Item>({
  sentenceKeyToIndex,
  bookmarkedSentenceKey,
  highlightedSentenceKey,
  parsedContentLength,
  articleId,
  sentenceListLength,
  layoutRestoreKey,
}: {
  /** Map `sentenceKey` (`"paragraphIdx:sentenceIdx"`) → `FlashList` `data` index. */
  sentenceKeyToIndex: Map<string, number>;
  /** Current saved bookmark key, or null. */
  bookmarkedSentenceKey: string | null;
  /** When set (user is in “study” mode), bookmark auto-scroll is skipped. */
  highlightedSentenceKey: string | null;
  /**
   * Paragraph count (or any stable length signal for `parsed_content`); when it changes, bookmark
   * effect re-runs (e.g. after refetch) without depending on a new `parsedContent` **reference** only.
   */
  parsedContentLength: number;
  /** Article id — part of the bookmark auto-scroll session key (new article → new session). */
  articleId?: string | null;
  /** `flatData.length` — used to detect the last sentence row for `scrollToEnd` vs `scrollToIndex`. */
  sentenceListLength: number;
  /**
   * Changes when reader typography that affects row height changes (pinyin, font size).
   * Used to restore the top visible sentence after relayout.
   */
  layoutRestoreKey: string;
}): {
  listRef: RefObject<FlashListRef<Item> | null>;
  /** Sentence keys (`paragraph:sentence`) whose row is 100% visible; updated by `ArticleContent` viewable tracking. */
  fullyVisibleSentenceKeysRef: RefObject<Set<string>>;
  /** Lowest-index sentence currently in the viewport (any visibility); updated by `ArticleContent`. */
  topVisibleSentenceKeyRef: RefObject<string | null>;
} {
  const listRef = useRef<FlashListRef<Item>>(null);
  const fullyVisibleSentenceKeysRef = useRef<Set<string>>(new Set());
  const topVisibleSentenceKeyRef = useRef<string | null>(null);
  const bookmarkSessionKeyRef = useRef<string | null>(null);
  /** True after we handled initial bookmark behavior for this session (scroll or skip due to study). */
  const initialBookmarkAutoScrollConsumedRef = useRef(false);
  const prevLayoutRestoreKeyRef = useRef(layoutRestoreKey);
  const pendingLayoutRestoreRef = useRef<{
    key: string;
    viewPosition: number;
  } | null>(null);

  if (prevLayoutRestoreKeyRef.current !== layoutRestoreKey) {
    const restoreKey = highlightedSentenceKey ?? topVisibleSentenceKeyRef.current;
    pendingLayoutRestoreRef.current = restoreKey
      ? {
          key: restoreKey,
          viewPosition: highlightedSentenceKey ? 0.4 : 0.08,
        }
      : null;
    prevLayoutRestoreKeyRef.current = layoutRestoreKey;
  }

  const bookmarkSessionKey = `${articleId ?? ''}\0${bookmarkedSentenceKey ?? ''}\0${parsedContentLength}`;

  useEffect(() => {
    if (bookmarkSessionKeyRef.current !== bookmarkSessionKey) {
      bookmarkSessionKeyRef.current = bookmarkSessionKey;
      initialBookmarkAutoScrollConsumedRef.current = false;
    }
  }, [bookmarkSessionKey]);

  /**
   * Scroll so the row for `sentenceKey` appears at `viewPosition` (0–1) in the viewport.
   * For the **last** row in the list, uses `scrollToEnd` instead of `scrollToIndex` (avoids bad
   * end-of-list behavior in FlashList).
   * Optional `useInstantForFarBookmark`: only for bookmark flows; for indices >=
   * `FAR_BOOKMARK_SENTENCE_INDEX`, use non-animated first scroll (see file doc).
   */
  const scrollListToSentenceKey = useCallback(
    (sentenceKey: string, viewPosition: number, options?: ScrollListOptions) => {
      const index = sentenceKeyToIndex.get(sentenceKey);
      if (index == null || !listRef.current) return;
      const useInstantForBookmark =
        Boolean(options?.useInstantForFarBookmark) &&
        index >= FAR_BOOKMARK_SENTENCE_INDEX;
      const animated =
        options?.animated != null ? options.animated : !useInstantForBookmark;

      const lastIndex =
        sentenceListLength > 0 ? sentenceListLength - 1 : -1;
      if (index === lastIndex) {
        try {
          void listRef.current.scrollToEnd({ animated });
        } catch {
          // e.g. index temporarily invalid while `data` updates
        }
        return;
      }

      try {
        void listRef.current.scrollToIndex({
          index,
          viewPosition,
          animated,
        });
      } catch {
        // e.g. index temporarily invalid while `data` updates
      }
    },
    [sentenceKeyToIndex, sentenceListLength],
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
      const lastIndex =
        sentenceListLength > 0 ? sentenceListLength - 1 : -1;
      try {
        if (index === lastIndex) {
          void listRef.current.scrollToEnd({ animated: true });
        } else {
          void listRef.current.scrollToIndex({
            index,
            viewPosition: 0.4,
            animated: true,
          });
        }
      } catch {
        // ignore
      }
    },
    [bookmarkedSentenceKey, sentenceKeyToIndex, sentenceListLength],
  );

  // --- Study: scroll to the sentence the user selected (word highlight / sentence focus) ---

  useEffect(() => {
    if (!highlightedSentenceKey) {
      return;
    }
    const viewPosition = 0.4; // same for word + sentence-only focus
    const key = highlightedSentenceKey;
    const task = scheduleAfterInteractions(() => {
      requestAnimationFrame(() => {
        if (fullyVisibleSentenceKeysRef.current.has(key)) {
          return;
        }
        scrollListToSentenceKey(key, viewPosition);
      });
    });
    return () => task.cancel();
  }, [highlightedSentenceKey, scrollListToSentenceKey]);

  // --- Bookmark: scroll to the saved sentence (no study highlight), once per screen session ---

  useEffect(() => {
    if (!bookmarkedSentenceKey) {
      return;
    }
    if (highlightedSentenceKey) {
      // Opened with (or entered) study mode: never auto-jump to bookmark after user dismisses study.
      initialBookmarkAutoScrollConsumedRef.current = true;
      return;
    }
    if (initialBookmarkAutoScrollConsumedRef.current) {
      return;
    }
    initialBookmarkAutoScrollConsumedRef.current = true;

    const key = bookmarkedSentenceKey;
    const tryScroll = () => {
      scrollListToSentenceKey(key, 0.4, { useInstantForFarBookmark: true });
    };
    const bookmarkIndex = sentenceKeyToIndex.get(key) ?? 0;
    const isFarBookmark = bookmarkIndex >= FAR_BOOKMARK_SENTENCE_INDEX;
    const backupDelaysMs = isFarBookmark ? [800, 2200, 4000] : [450, 1200];
    const task = scheduleAfterInteractions(tryScroll);
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

  useEffect(() => {
    const pending = pendingLayoutRestoreRef.current;
    if (!pending) return;
    const { key, viewPosition } = pending;
    const tryScroll = () => {
      scrollListToSentenceKey(key, viewPosition, { animated: false });
    };
    const rafId = requestAnimationFrame(() => {
      tryScroll();
      requestAnimationFrame(tryScroll);
    });
    const timeoutIds = [32, 120].map((ms) => setTimeout(tryScroll, ms));
    return () => {
      cancelAnimationFrame(rafId);
      timeoutIds.forEach(clearTimeout);
    };
  }, [layoutRestoreKey, scrollListToSentenceKey]);

  return { listRef, fullyVisibleSentenceKeysRef, topVisibleSentenceKeyRef };
}
