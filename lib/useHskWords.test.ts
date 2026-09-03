import { loadOrDownloadHskWords } from './useHskWords';
import { fetchHskWords } from './api';
import { loadCachedHskWords, saveCachedHskWords } from './hskWordsCache';

jest.mock('./api', () => ({
  fetchHskWords: jest.fn(),
}));

jest.mock('./hskWordsCache', () => {
  const actual = jest.requireActual('./hskWordsCache');
  return {
    ...actual,
    loadCachedHskWords: jest.fn(),
    saveCachedHskWords: jest.fn(),
  };
});

const mockFetch = fetchHskWords as jest.Mock;
const mockLoad = loadCachedHskWords as jest.Mock;
const mockSave = saveCachedHskWords as jest.Mock;

beforeEach(() => {
  mockFetch.mockReset();
  mockLoad.mockReset();
  mockSave.mockReset();
});

describe('loadOrDownloadHskWords', () => {
  const words = { 中国: 1, 经济: 4 };

  it('returns any existing cache without fetching', async () => {
    mockLoad.mockResolvedValue({ words, cachedAt: '2020-01-01T00:00:00Z' });

    await expect(loadOrDownloadHskWords()).resolves.toEqual(words);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('fetches and saves when the cache is missing', async () => {
    mockLoad.mockResolvedValue(null);
    mockFetch.mockResolvedValue({ total: 2, words });
    mockSave.mockResolvedValue(undefined);

    await expect(loadOrDownloadHskWords()).resolves.toEqual(words);
    expect(mockSave).toHaveBeenCalledWith(words);
  });

  it('returns null when there is no cache and fetch fails', async () => {
    mockLoad.mockResolvedValue(null);
    mockFetch.mockRejectedValue(new Error('network'));

    await expect(loadOrDownloadHskWords()).resolves.toBeNull();
  });
});
