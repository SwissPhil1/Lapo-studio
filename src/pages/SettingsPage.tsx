import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Globe, Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lapo-lang', next)
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t('nav.settings')}</h1>

      <div className="space-y-4">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('nav.profile')}</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t('common.name')}:</span>{' '}
              <span className="text-foreground">{user?.full_name ?? '—'}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t('common.email')}:</span>{' '}
              <span className="text-foreground">{user?.email ?? '—'}</span>
            </p>
            <p>
              <span className="text-muted-foreground">{t('common.role')}:</span>{' '}
              <span className="capitalize text-foreground">{user?.role ?? '—'}</span>
            </p>
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('theme.title', { defaultValue: 'Theme' })}</h2>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, icon: Sun, label: t('theme.light', { defaultValue: 'Light' }) },
              { value: 'dark' as const, icon: Moon, label: t('theme.dark', { defaultValue: 'Dark' }) },
              { value: 'system' as const, icon: Monitor, label: t('theme.system', { defaultValue: 'System' }) },
            ]).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                  theme === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t('common.language')}</h2>
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-accent"
          >
            <Globe className="h-4 w-4" />
            {t('common.switchLanguage')}
          </button>
        </div>
      </div>
    </div>
  )
}
