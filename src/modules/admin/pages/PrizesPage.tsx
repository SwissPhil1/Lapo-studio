import { useTranslation } from 'react-i18next'

export default function PrizesPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.prizes')}</h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-muted-foreground">Prize Management — new feature coming in Phase 5.</p>
      </div>
    </div>
  )
}
