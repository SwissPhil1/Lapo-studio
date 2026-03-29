import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Settings, User } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function UserMenu() {
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
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
          'hover:bg-studio-hover'
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wow-violet text-xs font-bold text-white">
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
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-studio-text truncate">
            {user.full_name}
          </p>
          <p className="text-xs text-studio-muted capitalize">{role}</p>
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-studio-border bg-studio-card p-1 shadow-xl">
          <button
            onClick={() => {
              navigate('/settings/profile')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-studio-muted hover:bg-studio-hover hover:text-studio-text"
          >
            <User className="h-4 w-4" />
            {t('nav.profile')}
          </button>
          <button
            onClick={() => {
              navigate('/settings')
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-studio-muted hover:bg-studio-hover hover:text-studio-text"
          >
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
          </button>
          <div className="my-1 border-t border-studio-border" />
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
