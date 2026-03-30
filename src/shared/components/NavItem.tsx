import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItemProps {
  to: string
  icon: ReactNode
  label: string
  badge?: string | number
  shortcut?: string
  collapsed?: boolean
  onClick?: () => void
}

export function NavItem({ to, icon, label, badge, shortcut, collapsed, onClick }: NavItemProps) {
  const link = (
    <NavLink
      to={to}
      aria-current={undefined}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mx-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          collapsed && 'justify-center px-2',
          isActive
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )
      }
    >
      <span className="h-4 w-4 shrink-0" aria-hidden="true">{icon}</span>
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge !== undefined && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary" aria-label={`${badge}`}>
          {badge}
        </span>
      )}
      {!collapsed && shortcut && (
        <kbd className="hidden text-[10px] text-muted-foreground/60 lg:inline-block" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}
