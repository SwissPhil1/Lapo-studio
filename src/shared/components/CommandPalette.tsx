import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/shared/lib/supabase'
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
  Loader2,
} from 'lucide-react'
import type { ReactNode } from 'react'

interface Command {
  id: string
  label: string
  icon: ReactNode
  action: () => void
  section: string
  keywords?: string[]
  subtitle?: string
}

interface PatientResult {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [patientResults, setPatientResults] = useState<PatientResult[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const filteredCommands = query
    ? commands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.section.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        )
      })
    : commands

  // Convert patient results to Command items
  const patientCommands: Command[] = patientResults.map((p) => {
    const details = [p.email, p.phone, p.date_of_birth].filter(Boolean).join(' · ')
    return {
      id: `patient-${p.id}`,
      label: `${p.first_name} ${p.last_name}`,
      subtitle: details || undefined,
      icon: <UserCircle className="h-4 w-4" />,
      action: () => navigate(`/crm/patients/${p.id}`),
      section: t('nav.patients', { defaultValue: 'Patients' }),
    }
  })

  // All items: patient results first (when searching), then commands
  const allItems = query.length >= 2 ? [...patientCommands, ...filteredCommands] : filteredCommands

  // Search patients when query changes (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (!open || query.length < 2 || !isCRM) {
      setPatientResults([])
      setSearchingPatients(false)
      return
    }

    setSearchingPatients(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const q = query.trim()
      const digitsOnly = q.replace(/\D/g, '')
      let orConditions = `first_name.ilike.%${q}%,last_name.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%`
      if (digitsOnly.length >= 3) {
        orConditions += `,phone.ilike.%${digitsOnly}%,normalized_phone.ilike.%${digitsOnly}%`
      }
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone, date_of_birth')
        .or(orConditions)
        .limit(8)

      setPatientResults(data || [])
      setSearchingPatients(false)
    }, 250)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, open, isCRM])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery('')
        setSelected(0)
        setPatientResults([])
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
    setPatientResults([])
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && allItems[selected]) {
      execute(allItems[selected])
    }
  }

  if (!open) return null

  const sections = [...new Set(allItems.map((c) => c.section))]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className="h-14 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          />
          {searchingPatients && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {allItems.length === 0 && !searchingPatients ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </p>
          ) : (
            sections.map((section) => (
              <div key={section}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section}
                </p>
                {allItems
                  .filter((c) => c.section === section)
                  .map((cmd) => {
                    const idx = allItems.indexOf(cmd)
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelected(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          idx === selected
                            ? 'bg-primary/15 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {cmd.icon}
                        <div className="min-w-0 text-left">
                          <span>{cmd.label}</span>
                          {cmd.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{cmd.subtitle}</p>
                          )}
                        </div>
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
