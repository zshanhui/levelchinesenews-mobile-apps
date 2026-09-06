import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HSK_HIDE_LEVELS,
  resetHskHide,
  setHskHideEnabled,
  setHskHideMaxLevel,
  getHskHideEnabled,
  getHskHideMaxLevel,
  getHskHideSet,
  hydrateHskHide,
  wordsAtOrUnderHskLevel,
} from './useHskHide';
import { loadCachedHskWords } from './hskWordsCache';
import { loadOrDownloadHskWords } from './useHskWords';
import {
  STORAGE_KEY_HSK_HIDE_ENABLED,
  STORAGE_KEY_HSK_HIDE_MAX_LEVEL,
} from './constants';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('./hskWordsCache', () => ({
  loadCachedHskWords: jest.fn(),
}));

jest.mock('./useHskWords', () => ({
  loadOrDownloadHskWords: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockLoadCached = loadCachedHskWords as jest.Mock;
const mockLoadOrDownload = loadOrDownloadHskWords as jest.Mock;

beforeEach(() => {
  resetHskHide();
  mockGetItem.mockReset();
  mockSetItem.mockReset();
  mockLoadCached.mockReset();
  mockLoadOrDownload.mockReset();
  mockGetItem.mockResolvedValue(null);
  mockLoadCached.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

describe('wordsAtOrUnderHskLevel', () => {
  const index = { 的: 1, 中国: 1, 经济: 4, 量子: 7 };

  it('includes words at or under the max level', () => {
    expect([...wordsAtOrUnderHskLevel(index, 1)].sort()).toEqual(['中国', '的']);
    expect([...wordsAtOrUnderHskLevel(index, 4)].sort()).toEqual(['中国', '的', '经济']);
  });

  it('does not include HSK 7 when max is 6', () => {
    expect(wordsAtOrUnderHskLevel(index, 6).has('量子')).toBe(false);
  });
});

describe('hskHide store', () => {
  it('starts off with no hide set', async () => {
    await hydrateHskHide();
    expect(getHskHideEnabled()).toBe(false);
    expect(getHskHideMaxLevel()).toBeNull();
    expect(getHskHideSet().size).toBe(0);
  });

  it('does not download when turning the toggle off', async () => {
    await hydrateHskHide();
    await expect(setHskHideEnabled(false)).resolves.toBe(true);
    expect(mockLoadOrDownload).not.toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY_HSK_HIDE_ENABLED, 'false');
  });

  it('downloads on first enable and hides nothing until a level is chosen', async () => {
    mockLoadOrDownload.mockResolvedValue({ 的: 1, 经济: 4 });
    await hydrateHskHide();
    await expect(setHskHideEnabled(true)).resolves.toBe(true);
    expect(mockLoadOrDownload).toHaveBeenCalledTimes(1);
    expect(getHskHideEnabled()).toBe(true);
    expect(getHskHideSet().size).toBe(0);
  });

  it('hides words at or under the selected level when enabled', async () => {
    mockLoadOrDownload.mockResolvedValue({ 的: 1, 经济: 4, 量子: 7 });
    await hydrateHskHide();
    await setHskHideEnabled(true);
    await setHskHideMaxLevel(4);
    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY_HSK_HIDE_MAX_LEVEL, '4');
    expect([...getHskHideSet()].sort()).toEqual(['的', '经济']);
  });

  it('turns on immediately before download finishes', async () => {
    let finishDownload!: (value: Record<string, number>) => void;
    mockLoadOrDownload.mockReturnValue(
      new Promise<Record<string, number>>((resolve) => {
        finishDownload = resolve;
      }),
    );
    await hydrateHskHide();
    const pending = setHskHideEnabled(true);
    expect(getHskHideEnabled()).toBe(true);
    finishDownload({ 的: 1 });
    await expect(pending).resolves.toBe(true);
  });

  it('defers hide-set rebuild so enabling stays synchronous when a level is already set', async () => {
    mockLoadCached.mockResolvedValue({
      words: { 的: 1, 经济: 4 },
      cachedAt: '2024-01-01T00:00:00Z',
    });
    mockGetItem.mockImplementation(async (key: string) => {
      if (key === STORAGE_KEY_HSK_HIDE_MAX_LEVEL) return '4';
      return null;
    });
    await hydrateHskHide();
    expect(getHskHideSet().size).toBe(0);

    await setHskHideEnabled(true);
    expect(getHskHideEnabled()).toBe(true);
    expect(getHskHideSet().size).toBe(0);

    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
        return;
      }
      setTimeout(resolve, 0);
    });
    expect([...getHskHideSet()].sort()).toEqual(['的', '经济']);
  });

  it('does not re-enable if turned off while download is in flight', async () => {
    let finishDownload!: (value: Record<string, number>) => void;
    mockLoadOrDownload.mockReturnValue(
      new Promise<Record<string, number>>((resolve) => {
        finishDownload = resolve;
      }),
    );
    await hydrateHskHide();
    const pendingOn = setHskHideEnabled(true);
    await setHskHideEnabled(false);
    expect(getHskHideEnabled()).toBe(false);
    finishDownload({ 的: 1 });
    await expect(pendingOn).resolves.toBe(true);
    expect(getHskHideEnabled()).toBe(false);
  });

  it('returns false and stays off when download fails', async () => {
    mockLoadOrDownload.mockResolvedValue(null);
    await hydrateHskHide();
    await expect(setHskHideEnabled(true)).resolves.toBe(false);
    expect(getHskHideEnabled()).toBe(false);
    expect(getHskHideSet().size).toBe(0);
  });

  it('restores persisted enabled + level from cache without downloading', async () => {
    mockGetItem.mockImplementation(async (key: string) => {
      if (key === STORAGE_KEY_HSK_HIDE_ENABLED) return 'true';
      if (key === STORAGE_KEY_HSK_HIDE_MAX_LEVEL) return '1';
      return null;
    });
    mockLoadCached.mockResolvedValue({
      words: { 的: 1, 经济: 4 },
      cachedAt: '2024-01-01T00:00:00Z',
    });
    await hydrateHskHide();
    expect(getHskHideEnabled()).toBe(true);
    expect(getHskHideMaxLevel()).toBe(1);
    expect([...getHskHideSet()]).toEqual(['的']);
    expect(mockLoadOrDownload).not.toHaveBeenCalled();
  });
});

describe('HSK_HIDE_LEVELS', () => {
  it('is HSK 1 through 6', () => {
    expect(HSK_HIDE_LEVELS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
