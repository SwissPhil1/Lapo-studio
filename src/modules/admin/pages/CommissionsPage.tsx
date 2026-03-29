import { useTranslation } from 'react-i18next'

export default function CommissionsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.commissions')}</h1>
      <div className="rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">Commissions management — migrating from lapo-payout-pro.</p>
      </div>
    </div>
  )
}
