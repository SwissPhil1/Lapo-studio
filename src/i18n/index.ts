import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
      dashboard: en.dashboard,
      payouts: en.payouts,
      referrers: en.referrers,
      commissions: en.commissions,
      referrals: en.referrals,
      referrerDetail: en.referrerDetail,
      lapoCash: en.lapoCash,
      prizes: en.prizes,
      status: en.status,
      common: en.common,
    },
    fr: {
      translation: fr,
      dashboard: fr.dashboard,
      payouts: fr.payouts,
      referrers: fr.referrers,
      commissions: fr.commissions,
      referrals: fr.referrals,
      referrerDetail: fr.referrerDetail,
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
