import {
  loadArticleDetail,
  saveArticleDetail,
  MAX_CACHED_ARTICLE_DETAILS,
} from './articleDetailCache';
import type { ArticleDetail } from './types';

function makeArticleDetail(id: string, title = 'Article'): ArticleDetail {
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
    parsed_content: null,
  };
}

const mockDb = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

jest.mock('./localDatabase', () => ({
  getLocalDatabase: jest.fn(() => Promise.resolve(mockDb)),
  articleDetailCacheTableName: 'article_detail_cache',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loadArticleDetail', () => {
  it('returns null when no row exists', async () => {
    mockDb.getFirstAsync.mockResolvedValue(undefined);
    expect(await loadArticleDetail('art-1')).toBeNull();
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      'art-1'
    );
  });

  it('returns null for invalid payload JSON', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'art-1',
      payload: 'not json',
      cached_at: Date.now(),
    });
    expect(await loadArticleDetail('art-1')).toBeNull();
  });

  it('returns null for payload missing article.id', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'art-1',
      payload: JSON.stringify({ article: {}, cachedAt: new Date().toISOString() }),
      cached_at: Date.now(),
    });
    expect(await loadArticleDetail('art-1')).toBeNull();
  });

  it('returns null for payload missing cachedAt', async () => {
    const article = makeArticleDetail('art-1');
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'art-1',
      payload: JSON.stringify({ article }),
      cached_at: Date.now(),
    });
    expect(await loadArticleDetail('art-1')).toBeNull();
  });

  it('returns parsed cache when valid', async () => {
    const article = makeArticleDetail('art-1', 'Test Title');
    const cachedAt = '2024-01-15T14:30:00Z';
    const cachedAtMs = new Date(cachedAt).getTime();
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'art-1',
      payload: JSON.stringify({ article, cachedAt }),
      cached_at: cachedAtMs,
    });
    const result = await loadArticleDetail('art-1');
    expect(result).not.toBeNull();
    expect(result!.article).toEqual(article);
    expect(result!.article.id).toBe('art-1');
    expect(result!.article.title).toBe('Test Title');
    expect(result!.cachedAt).toMatch(/2024-01-15T14:30:00/);
  });

  it('returns null on DB error', async () => {
    mockDb.getFirstAsync.mockRejectedValue(new Error('DB error'));
    expect(await loadArticleDetail('art-1')).toBeNull();
  });
});

describe('saveArticleDetail', () => {
  it('inserts new row and runs eviction check', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ cnt: 10 });
    await saveArticleDetail('art-1', makeArticleDetail('art-1'));
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT'),
      'art-1',
      expect.any(String),
      expect.any(Number)
    );
    const payloadArg = mockDb.runAsync.mock.calls[0][2];
    const parsed = JSON.parse(payloadArg);
    expect(parsed.article.id).toBe('art-1');
    expect(typeof parsed.cachedAt).toBe('string');
    expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('COUNT')
    );
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
  });

  it('evicts oldest when count exceeds MAX_CACHED_ARTICLE_DETAILS', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ cnt: MAX_CACHED_ARTICLE_DETAILS + 5 });
    await saveArticleDetail('art-new', makeArticleDetail('art-new'));
    expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    const deleteCall = mockDb.runAsync.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE/);
    expect(deleteCall[1]).toBe(5);
  });

  it('does not evict when count at or below limit', async () => {
    mockDb.getFirstAsync.mockResolvedValue({ cnt: MAX_CACHED_ARTICLE_DETAILS });
    await saveArticleDetail('art-new', makeArticleDetail('art-new'));
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
  });

  it('swallows write errors', async () => {
    mockDb.runAsync.mockRejectedValue(new Error('Write failed'));
    await expect(saveArticleDetail('art-1', makeArticleDetail('art-1'))).resolves.toBeUndefined();
  });
});

describe('MAX_CACHED_ARTICLE_DETAILS', () => {
  it('is 500', () => {
    expect(MAX_CACHED_ARTICLE_DETAILS).toBe(500);
  });
});
