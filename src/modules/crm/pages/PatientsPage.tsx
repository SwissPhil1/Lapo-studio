import { useTranslation } from 'react-i18next'

export default function PatientsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.patients')}</h1>
      <div className="rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">Patient management — migrating from harmony-hub.</p>
      </div>
    </div>
  )
}
