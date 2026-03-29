import { useTranslation } from 'react-i18next'

export default function GiftLapoCashPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.giftLapoCash')}</h1>
      <div className="rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">Gift LAPO Cash — new feature coming in Phase 5.</p>
      </div>
    </div>
  )
}
