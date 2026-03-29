import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface NavGroupProps {
  label: string
  children: ReactNode
  defaultOpen?: boolean
}

export function NavGroup({ label, children, defaultOpen = true }: NavGroupProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-1.5',
          'text-xs font-semibold uppercase tracking-wider',
          'text-muted-foreground hover:text-foreground transition-colors'
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            !open && '-rotate-90'
          )}
        />
      </button>
      {open && <div className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  )
}
