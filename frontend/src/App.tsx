import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import PWAInstallButton from './components/PWAInstallButton';

// Pages (lazy-loaded)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VesselsPage = lazy(() => import('./pages/VesselsPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const BlocksPage = lazy(() => import('./pages/BlocksPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FinancialManagementPage = lazy(() => import('./pages/FinancialManagementPage'));
const NotificationManagementPage = lazy(() => import('./pages/NotificationManagementPage'));
const MyFinancialsPage = lazy(() => import('./pages/MyFinancialsPage'));
const FinancialHistoryPage = lazy(() => import('./pages/FinancialHistoryPage'));
const TwoFactorPage = lazy(() => import('./pages/TwoFactorPage'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'));

// Layout
import AppLayout from './components/layout/AppLayout';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner fullScreen text="Carregando..." />}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="vessels" element={<VesselsPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="my-financials" element={<MyFinancialsPage />} />

              {/* Admin Only Routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="blocks"
                element={
                  <ProtectedRoute adminOnly>
                    <BlocksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute adminOnly>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial"
                element={
                  <ProtectedRoute adminOnly>
                    <FinancialManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute adminOnly>
                    <SystemSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notification-management"
                element={
                  <ProtectedRoute adminOnly>
                    <NotificationManagementPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <PWAInstallButton />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

