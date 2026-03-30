import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, signOut, role } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('common.accessibility.userMenu')}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
          'hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-card p-1 shadow-xl">
          <button
            role="menuitem"
            onClick={() => {
              navigate('/settings/profile')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <User className="h-4 w-4" aria-hidden="true" />
            {t('nav.profile')}
          </button>
          <button
            role="menuitem"
            onClick={() => {
              navigate('/settings')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            {t('nav.settings')}
          </button>
          <div className="my-1 border-t border-border" role="separator" />
          <button
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
