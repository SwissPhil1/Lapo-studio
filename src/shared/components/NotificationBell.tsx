import { Bell } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  // TODO: Connect to real notifications via Supabase realtime
  const notifications: Notification[] = []
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-lg p-2 transition-colors',
          'text-studio-muted hover:bg-studio-hover hover:text-studio-text'
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-wow-coral text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-studio-border bg-studio-card p-4 shadow-xl">
          <p className="text-sm text-studio-muted">No new notifications</p>
        </div>
      )}
    </div>
  )
}
