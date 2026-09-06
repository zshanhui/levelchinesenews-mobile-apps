import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dedupeById,
  loadCachedList,
  paginationFromCachedCount,
  saveCachedList,
  ARTICLE_LIST_CACHE_KEY,
  MAX_CACHED_ARTICLES,
} from './articleListCache';
import type { ArticleListItem } from './types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

function makeItem(id: string, title = 'Article'): ArticleListItem {
  return {
    id,
    title,
    source: null,
    word_count: null,
    source_url: null,
    main_image: null,
    published_date: null,
    tags: [],
    title_translated_en: null,
    summary_generated_en: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
});

describe('paginationFromCachedCount', () => {
  it('uses a full last page when the count divides evenly', () => {
    expect(paginationFromCachedCount(30, 15)).toEqual({ lastPageLen: 15, page: 2 });
  });

  it('uses the remainder when the last page is partial', () => {
    expect(paginationFromCachedCount(17, 15)).toEqual({ lastPageLen: 2, page: 2 });
  });

  it('returns page 1 when the count is zero', () => {
    expect(paginationFromCachedCount(0, 15)).toEqual({ lastPageLen: 15, page: 1 });
  });
});

describe('dedupeById', () => {
  it('returns empty array for empty input', () => {
    expect(dedupeById([])).toEqual([]);
  });

  it('returns same array when no duplicates', () => {
    const items = [
      makeItem('a'),
      makeItem('b'),
      makeItem('c'),
    ];
    expect(dedupeById(items)).toEqual(items);
  });

  it('removes duplicate by id, keeps first occurrence', () => {
    const a1 = makeItem('x', 'First');
    const a2 = makeItem('x', 'Second');
    const a3 = makeItem('y', 'Third');
    const items = [a1, a2, a3];
    expect(dedupeById(items)).toEqual([a1, a3]);
  });

  it('handles multiple duplicate ids', () => {
    const items = [
      makeItem('a'),
      makeItem('b'),
      makeItem('a'),
      makeItem('c'),
      makeItem('b'),
    ];
    const result = dedupeById(items);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result).toHaveLength(3);
  });
});

describe('loadCachedList', () => {
  it('returns null when no cache', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(await loadCachedList()).toBeNull();
    expect(mockGetItem).toHaveBeenCalledWith(ARTICLE_LIST_CACHE_KEY);
  });

  it('returns null for invalid JSON', async () => {
    mockGetItem.mockResolvedValue('not json');
    expect(await loadCachedList()).toBeNull();
  });

  it('returns null for empty items', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        items: [],
        page_size: 15,
        cachedAt: '2024-01-01T12:00:00Z',
      }),
    );
    expect(await loadCachedList()).toBeNull();
  });

  it('returns null for missing cachedAt', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        items: [makeItem('1')],
        page_size: 15,
      }),
    );
    expect(await loadCachedList()).toBeNull();
  });

  it('returns parsed cache when valid', async () => {
    const cached = {
      items: [makeItem('1'), makeItem('2')],
      page_size: 15,
      cachedAt: '2024-01-15T14:30:00Z',
    };
    mockGetItem.mockResolvedValue(JSON.stringify(cached));
    const result = await loadCachedList();
    expect(result).toEqual(cached);
    expect(result?.items).toHaveLength(2);
    expect(result?.cachedAt).toBe('2024-01-15T14:30:00Z');
  });

  it('returns null on parse error', async () => {
    mockGetItem.mockResolvedValue('{invalid}');
    expect(await loadCachedList()).toBeNull();
  });
});

describe('saveCachedList', () => {
  it('deduplicates before saving', async () => {
    const items = [
      makeItem('a'),
      makeItem('a'),
      makeItem('b'),
    ];
    await saveCachedList(items, 15);
    expect(mockSetItem).toHaveBeenCalledWith(
      ARTICLE_LIST_CACHE_KEY,
      expect.any(String),
    );
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.items).toHaveLength(2);
    expect(saved.items.map((i: ArticleListItem) => i.id)).toEqual(['a', 'b']);
    expect(saved.page_size).toBe(15);
    expect(saved.cachedAt).toBeDefined();
    expect(typeof saved.cachedAt).toBe('string');
  });

  it('caps items at MAX_CACHED_ARTICLES', async () => {
    const items = Array.from({ length: 150 }, (_, i) => makeItem(`id-${i}`));
    await saveCachedList(items, 15);
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.items).toHaveLength(MAX_CACHED_ARTICLES);
    expect(saved.items[0].id).toBe('id-0');
    expect(saved.items[99].id).toBe('id-99');
  });

  it('stores cachedAt as ISO string', async () => {
    const items = [makeItem('1')];
    await saveCachedList(items, 15);
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
