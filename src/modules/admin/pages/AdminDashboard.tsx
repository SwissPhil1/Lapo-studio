import { useTranslation } from 'react-i18next'
import { Users, Wallet, FileText, TrendingUp } from 'lucide-react'

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  icon: React.ElementType
  trend?: string
}) {
  return (
    <div className="rounded-xl border border-studio-border bg-studio-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-studio-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-studio-text">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-wow-violet/10 p-3">
          <Icon className="h-5 w-5 text-wow-violet" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('admin.dashboard.title')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t('admin.dashboard.totalReferrers')}
          value="—"
          icon={Users}
          trend="+12%"
        />
        <MetricCard
          label={t('admin.dashboard.activeReferrers')}
          value="—"
          icon={Users}
        />
        <MetricCard
          label={t('admin.dashboard.totalCommissions')}
          value="—"
          icon={Wallet}
        />
        <MetricCard
          label={t('admin.dashboard.pendingPayouts')}
          value="—"
          icon={FileText}
        />
      </div>

      <div className="mt-8 rounded-xl border border-studio-border bg-studio-card p-6">
        <p className="text-studio-muted">
          Connect to Supabase to see live data. Admin module pages will be migrated from lapo-payout-pro in Phase 2.
        </p>
      </div>
    </div>
  )
}
