import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/shared/lib/utils'
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
import type { ReactNode } from 'react'

interface Command {
  id: string
  label: string
  icon: ReactNode
  action: () => void
  section: string
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isAdmin, isCRM } = useAuth()

  const commands: Command[] = [
    // Admin commands
    ...(isAdmin
      ? [
          {
            id: 'admin-dash',
            label: t('nav.dashboard'),
            icon: <LayoutDashboard className="h-4 w-4" />,
            action: () => navigate('/admin/dashboard'),
            section: t('nav.admin'),
            keywords: ['home', 'overview'],
          },
          {
            id: 'admin-referrers',
            label: t('nav.referrers'),
            icon: <Users className="h-4 w-4" />,
            action: () => navigate('/admin/referrers'),
            section: t('nav.admin'),
            keywords: ['partners', 'affiliates'],
          },
          {
            id: 'admin-commissions',
            label: t('nav.commissions'),
            icon: <Wallet className="h-4 w-4" />,
            action: () => navigate('/admin/commissions'),
            section: t('nav.admin'),
            keywords: ['earnings', 'money'],
          },
          {
            id: 'admin-payouts',
            label: t('nav.payouts'),
            icon: <FileText className="h-4 w-4" />,
            action: () => navigate('/admin/payouts'),
            section: t('nav.admin'),
            keywords: ['payments', 'transfers'],
          },
          {
            id: 'admin-gift',
            label: t('nav.giftLapoCash'),
            icon: <Gift className="h-4 w-4" />,
            action: () => navigate('/admin/gift-lapo-cash'),
            section: t('nav.admin'),
            keywords: ['bonus', 'reward'],
          },
          {
            id: 'admin-prizes',
            label: t('nav.prizes'),
            icon: <Trophy className="h-4 w-4" />,
            action: () => navigate('/admin/prizes'),
            section: t('nav.admin'),
            keywords: ['rewards', 'contests'],
          },
        ]
      : []),
    // CRM commands
    ...(isCRM
      ? [
          {
            id: 'crm-dash',
            label: t('nav.crmDashboard'),
            icon: <BarChart3 className="h-4 w-4" />,
            action: () => navigate('/crm/dashboard'),
            section: t('nav.crm'),
            keywords: ['analytics', 'stats'],
          },
          {
            id: 'crm-patients',
            label: t('nav.patients'),
            icon: <UserCircle className="h-4 w-4" />,
            action: () => navigate('/crm/patients'),
            section: t('nav.crm'),
            keywords: ['clients', 'contacts'],
          },
          {
            id: 'crm-pipeline',
            label: t('nav.pipeline'),
            icon: <Kanban className="h-4 w-4" />,
            action: () => navigate('/crm/pipeline'),
            section: t('nav.crm'),
            keywords: ['kanban', 'stages', 'funnel'],
          },
          {
            id: 'crm-appointments',
            label: t('nav.appointments'),
            icon: <Calendar className="h-4 w-4" />,
            action: () => navigate('/crm/appointments'),
            section: t('nav.crm'),
            keywords: ['bookings', 'schedule'],
          },
          {
            id: 'crm-comms',
            label: t('nav.communications'),
            icon: <MessageSquare className="h-4 w-4" />,
            action: () => navigate('/crm/communications'),
            section: t('nav.crm'),
            keywords: ['messages', 'sms', 'email'],
          },
        ]
      : []),
    // System
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/settings'),
      section: t('nav.system'),
      keywords: ['preferences', 'config'],
    },
  ]

  const filtered = query
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.section.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        )
      })
    : commands

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const execute = (cmd: Command) => {
    cmd.action()
    setOpen(false)
    setQuery('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && filtered[selected]) {
      execute(filtered[selected])
    }
  }

  if (!open) return null

  const sections = [...new Set(filtered.map((c) => c.section))]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-studio-border bg-studio-card shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-studio-border px-4">
          <Search className="h-5 w-5 text-studio-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className="h-14 flex-1 bg-transparent text-studio-text placeholder:text-studio-muted outline-none"
          />
          <kbd className="rounded border border-studio-border px-1.5 py-0.5 text-[10px] text-studio-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-studio-muted">
              {t('commandPalette.noResults')}
            </p>
          ) : (
            sections.map((section) => (
              <div key={section}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-studio-muted">
                  {section}
                </p>
                {filtered
                  .filter((c) => c.section === section)
                  .map((cmd) => {
                    const idx = filtered.indexOf(cmd)
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelected(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === selected
                            ? 'bg-wow-violet/20 text-studio-text'
                            : 'text-studio-muted hover:text-studio-text'
                        )}
                      >
                        {cmd.icon}
                        {cmd.label}
                      </button>
                    )
                  })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
