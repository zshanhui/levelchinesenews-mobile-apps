import { translations } from './translations';

describe('translations catalogs', () => {
  it('German and Japanese include every English key', () => {
    const enKeys = Object.keys(translations.en);
    for (const locale of ['de', 'ja'] as const) {
      const keys = new Set(Object.keys(translations[locale]));
      const missing = enKeys.filter((k) => !keys.has(k));
      expect(missing).toEqual([]);
    }
  });
});
