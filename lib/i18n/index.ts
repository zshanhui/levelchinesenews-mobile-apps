import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    es: { translation: translations.es },
    ms: { translation: translations.ms },
    id: { translation: translations.en },
    ru: { translation: translations.en },
    ar: { translation: translations.ar },
    zh: { translation: translations.zh },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React Native does not need HTML escaping
  },
});

export { i18n };
export { useTranslation } from 'react-i18next';
