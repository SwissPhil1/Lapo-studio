import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { StudioLayout } from '@/shared/components/StudioLayout'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'

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

// CRM pages
const CRMDashboard = lazy(() => import('@/modules/crm/pages/CRMDashboard'))
const PatientsPage = lazy(() => import('@/modules/crm/pages/PatientsPage'))
const PipelinePage = lazy(() => import('@/modules/crm/pages/PipelinePage'))
const AppointmentsPage = lazy(() => import('@/modules/crm/pages/AppointmentsPage'))
const CommunicationsPage = lazy(() => import('@/modules/crm/pages/CommunicationsPage'))

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
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
                {/* Default redirect */}
                <Route index element={<Navigate to="/admin/dashboard" replace />} />

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
                  path="crm/communications"
                  element={
                    <ProtectedRoute requireCRM>
                      <CommunicationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/profile" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
