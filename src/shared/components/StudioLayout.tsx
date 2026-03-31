import { useState, useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { NavGroup } from './NavGroup'
import { NavItem } from './NavItem'
import { UserMenu } from './UserMenu'
import { Breadcrumb } from './Breadcrumb'
import { NotificationBell } from './NotificationBell'
import { CommandPalette } from './CommandPalette'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { motion, AnimatePresence, PageTransition } from '@/shared/components/motion'
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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Zap,
  ClipboardList,
  Activity,
  Star,
} from 'lucide-react'

export function StudioLayout() {
  const { isAdmin, isCRM } = useAuth()
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hoverExpanded, setHoverExpanded] = useState(false)

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return
    hoverTimerRef.current = setTimeout(() => {
      setHoverExpanded(true)
    }, 200)
  }, [collapsed])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setHoverExpanded(false)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Auto-collapse sidebar after 3 seconds on desktop if expanded
  const hasAutoCollapsed = useRef(false)
  useEffect(() => {
    if (hasAutoCollapsed.current || collapsed) return
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (!isDesktop) return

    const timer = setTimeout(() => {
      setCollapsed(true)
      localStorage.setItem('sidebar-collapsed', 'true')
      hasAutoCollapsed.current = true
    }, 3000)

    return () => clearTimeout(timer)
  }, [collapsed])

  function renderSidebarContent(isMobile: boolean) {
    const isCollapsed = isMobile ? false : (collapsed && !hoverExpanded)

    return (
      <>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-wow-coral to-wow-violet shadow-md glow-violet">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground">
              LAPO <span className="font-normal text-muted-foreground">Studio</span>
            </span>
          )}
        </div>

        {/* Search trigger */}
        <div className={cn('px-3 pt-3 pb-1', isCollapsed && 'px-2')}>
          <button
            onClick={() =>
              document.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true })
              )
            }
            className={cn(
              'flex w-full items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-muted-foreground',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{t('nav.search')}</span>
                <kbd className="text-[10px] text-muted-foreground/60">⌘K</kbd>
              </>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-1 py-3">
          {/* Admin Section */}
          {isAdmin && (
            <NavGroup label={t('nav.admin')} collapsed={isCollapsed}>
              <NavItem
                to="/admin/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label={t('nav.dashboard')}
                shortcut="⌘1"
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/admin/referrers"
                icon={<Users className="h-4 w-4" />}
                label={t('nav.referrers')}
                shortcut="⌘2"
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/admin/commissions"
                icon={<Wallet className="h-4 w-4" />}
                label={t('nav.commissions')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/admin/payouts"
                icon={<FileText className="h-4 w-4" />}
                label={t('nav.payouts')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/admin/gift-lapo-cash"
                icon={<Gift className="h-4 w-4" />}
                label={t('nav.giftLapoCash')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/admin/prizes"
                icon={<Trophy className="h-4 w-4" />}
                label={t('nav.prizes')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
            </NavGroup>
          )}

          {/* CRM Section */}
          {isCRM && (
            <NavGroup label={t('nav.crm')} collapsed={isCollapsed}>
              <NavItem
                to="/crm/dashboard"
                icon={<BarChart3 className="h-4 w-4" />}
                label={t('nav.crmDashboard')}
                shortcut="⌘3"
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/patients"
                icon={<UserCircle className="h-4 w-4" />}
                label={t('nav.patients')}
                shortcut="⌘4"
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/pipeline"
                icon={<Kanban className="h-4 w-4" />}
                label={t('nav.pipeline')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/appointments"
                icon={<Calendar className="h-4 w-4" />}
                label={t('nav.appointments')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/communications"
                icon={<MessageSquare className="h-4 w-4" />}
                label={t('nav.communications')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/statistics"
                icon={<Activity className="h-4 w-4" />}
                label={t('nav.statistics', { defaultValue: 'Statistics' })}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/satisfaction"
                icon={<Star className="h-4 w-4" />}
                label={t('nav.satisfaction', { defaultValue: 'Satisfaction' })}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
              <NavItem
                to="/crm/workflows"
                icon={<Zap className="h-4 w-4" />}
                label={t('nav.workflows')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
            </NavGroup>
          )}

          {/* Settings */}
          <NavGroup label={t('nav.system')} collapsed={isCollapsed}>
            <NavItem
              to="/settings"
              icon={<Settings className="h-4 w-4" />}
              label={t('nav.settings')}
              collapsed={isCollapsed}
              onClick={isMobile ? closeMobile : undefined}
            />
            {isAdmin && (
              <NavItem
                to="/admin/audit-trail"
                icon={<ClipboardList className="h-4 w-4" />}
                label={t('nav.auditTrail')}
                collapsed={isCollapsed}
                onClick={isMobile ? closeMobile : undefined}
              />
            )}
          </NavGroup>
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <div className="border-t border-sidebar-border px-3 py-2">
            <button
              onClick={toggleCollapsed}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isCollapsed && 'justify-center px-0'
              )}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  <span>{t('nav.collapse', 'Collapse')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* User Menu */}
        <div className="border-t border-sidebar-border p-3">
          <UserMenu collapsed={isCollapsed} />
        </div>
      </>
    )
  }

  const location = useLocation()

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {t('common.accessibility.skipToContent')}
        </a>

        {/* Desktop Sidebar — animated width on collapse, expands on hover */}
        <motion.aside
          animate={{ width: (collapsed && !hoverExpanded) ? 64 : 256 }}
          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
          className={cn(
            'hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar overflow-hidden',
            hoverExpanded && 'absolute inset-y-0 left-0 z-40 shadow-xl'
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {renderSidebarContent(false)}
        </motion.aside>
        {/* Spacer to preserve layout when sidebar is collapsed + hover-expanded (absolute) */}
        {collapsed && (
          <div className="hidden lg:block shrink-0" style={{ width: 64 }} />
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50"
                onClick={closeMobile}
              />
              {/* Sidebar */}
              <motion.aside
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar shadow-xl"
              >
                {/* Close button */}
                <button
                  onClick={closeMobile}
                  className="absolute right-2 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
                {renderSidebarContent(true)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Breadcrumb />
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Page content with route transition */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>

        {/* Command Palette */}
        <CommandPalette />
      </div>
    </TooltipProvider>
  )
}
