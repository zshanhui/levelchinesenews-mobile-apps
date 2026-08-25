import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dedupeWords,
  isStopwordsCacheStale,
  loadCachedStopwords,
  saveCachedStopwords,
} from './stopwordsCache';
import { STORAGE_KEY_STOP_WORDS, STOP_WORDS_CACHE_TTL_MS } from './constants';

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

describe('dedupeWords', () => {
  it('returns empty array for empty input', () => {
    expect(dedupeWords([])).toEqual([]);
  });

  it('returns same array when no duplicates', () => {
    expect(dedupeWords(['的', '了', '在'])).toEqual(['的', '了', '在']);
  });

  it('removes duplicates, keeps first occurrence order', () => {
    expect(dedupeWords(['的', '了', '的', '在', '了'])).toEqual(['的', '了', '在']);
  });
});

describe('loadCachedStopwords', () => {
  it('returns null when no cache', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(await loadCachedStopwords()).toBeNull();
    expect(mockGetItem).toHaveBeenCalledWith(STORAGE_KEY_STOP_WORDS);
  });

  it('returns null for invalid JSON', async () => {
    mockGetItem.mockResolvedValue('not json');
    expect(await loadCachedStopwords()).toBeNull();
  });

  it('returns null for empty words', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({ words: [], cachedAt: '2024-01-01T12:00:00Z' }),
    );
    expect(await loadCachedStopwords()).toBeNull();
  });

  it('returns null for missing cachedAt', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({ words: ['的'] }),
    );
    expect(await loadCachedStopwords()).toBeNull();
  });

  it('returns null when a word is not a non-empty string', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({ words: ['的', 42, '了'], cachedAt: '2024-01-01T12:00:00Z' }),
    );
    expect(await loadCachedStopwords()).toBeNull();

    mockGetItem.mockResolvedValue(
      JSON.stringify({ words: ['的', ''], cachedAt: '2024-01-01T12:00:00Z' }),
    );
    expect(await loadCachedStopwords()).toBeNull();
  });

  it('returns parsed cache when valid', async () => {
    const cached = {
      words: ['的', '了', '在'],
      cachedAt: '2024-01-15T14:30:00Z',
    };
    mockGetItem.mockResolvedValue(JSON.stringify(cached));
    const result = await loadCachedStopwords();
    expect(result).toEqual(cached);
    expect(result?.words).toHaveLength(3);
    expect(result?.cachedAt).toBe('2024-01-15T14:30:00Z');
  });
});

describe('saveCachedStopwords', () => {
  it('deduplicates before saving', async () => {
    await saveCachedStopwords(['的', '了', '的']);
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEY_STOP_WORDS,
      expect.any(String),
    );
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.words).toEqual(['的', '了']);
    expect(saved.cachedAt).toBeDefined();
    expect(typeof saved.cachedAt).toBe('string');
  });

  it('stores cachedAt as ISO string', async () => {
    await saveCachedStopwords(['的']);
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('isStopwordsCacheStale', () => {
  const now = new Date('2024-06-01T12:00:00Z').getTime();

  it('returns false for a fresh cache', () => {
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    expect(isStopwordsCacheStale({ words: ['的'], cachedAt: oneHourAgo }, now)).toBe(false);
  });

  it('returns false just under the TTL', () => {
    const justUnder = new Date(now - STOP_WORDS_CACHE_TTL_MS + 1).toISOString();
    expect(isStopwordsCacheStale({ words: ['的'], cachedAt: justUnder }, now)).toBe(false);
  });

  it('returns true at the TTL boundary', () => {
    const exact = new Date(now - STOP_WORDS_CACHE_TTL_MS).toISOString();
    expect(isStopwordsCacheStale({ words: ['的'], cachedAt: exact }, now)).toBe(true);
  });

  it('returns true for an old cache', () => {
    expect(isStopwordsCacheStale({ words: ['的'], cachedAt: '2024-01-01T00:00:00Z' }, now)).toBe(true);
  });

  it('returns true for an unparseable cachedAt', () => {
    expect(isStopwordsCacheStale({ words: ['的'], cachedAt: 'garbage' }, now)).toBe(true);
  });
});
