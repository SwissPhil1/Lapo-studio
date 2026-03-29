import { useTranslation } from 'react-i18next'
import { UserCircle, CalendarCheck, TrendingUp, Users } from 'lucide-react'

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-studio-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-studio-text">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function CRMDashboard() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('crm.dashboard.title')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t('crm.dashboard.totalPatients')}
          value="—"
          icon={UserCircle}
          color="bg-wow-cyan/10 text-wow-cyan"
        />
        <MetricCard
          label={t('crm.dashboard.newThisMonth')}
          value="—"
          icon={Users}
          color="bg-wow-lime/10 text-wow-lime"
        />
        <MetricCard
          label={t('crm.dashboard.appointments')}
          value="—"
          icon={CalendarCheck}
          color="bg-wow-pink/10 text-wow-pink"
        />
        <MetricCard
          label={t('crm.dashboard.conversionRate')}
          value="—"
          icon={TrendingUp}
          color="bg-wow-violet/10 text-wow-violet"
        />
      </div>

      <div className="mt-8 rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">
          Connect to Supabase to see live data. CRM module pages will be migrated from harmony-hub in Phase 2.
        </p>
      </div>
    </div>
  )
}
