import { hasCjkIdeograph, isChineseWord } from './text-utils';

describe('hasCjkIdeograph', () => {
  it('is true for Chinese words and mixed numeral tokens', () => {
    expect(hasCjkIdeograph('中国')).toBe(true);
    expect(hasCjkIdeograph('的')).toBe(true);
    expect(hasCjkIdeograph('3万')).toBe(true);
  });

  it('is false for Latin, numbers, and punctuation-only tokens', () => {
    expect(hasCjkIdeograph('Apple')).toBe(false);
    expect(hasCjkIdeograph('OpenAI GPT-4')).toBe(false);
    expect(hasCjkIdeograph('(AI)')).toBe(false);
    expect(hasCjkIdeograph('D.E. Shaw')).toBe(false);
    expect(hasCjkIdeograph('COVID-19')).toBe(false);
    expect(hasCjkIdeograph('$3.14')).toBe(false);
    expect(hasCjkIdeograph('42')).toBe(false);
    expect(hasCjkIdeograph('。')).toBe(false);
  });
});

describe('isChineseWord', () => {
  it('requires the whole token to be CJK ideographs', () => {
    expect(isChineseWord('中国')).toBe(true);
    expect(isChineseWord('3万')).toBe(false);
    expect(isChineseWord('Apple')).toBe(false);
  });
});
