import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

export function Breadcrumb() {
  const location = useLocation()
  const { t } = useTranslation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  // Filter out UUID segments (dynamic IDs like referrer/:id)
  const displaySegments = segments.filter(s => !UUID_REGEX.test(s))

  return (
    <nav aria-label={t('common.accessibility.breadcrumbNavigation')} className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm" aria-label={t('common.accessibility.homePage')}>
        <Home className="h-4 w-4" aria-hidden="true" />
      </Link>
      {displaySegments.map((segment, i) => {
        // Build the actual path including any UUIDs that follow this segment
        const segmentIndex = segments.indexOf(segment)
        const path = '/' + segments.slice(0, segmentIndex + 1).join('/')
        // If next segment is a UUID, include it in the link path
        const nextSegment = segments[segmentIndex + 1]
        const linkPath = nextSegment && UUID_REGEX.test(nextSegment)
          ? '/' + segments.slice(0, segmentIndex + 2).join('/')
          : path
        const isLast = i === displaySegments.length - 1
        const camelSegment = segment.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        const label = t(`nav.${camelSegment}`, { defaultValue: segment.replace(/-/g, ' ') })

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="capitalize text-foreground font-medium">
                {label}
              </span>
            ) : (
              <Link
                to={linkPath}
                className="capitalize hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
