import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isHskWordsCacheStale,
  isValidHskWordsMap,
  loadCachedHskWords,
  saveCachedHskWords,
} from './hskWordsCache';
import { HSK_WORDS_CACHE_TTL_MS, STORAGE_KEY_HSK_WORDS } from './constants';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
});

describe('isValidHskWordsMap', () => {
  it('rejects empty or non-object values', () => {
    expect(isValidHskWordsMap(null)).toBe(false);
    expect(isValidHskWordsMap([])).toBe(false);
    expect(isValidHskWordsMap({})).toBe(false);
  });

  it('rejects non-integer or out-of-range levels', () => {
    expect(isValidHskWordsMap({ 中国: 0 })).toBe(false);
    expect(isValidHskWordsMap({ 中国: 8 })).toBe(false);
    expect(isValidHskWordsMap({ 中国: 1.5 })).toBe(false);
    expect(isValidHskWordsMap({ 中国: '1' })).toBe(false);
  });

  it('accepts a valid word → level map', () => {
    expect(isValidHskWordsMap({ 中国: 1, 经济: 4, 量子: 7 })).toBe(true);
  });
});

describe('loadCachedHskWords', () => {
  it('returns null when no cache', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(await loadCachedHskWords()).toBeNull();
    expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY_HSK_WORDS);
  });

  it('returns null for invalid JSON', async () => {
    mockGetItem.mockResolvedValue('not json');
    expect(await loadCachedHskWords()).toBeNull();
  });

  it('returns null for empty words', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({ words: {}, cachedAt: '2024-01-01T12:00:00Z' }),
    );
    expect(await loadCachedHskWords()).toBeNull();
  });

  it('returns null for missing cachedAt', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ words: { 中国: 1 } }));
    expect(await loadCachedHskWords()).toBeNull();
  });

  it('returns parsed cache when valid', async () => {
    const cached = {
      words: { 中国: 1, 经济: 4 },
      cachedAt: '2024-01-15T14:30:00Z',
    };
    mockGetItem.mockResolvedValue(JSON.stringify(cached));
    const result = await loadCachedHskWords();
    expect(result).toEqual(cached);
  });
});

describe('saveCachedHskWords', () => {
  it('stores words and an ISO cachedAt', async () => {
    await saveCachedHskWords({ 中国: 1 });
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEY_HSK_WORDS,
      expect.any(String),
    );
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.words).toEqual({ 中国: 1 });
    expect(saved.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('rejects an invalid map', async () => {
    await expect(saveCachedHskWords({ 中国: 0 })).rejects.toThrow('invalid HSK words map');
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});

describe('isHskWordsCacheStale', () => {
  const now = new Date('2024-06-01T12:00:00Z').getTime();
  const sample = { words: { 中国: 1 } };

  it('returns false for a fresh cache', () => {
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    expect(isHskWordsCacheStale({ ...sample, cachedAt: oneHourAgo }, now)).toBe(false);
  });

  it('returns false just under the TTL', () => {
    const justUnder = new Date(now - HSK_WORDS_CACHE_TTL_MS + 1).toISOString();
    expect(isHskWordsCacheStale({ ...sample, cachedAt: justUnder }, now)).toBe(false);
  });

  it('returns true at the TTL boundary', () => {
    const exact = new Date(now - HSK_WORDS_CACHE_TTL_MS).toISOString();
    expect(isHskWordsCacheStale({ ...sample, cachedAt: exact }, now)).toBe(true);
  });

  it('returns true for an unparseable cachedAt', () => {
    expect(isHskWordsCacheStale({ ...sample, cachedAt: 'garbage' }, now)).toBe(true);
  });
});
