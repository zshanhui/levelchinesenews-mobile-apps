import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY_LAST_ARTICLE_ROUTE } from './constants';
import {
  clearLastArticleRoute,
  isArticleId,
  lastArticleRouteHref,
  loadLastArticleRoute,
  parseArticleRouteFromUrl,
  parseLastArticleRoute,
  pathnameHasArticle,
  resolveLaunchArticleRoute,
  saveLastArticleRoute,
} from './lastArticleRoute';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

const ID = 'c8fdf9b9-dba1-44c7-9d5b-3abe6543a343';
const OTHER_ID = '61e9879e-8e50-4080-a362-e0fdeca866d8';

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset();
  mockRemoveItem.mockReset();
});

describe('isArticleId', () => {
  it('accepts uuid article ids', () => {
    expect(isArticleId(ID)).toBe(true);
  });

  it('rejects non-uuid values', () => {
    expect(isArticleId('article')).toBe(false);
    expect(isArticleId('')).toBe(false);
  });
});

describe('parseLastArticleRoute', () => {
  it('returns null for invalid payloads', () => {
    expect(parseLastArticleRoute(null)).toBeNull();
    expect(parseLastArticleRoute({ id: 'nope' })).toBeNull();
    expect(parseLastArticleRoute({ word: '中国' })).toBeNull();
  });

  it('keeps optional selection fields', () => {
    expect(
      parseLastArticleRoute({
        id: ID,
        word: '中国',
        wordKey: '0:0:1',
        sentenceKey: '0:0',
      }),
    ).toEqual({
      id: ID,
      word: '中国',
      wordKey: '0:0:1',
      sentenceKey: '0:0',
    });
  });

  it('drops empty optional fields', () => {
    expect(parseLastArticleRoute({ id: ID, word: '', sentenceKey: '0:1' })).toEqual({
      id: ID,
      word: undefined,
      wordKey: undefined,
      sentenceKey: '0:1',
    });
  });
});

describe('parseArticleRouteFromUrl', () => {
  it('returns null for empty or unrelated urls', () => {
    expect(parseArticleRouteFromUrl(null)).toBeNull();
    expect(parseArticleRouteFromUrl('lcn://settings')).toBeNull();
    expect(parseArticleRouteFromUrl('https://levelchinese.app/')).toBeNull();
  });

  it('parses lcn article urls with selection params', () => {
    expect(
      parseArticleRouteFromUrl(
        `lcn://article/${ID}?word=${encodeURIComponent('中国')}&wordKey=0:0:1&sentenceKey=0:0`,
      ),
    ).toEqual({
      id: ID,
      word: '中国',
      wordKey: '0:0:1',
      sentenceKey: '0:0',
    });
  });

  it('parses https reader article urls', () => {
    expect(
      parseArticleRouteFromUrl(`https://reader.levelchinese.app/article/${ID}`),
    ).toEqual({
      id: ID,
      word: undefined,
      wordKey: undefined,
      sentenceKey: undefined,
    });
  });

  it('rejects non-uuid article paths', () => {
    expect(parseArticleRouteFromUrl('lcn://article/not-a-uuid')).toBeNull();
  });
});

describe('lastArticleRouteHref / pathnameHasArticle', () => {
  it('builds a bare article href', () => {
    expect(lastArticleRouteHref({ id: ID })).toBe(`/article/${ID}`);
  });

  it('appends selection query params', () => {
    expect(
      lastArticleRouteHref({
        id: ID,
        word: '中国',
        wordKey: '0:0:1',
        sentenceKey: '0:0',
      }),
    ).toBe(
      `/article/${ID}?word=${encodeURIComponent('中国')}&wordKey=0%3A0%3A1&sentenceKey=0%3A0`,
    );
  });

  it('detects the article path', () => {
    expect(pathnameHasArticle(`/article/${ID}`, ID)).toBe(true);
    expect(pathnameHasArticle(`/article/${OTHER_ID}`, ID)).toBe(false);
    expect(pathnameHasArticle('/', ID)).toBe(false);
  });
});

describe('storage', () => {
  it('returns null when empty or corrupt', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(await loadLastArticleRoute()).toBeNull();
    mockGetItem.mockResolvedValue('{bad');
    expect(await loadLastArticleRoute()).toBeNull();
  });

  it('saves a valid route', async () => {
    await saveLastArticleRoute({ id: ID, sentenceKey: '1:2' });
    expect(mockSetItem).toHaveBeenCalledWith(
      STORAGE_KEY_LAST_ARTICLE_ROUTE,
      JSON.stringify({
        id: ID,
        sentenceKey: '1:2',
      }),
    );
  });

  it('does not save an invalid id', async () => {
    await saveLastArticleRoute({ id: 'nope' });
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('clears only when stored id matches', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ id: OTHER_ID }));
    await clearLastArticleRoute(ID);
    expect(mockRemoveItem).not.toHaveBeenCalled();

    mockGetItem.mockResolvedValue(JSON.stringify({ id: ID }));
    await clearLastArticleRoute(ID);
    expect(mockRemoveItem).toHaveBeenCalledWith(STORAGE_KEY_LAST_ARTICLE_ROUTE);
  });
});

describe('resolveLaunchArticleRoute', () => {
  it('prefers the launch deep link over the last saved article', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ id: OTHER_ID }));
    expect(await resolveLaunchArticleRoute(`lcn://article/${ID}`)).toEqual({
      id: ID,
      word: undefined,
      wordKey: undefined,
      sentenceKey: undefined,
    });
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('falls back to the last saved article', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify({ id: ID, sentenceKey: '0:3' }));
    expect(await resolveLaunchArticleRoute(null)).toEqual({
      id: ID,
      word: undefined,
      wordKey: undefined,
      sentenceKey: '0:3',
    });
  });
});
