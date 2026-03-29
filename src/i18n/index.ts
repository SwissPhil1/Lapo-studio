import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

// All namespaces are flattened into the 'translation' default namespace.
// Components using useTranslation("lapoCash") will resolve keys like
// t("pageTitle") → translation.lapoCash.pageTitle thanks to the
// fallbackNS and keySeparator config.
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
      lapoCash: en.lapoCash,
      prizes: en.prizes,
      status: en.status,
      common: en.common,
    },
    fr: {
      translation: fr,
      lapoCash: fr.lapoCash,
      prizes: fr.prizes,
      status: fr.status,
      common: fr.common,
    },
  },
  lng: localStorage.getItem('lapo-lang') ?? 'en',
  fallbackLng: 'en',
  fallbackNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
