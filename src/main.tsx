import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.tsx'
import AdminApp from './components/Admin/AdminApp.tsx'
import { 
  AdminUsersPage, 
  AdminWorkspacesPage, 
  AdminSubscriptionsPage,
  AdminPaymentGatewayPage,
  AdminAnalyticsPage,
  AdminSettingsPage,
  SuperAdminSettingsPage,
  RolesEditorPage
} from './components/Admin/AdminRoutes.tsx'
import UserApp from './components/User/UserApp.tsx'
import AdminTest from './components/Admin/AdminTest.tsx'
import DashboardTest from './components/Admin/DashboardTest.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import NotFoundPage from './components/NotFoundPage.tsx'
import PricingPage from './components/PricingPage.tsx'
import LoginPage from './components/Auth/LoginPage.tsx'
import RegisterPage from './components/Auth/RegisterPage.tsx'
import ProtectedRoute from './components/Auth/ProtectedRoute.tsx'
import { AdminAuthProvider } from './contexts/AdminAuthContext.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
          {/* Main App */}
          <Route path="/" element={<App />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* User Dashboard Routes - Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/projects/*" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/jobs/*" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/workspaces" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><UserApp /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/test" element={<AdminTest />} />
          <Route path="/admin/dashboard-test" element={<DashboardTest />} />
          <Route path="/admin/login" element={<AdminApp />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/workspaces" element={<AdminWorkspacesPage />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
          <Route path="/admin/payments" element={<AdminPaymentGatewayPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/super-settings" element={<SuperAdminSettingsPage />} />
          <Route path="/admin/roles" element={<RolesEditorPage />} />
          <Route path="/admin/" element={<AdminApp />} />
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)