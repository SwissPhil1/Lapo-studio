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
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )
      }
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
      {shortcut && (
        <kbd className="hidden text-[10px] text-muted-foreground/60 lg:inline-block">
          {shortcut}
        </kbd>
      )}
    </NavLink>
  )
}
