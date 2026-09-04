import { NativeLanguage } from './nativeLanguage';
import { formatTopicChipLabel } from './articleTopicLabels';

describe('formatTopicChipLabel', () => {
  it('wraps 4-character Chinese topics as two characters per line', () => {
    expect(formatTopicChipLabel('中国城市', NativeLanguage.ZH)).toBe(
      '中国\n城市',
    );
    expect(formatTopicChipLabel('芯片行业', NativeLanguage.ZH)).toBe(
      '芯片\n行业',
    );
    expect(formatTopicChipLabel('AI时代', NativeLanguage.ZH)).toBe('AI\n时代');
  });

  it('leaves other lengths and non-Chinese UI labels unchanged', () => {
    expect(formatTopicChipLabel('食品', NativeLanguage.ZH)).toBe('食品');
    expect(formatTopicChipLabel('新加坡生活', NativeLanguage.ZH)).toBe(
      '新加坡生活',
    );
    expect(formatTopicChipLabel('Chinese Cities', NativeLanguage.EN)).toBe(
      'Chinese Cities',
    );
  });
});
