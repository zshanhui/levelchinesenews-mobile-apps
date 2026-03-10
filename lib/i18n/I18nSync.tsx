import { useEffect } from 'react';
import { useFont } from '../FontContext';
import { i18n } from './index';

/**
 * Syncs i18n language with the native language from settings.
 * Renders nothing; must be used inside FontProvider.
 */
export function I18nSync() {
  const { nativeLanguage } = useFont();

  useEffect(() => {
    const langMap: Record<typeof nativeLanguage, string> = {
      en: 'en',
      es: 'es',
      ms: 'ms',
      ar: 'ar',
      zh: 'zh',
    };
    i18n.changeLanguage(langMap[nativeLanguage]);
  }, [nativeLanguage]);

  return null;
}
