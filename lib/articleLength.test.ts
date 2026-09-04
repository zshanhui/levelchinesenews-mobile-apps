import { articleLengthBounds } from './articleLength';

describe('articleLengthBounds', () => {
  it('maps short / medium / long to inclusive word-count ranges', () => {
    expect(articleLengthBounds('short')).toEqual({ minWords: 150, maxWords: 500 });
    expect(articleLengthBounds('medium')).toEqual({ minWords: 501, maxWords: 1000 });
    expect(articleLengthBounds('long')).toEqual({ minWords: 1000 });
  });
});
