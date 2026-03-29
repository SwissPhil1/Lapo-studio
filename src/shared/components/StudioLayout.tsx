import { Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { NavGroup } from './NavGroup'
import { NavItem } from './NavItem'
import { UserMenu } from './UserMenu'
import { Breadcrumb } from './Breadcrumb'
import { NotificationBell } from './NotificationBell'
import { CommandPalette } from './CommandPalette'
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Gift,
  Trophy,
  UserCircle,
  Kanban,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react'

export function StudioLayout() {
  const { isAdmin, isCRM } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-wow-coral to-wow-violet shadow-md glow-violet">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <span className="text-lg font-bold text-foreground">
            LAPO <span className="font-normal text-muted-foreground">Studio</span>
          </span>
        </div>

        {/* Search trigger */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() =>
              document.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true })
              )
            }
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">{t('nav.search')}</span>
            <kbd className="text-[10px] text-muted-foreground/60">⌘K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-1 py-3">
          {/* Admin Section */}
          {isAdmin && (
            <NavGroup label={t('nav.admin')}>
              <NavItem
                to="/admin/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label={t('nav.dashboard')}
                shortcut="⌘1"
              />
              <NavItem
                to="/admin/referrers"
                icon={<Users className="h-4 w-4" />}
                label={t('nav.referrers')}
                shortcut="⌘2"
              />
              <NavItem
                to="/admin/commissions"
                icon={<Wallet className="h-4 w-4" />}
                label={t('nav.commissions')}
              />
              <NavItem
                to="/admin/payouts"
                icon={<FileText className="h-4 w-4" />}
                label={t('nav.payouts')}
              />
              <NavItem
                to="/admin/gift-lapo-cash"
                icon={<Gift className="h-4 w-4" />}
                label={t('nav.giftLapoCash')}
              />
              <NavItem
                to="/admin/prizes"
                icon={<Trophy className="h-4 w-4" />}
                label={t('nav.prizes')}
              />
            </NavGroup>
          )}

          {/* CRM Section */}
          {isCRM && (
            <NavGroup label={t('nav.crm')}>
              <NavItem
                to="/crm/dashboard"
                icon={<BarChart3 className="h-4 w-4" />}
                label={t('nav.crmDashboard')}
                shortcut="⌘3"
              />
              <NavItem
                to="/crm/patients"
                icon={<UserCircle className="h-4 w-4" />}
                label={t('nav.patients')}
                shortcut="⌘4"
              />
              <NavItem
                to="/crm/pipeline"
                icon={<Kanban className="h-4 w-4" />}
                label={t('nav.pipeline')}
              />
              <NavItem
                to="/crm/appointments"
                icon={<Calendar className="h-4 w-4" />}
                label={t('nav.appointments')}
              />
              <NavItem
                to="/crm/communications"
                icon={<MessageSquare className="h-4 w-4" />}
                label={t('nav.communications')}
              />
            </NavGroup>
          )}

          {/* Settings */}
          <NavGroup label={t('nav.system')}>
            <NavItem
              to="/settings"
              icon={<Settings className="h-4 w-4" />}
              label={t('nav.settings')}
            />
          </NavGroup>
        </nav>

        {/* User Menu */}
        <div className="border-t border-sidebar-border p-3">
          <UserMenu />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  )
}
