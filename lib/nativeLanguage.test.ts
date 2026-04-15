import {
  NativeLanguage,
  parseStoredNativeLanguage,
} from './nativeLanguage';

describe('parseStoredNativeLanguage', () => {
  it('returns null for empty values', () => {
    expect(parseStoredNativeLanguage(null)).toBeNull();
    expect(parseStoredNativeLanguage('')).toBeNull();
  });

  it('returns supported ISO codes unchanged', () => {
    expect(parseStoredNativeLanguage(NativeLanguage.EN)).toBe(NativeLanguage.EN);
    expect(parseStoredNativeLanguage(NativeLanguage.ES)).toBe(NativeLanguage.ES);
    expect(parseStoredNativeLanguage(NativeLanguage.MS)).toBe(NativeLanguage.MS);
    expect(parseStoredNativeLanguage(NativeLanguage.ID)).toBe(NativeLanguage.ID);
    expect(parseStoredNativeLanguage(NativeLanguage.VI)).toBe(NativeLanguage.VI);
    expect(parseStoredNativeLanguage(NativeLanguage.RU)).toBe(NativeLanguage.RU);
    expect(parseStoredNativeLanguage(NativeLanguage.AR)).toBe(NativeLanguage.AR);
    expect(parseStoredNativeLanguage(NativeLanguage.ZH)).toBe(NativeLanguage.ZH);
  });

  it('maps legacy stored values to supported codes', () => {
    expect(parseStoredNativeLanguage('english')).toBe(NativeLanguage.EN);
    expect(parseStoredNativeLanguage('spanish')).toBe(NativeLanguage.ES);
    expect(parseStoredNativeLanguage('bahasa-malay')).toBe(NativeLanguage.MS);
    expect(parseStoredNativeLanguage('indonesian')).toBe(NativeLanguage.ID);
    expect(parseStoredNativeLanguage('vietnamese')).toBe(NativeLanguage.VI);
    expect(parseStoredNativeLanguage('russian')).toBe(NativeLanguage.RU);
    expect(parseStoredNativeLanguage('arabic')).toBe(NativeLanguage.AR);
    expect(parseStoredNativeLanguage('chinese')).toBe(NativeLanguage.ZH);
  });

  it('returns null for unknown values', () => {
    expect(parseStoredNativeLanguage('fr')).toBeNull();
    expect(parseStoredNativeLanguage('EN')).toBeNull();
    expect(parseStoredNativeLanguage('traditional-chinese')).toBeNull();
  });
});
