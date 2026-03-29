import { useTranslation } from 'react-i18next'

export default function PayoutsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.payouts')}</h1>
      <div className="rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">Payouts management — migrating from lapo-payout-pro.</p>
      </div>
    </div>
  )
}
