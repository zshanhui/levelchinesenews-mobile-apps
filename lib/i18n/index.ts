import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    es: { translation: translations.es },
    ms: { translation: translations.ms },
    id: { translation: translations.id },
    vi: { translation: translations.vi },
    ru: { translation: translations.ru },
    ar: { translation: translations.ar },
    zh: { translation: translations.zh },
    de: { translation: translations.de },
    ja: { translation: translations.ja },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React Native does not need HTML escaping
  },
});

export { i18n };
export { useTranslation } from 'react-i18next';
