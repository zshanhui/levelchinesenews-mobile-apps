import { useEffect } from 'react';
import { useNativeLanguage } from '../NativeLanguageContext';
import { i18n } from './index';

/**
 * Syncs i18n language with the native language from settings.
 * Renders nothing; must be used inside NativeLanguageProvider.
 */
export function I18nSync() {
  const { nativeLanguage } = useNativeLanguage();

  useEffect(() => {
    i18n.changeLanguage(nativeLanguage);
  }, [nativeLanguage]);

  return null;
}
