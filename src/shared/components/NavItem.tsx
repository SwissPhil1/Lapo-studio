import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
  badge?: string | number
  shortcut?: string
}

export function NavItem({ to, icon, label, badge, shortcut }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mx-2',
          isActive
            ? 'bg-studio-active text-studio-text'
            : 'text-studio-muted hover:bg-studio-hover hover:text-studio-text'
        )
      }
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-wow-violet/20 px-2 py-0.5 text-xs font-medium text-wow-violet">
          {badge}
        </span>
      )}
      {shortcut && (
        <kbd className="hidden text-[10px] text-studio-muted lg:inline-block">
          {shortcut}
        </kbd>
      )}
    </NavLink>
  )
}
