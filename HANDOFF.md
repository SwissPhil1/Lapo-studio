# LAPO Studio - Phase 1 Foundation (Completed)

## What Was Done

The Lapo-studio repo was empty. A complete Phase 1 foundation was built from scratch and pushed to branch `claude/lapo-studio-phase-1-v3hrQ`.

## Tech Stack Installed
- React 18 + TypeScript + Vite 5 (v8.0.3)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- TanStack Query v5
- React Router DOM
- Supabase JS client
- i18next + react-i18next (EN/FR)
- @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities
- Radix UI primitives (dialog, dropdown-menu, tooltip, avatar, separator, scroll-area, slot, popover, select)
- lucide-react icons
- clsx + tailwind-merge + class-variance-authority

## Project Structure
```
src/
├── contexts/
│   └── AuthContext.tsx              # Full RBAC auth with Supabase
├── i18n/
│   ├── index.ts                     # i18next config, persists lang to localStorage
│   └── locales/
│       ├── en.json                  # English translations
│       └── fr.json                  # French translations
├── modules/
│   ├── admin/
│   │   ├── components/              # (empty, ready for migration)
│   │   └── pages/
│   │       ├── AdminDashboard.tsx   # Metric cards (Total/Active Referrers, Commissions, Payouts)
│   │       ├── ReferrersPage.tsx    # Placeholder
│   │       ├── CommissionsPage.tsx  # Placeholder
│   │       ├── PayoutsPage.tsx      # Placeholder
│   │       ├── GiftLapoCashPage.tsx # Placeholder (Phase 5 feature)
│   │       └── PrizesPage.tsx       # Placeholder (Phase 5 feature)
│   └── crm/
│       ├── components/              # (empty, ready for migration)
│       └── pages/
│           ├── CRMDashboard.tsx     # Metric cards (Patients, New/Month, Appointments, Conversion)
│           ├── PatientsPage.tsx     # Placeholder
│           ├── PipelinePage.tsx     # Placeholder (will use @dnd-kit)
│           ├── AppointmentsPage.tsx # Placeholder
│           └── CommunicationsPage.tsx # Placeholder
├── pages/
│   ├── LoginPage.tsx                # Gradient CTA, Supabase signInWithPassword
│   └── SettingsPage.tsx             # Profile display + language toggle
├── shared/
│   ├── components/
│   │   ├── StudioLayout.tsx         # Dark sidebar layout with Admin + CRM nav sections, top bar
│   │   ├── CommandPalette.tsx       # Cmd+K with keyboard nav, search, grouped sections
│   │   ├── ProtectedRoute.tsx       # requireAdmin / requireCRM flags
│   │   ├── NavGroup.tsx             # Collapsible nav section with chevron
│   │   ├── NavItem.tsx              # NavLink with icon, badge, keyboard shortcut display
│   │   ├── UserMenu.tsx             # Avatar + dropdown (profile, settings, sign out)
│   │   ├── Breadcrumb.tsx           # Auto-generated from route path with i18n
│   │   └── NotificationBell.tsx     # Bell icon with unread count (ready for Supabase realtime)
│   ├── hooks/                       # (empty, ready)
│   ├── lib/
│   │   ├── supabase.ts              # createClient using VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
│   │   └── utils.ts                 # cn() = clsx + twMerge
│   └── types/
│       └── auth.ts                  # AppRole, AppUser, canAccessAdmin(), canAccessCRM()
├── App.tsx                          # QueryClientProvider > BrowserRouter > AuthProvider > Routes
├── main.tsx                         # Imports i18n, renders App in StrictMode
└── index.css                        # Tailwind v4 @theme with Electric Sunset colors
```

## RBAC System
```typescript
type AppRole = 'admin' | 'clinic_staff' | 'referrer' | 'patient' | 'user'
canAccessAdmin(role) → role === 'admin'
canAccessCRM(role) → role === 'admin' || role === 'clinic_staff'
```
AuthContext fetches role from `profiles` table in Supabase. ProtectedRoute redirects to `/login` if unauthenticated, to `/` if unauthorized.

## Route Map
| Path | Guard | Component |
|------|-------|-----------|
| `/login` | Public | LoginPage |
| `/` | Auth | Redirects to `/admin/dashboard` |
| `/admin/dashboard` | requireAdmin | AdminDashboard |
| `/admin/referrers` | requireAdmin | ReferrersPage |
| `/admin/commissions` | requireAdmin | CommissionsPage |
| `/admin/payouts` | requireAdmin | PayoutsPage |
| `/admin/gift-lapo-cash` | requireAdmin | GiftLapoCashPage |
| `/admin/prizes` | requireAdmin | PrizesPage |
| `/crm/dashboard` | requireCRM | CRMDashboard |
| `/crm/patients` | requireCRM | PatientsPage |
| `/crm/pipeline` | requireCRM | PipelinePage |
| `/crm/appointments` | requireCRM | AppointmentsPage |
| `/crm/communications` | requireCRM | CommunicationsPage |
| `/settings` | Auth | SettingsPage |
| `/settings/profile` | Auth | SettingsPage |

All pages are lazy-loaded via `React.lazy()`.

## Electric Sunset Theme (Tailwind v4 @theme)
```
--color-wow-coral: #FF6B6B
--color-wow-pink: #FF2E93
--color-wow-violet: #7C3AED
--color-wow-lime: #BFFF00
--color-wow-cyan: #06B6D4
--color-studio-bg: #0F0F10
--color-studio-sidebar: #1A1A1C
--color-studio-card: #242428
--color-studio-border: #2E2E32
--color-studio-text: #FAFAFA
--color-studio-muted: #71717A
--color-studio-hover: #2A2A2E
--color-studio-active: #323236
--color-studio-input: #1E1E22
```
CSS gradients defined in `:root` (sunset, electric, lime). Tailwind classes: `bg-studio-card`, `text-wow-violet`, `border-studio-border`, etc.

## Config Details
- `vite.config.ts`: react plugin + tailwindcss plugin + `@/` alias to `./src`
- `tsconfig.app.json`: `baseUrl: "."` with `@/*` path mapping
- `.env.example`: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `.gitignore`: includes `.env`, `.env.local`

## Build Status
- TypeScript: 0 errors
- Vite build: succeeds (477ms, 13 code-split chunks)
- Branch: `claude/lapo-studio-phase-1-v3hrQ` pushed to origin

## Design Philosophy (Must Follow)
**LAPO Studio = Linear (60%) x Stripe (30%) x Coverd (10%)**
- **Linear**: Navigation, Cmd+K, keyboard-first, clean cards, instant search
- **Stripe**: Financial screens — metric cards with sparklines, transaction tables, filter pills
- **HubSpot**: CRM screens — 360 contact view, timeline, pipeline Kanban
- **Coverd**: Accents ONLY — gradient highlights on CTAs, success celebrations, status pill colors
- Dark mode is PRIMARY. Staff work 8 hours = every click matters, no friction.
- All user-facing text via i18n: `t('nav.dashboard')`
