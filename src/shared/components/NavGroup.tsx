import { useState, useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface NavGroupProps {
  label: string
  children: ReactNode
  defaultOpen?: boolean
  collapsed?: boolean
}

export function NavGroup({ label, children, defaultOpen = true, collapsed }: NavGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  if (collapsed) {
    return <div className="mb-1 space-y-0.5">{children}</div>
  }

  return (
    <div className="mb-1" role="group" aria-labelledby={`${contentId}-label`}>
      <button
        id={`${contentId}-label`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          'flex w-full items-center justify-between px-3 py-1.5',
          'text-xs font-semibold uppercase tracking-wider',
          'text-muted-foreground hover:text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-md'
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            !open && '-rotate-90'
          )}
          aria-hidden="true"
        />
      </button>
      {open && <div id={contentId} className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  )
}
