import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  STORAGE_KEY_HSK_HIDE_ENABLED,
  STORAGE_KEY_HSK_HIDE_MAX_LEVEL,
} from './constants';
import { loadCachedHskWords } from './hskWordsCache';
import { loadOrDownloadHskWords } from './useHskWords';

export const HSK_HIDE_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type HskHideMaxLevel = (typeof HSK_HIDE_LEVELS)[number];

export function wordsAtOrUnderHskLevel(
  index: Record<string, number>,
  maxLevel: number,
): Set<string> {
  const out = new Set<string>();
  for (const [word, level] of Object.entries(index)) {
    if (level <= maxLevel) out.add(word);
  }
  return out;
}

function parseMaxLevel(raw: string | null): HskHideMaxLevel | null {
  if (raw === '1' || raw === '2' || raw === '3' || raw === '4' || raw === '5' || raw === '6') {
    return Number(raw) as HskHideMaxLevel;
  }
  return null;
}

let enabled = false;
let maxLevel: HskHideMaxLevel | null = null;
let words: Record<string, number> = {};
let wordsLoaded = false;
let hideSet: Set<string> = new Set();
let revision = 0;
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let enableInFlight: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function rebuildHideSet(): void {
  hideSet =
    enabled && maxLevel != null
      ? wordsAtOrUnderHskLevel(words, maxLevel)
      : new Set();
  revision += 1;
  notify();
}

async function doHydrate(): Promise<void> {
  const [enabledRaw, levelRaw, cached] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEY_HSK_HIDE_ENABLED),
    AsyncStorage.getItem(STORAGE_KEY_HSK_HIDE_MAX_LEVEL),
    loadCachedHskWords(),
  ]);
  enabled = enabledRaw === 'true';
  maxLevel = parseMaxLevel(levelRaw);
  if (cached) {
    words = cached.words;
    wordsLoaded = true;
  }
  rebuildHideSet();
}

export function hydrateHskHide(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = doHydrate()
      .then(() => {
        hydrated = true;
      })
      .catch((err) => {
        hydratePromise = null;
        throw err;
      });
  }
  return hydratePromise;
}

export function getHskHideSet(): ReadonlySet<string> {
  return hideSet;
}

export function getHskHideRevision(): number {
  return revision;
}

export function getHskHideEnabled(): boolean {
  return enabled;
}

export function getHskHideMaxLevel(): HskHideMaxLevel | null {
  return maxLevel;
}

export function subscribeHskHide(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function afterPaint(cb: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(cb);
    return;
  }
  setTimeout(cb, 0);
}

function commitEnabled(on: boolean): void {
  enabled = on;
  if (!on) hideSet = new Set();
  revision += 1;
  notify();
}

/** Turn hiding on or off. Updates UI state immediately; persistence is in the background. */
export async function setHskHideEnabled(on: boolean): Promise<boolean> {
  if (!hydrated) await hydrateHskHide();

  if (!on) {
    commitEnabled(false);
    void AsyncStorage.setItem(STORAGE_KEY_HSK_HIDE_ENABLED, 'false');
    return true;
  }

  commitEnabled(true);

  if (wordsLoaded) {
    if (maxLevel != null) {
      afterPaint(() => {
        if (enabled) rebuildHideSet();
      });
    }
    void AsyncStorage.setItem(STORAGE_KEY_HSK_HIDE_ENABLED, 'true');
    return true;
  }

  if (enableInFlight) return enableInFlight;

  enableInFlight = (async () => {
    const map = await loadOrDownloadHskWords();
    if (!map) {
      if (enabled) commitEnabled(false);
      return false;
    }
    words = map;
    wordsLoaded = true;
    if (!enabled) {
      return true;
    }
    rebuildHideSet();
    void AsyncStorage.setItem(STORAGE_KEY_HSK_HIDE_ENABLED, 'true');
    return true;
  })().finally(() => {
    enableInFlight = null;
  });
  return enableInFlight;
}

export async function setHskHideMaxLevel(level: HskHideMaxLevel): Promise<void> {
  if (!hydrated) await hydrateHskHide();
  maxLevel = level;
  rebuildHideSet();
  void AsyncStorage.setItem(STORAGE_KEY_HSK_HIDE_MAX_LEVEL, String(level));
}

/** Test helper. */
export function resetHskHide(): void {
  enabled = false;
  maxLevel = null;
  words = {};
  wordsLoaded = false;
  hideSet = new Set();
  revision = 0;
  hydrated = false;
  hydratePromise = null;
  enableInFlight = null;
  listeners.clear();
}

export function useHskHide() {
  const [revisionState, setRevisionState] = useState(getHskHideRevision);
  const [enabledState, setEnabledState] = useState(getHskHideEnabled);
  const [maxLevelState, setMaxLevelState] = useState(getHskHideMaxLevel);

  useEffect(() => subscribeHskHide(() => {
    setRevisionState(getHskHideRevision());
    setEnabledState(getHskHideEnabled());
    setMaxLevelState(getHskHideMaxLevel());
  }), []);

  useEffect(() => {
    void hydrateHskHide();
  }, []);

  const currentHideSet = getHskHideSet();

  const setEnabled = useCallback((on: boolean) => setHskHideEnabled(on), []);
  const setMaxLevel = useCallback(
    (level: HskHideMaxLevel) => setHskHideMaxLevel(level),
    [],
  );

  return {
    enabled: enabledState,
    maxLevel: maxLevelState,
    hideSet: currentHideSet,
    hideRevision: revisionState,
    setEnabled,
    setMaxLevel,
  };
}
