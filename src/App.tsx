import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { StudioLayout } from '@/shared/components/StudioLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

// Admin pages
const AdminDashboard = lazy(() => import('@/modules/admin/pages/AdminDashboard'))
const ReferrersPage = lazy(() => import('@/modules/admin/pages/ReferrersPage'))
const CommissionsPage = lazy(() => import('@/modules/admin/pages/CommissionsPage'))
const PayoutsPage = lazy(() => import('@/modules/admin/pages/PayoutsPage'))
const GiftLapoCashPage = lazy(() => import('@/modules/admin/pages/GiftLapoCashPage'))
const PrizesPage = lazy(() => import('@/modules/admin/pages/PrizesPage'))
const ReferrerDetailPage = lazy(() => import('@/modules/admin/pages/ReferrerDetailPage'))
const PayoutDetailPage = lazy(() => import('@/modules/admin/pages/PayoutDetailPage'))
const ReferralsPage = lazy(() => import('@/modules/admin/pages/ReferralsPage'))
const ReferralDetailPage = lazy(() => import('@/modules/admin/pages/ReferralDetailPage'))

// CRM pages
const CRMDashboard = lazy(() => import('@/modules/crm/pages/CRMDashboard'))
const PatientsPage = lazy(() => import('@/modules/crm/pages/PatientsPage'))
const PatientDetailPage = lazy(() => import('@/modules/crm/pages/PatientDetailPage'))
const PipelinePage = lazy(() => import('@/modules/crm/pages/PipelinePage'))
const AppointmentsPage = lazy(() => import('@/modules/crm/pages/AppointmentsPage'))
const CommunicationsPage = lazy(() => import('@/modules/crm/pages/CommunicationsPage'))
const AnalyticsPage = lazy(() => import('@/modules/crm/pages/AnalyticsPage'))
const CampaignsPage = lazy(() => import('@/modules/crm/pages/CampaignsPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-wow-violet border-t-transparent" />
    </div>
  )
}

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground mb-2">{t('notFound.title')}</h1>
        <p className="text-lg text-muted-foreground mb-6">{t('notFound.description')}</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  )
}

function RoleBasedRedirect() {
  const { isAdmin, isCRM } = useAuth()
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  if (isCRM) return <Navigate to="/crm/dashboard" replace />
  return <Navigate to="/settings" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Studio Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <StudioLayout />
                  </ProtectedRoute>
                }
              >
                {/* Default redirect based on role */}
                <Route index element={<RoleBasedRedirect />} />

                {/* Admin routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/referrers"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferrersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/commissions"
                  element={
                    <ProtectedRoute requireAdmin>
                      <CommissionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/payouts"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PayoutsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/gift-lapo-cash"
                  element={
                    <ProtectedRoute requireAdmin>
                      <GiftLapoCashPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/prizes"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PrizesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/referrers/:id"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferrerDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/payouts/:id"
                  element={
                    <ProtectedRoute requireAdmin>
                      <PayoutDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/referrals"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferralsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/referrals/:id"
                  element={
                    <ProtectedRoute requireAdmin>
                      <ReferralDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* CRM routes */}
                <Route
                  path="crm/dashboard"
                  element={
                    <ProtectedRoute requireCRM>
                      <CRMDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/patients"
                  element={
                    <ProtectedRoute requireCRM>
                      <PatientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/pipeline"
                  element={
                    <ProtectedRoute requireCRM>
                      <PipelinePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/appointments"
                  element={
                    <ProtectedRoute requireCRM>
                      <AppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/patients/:id"
                  element={
                    <ProtectedRoute requireCRM>
                      <PatientDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/communications"
                  element={
                    <ProtectedRoute requireCRM>
                      <CommunicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/analytics"
                  element={
                    <ProtectedRoute requireCRM>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="crm/campaigns"
                  element={
                    <ProtectedRoute requireCRM>
                      <CampaignsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/profile" element={<SettingsPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
