import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuthContext } from '../../contexts/AdminAuthContext';
import ModernAdminLayout from './Layout/ModernAdminLayout';
import AdminDashboard from './AdminDashboard';
import WorkspaceDashboard from './WorkspaceDashboard';
import SubscriptionPlansDashboard from './SubscriptionPlans/SubscriptionPlansDashboard';
import EwayDashboard from './PaymentGateway/EwayDashboard';
import BillingAnalyticsDashboard from './Analytics/BillingAnalyticsDashboard';
import SuperAdminSettings from './SuperAdmin/SuperAdminSettings';
import AdminSettings from './Settings/AdminSettings';
import RolesEditor from './RolesEditor/RolesEditor';


export const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token, loading, isAdmin } = useAdminAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin || !token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export const AdminUsersPage = () => {
  const { token, logout } = useAdminAuthContext();
  
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <AdminDashboard token={token || ''} onSessionExpired={logout} />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const AdminWorkspacesPage = () => {
  const { token, logout } = useAdminAuthContext();
  
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <WorkspaceDashboard token={token || ''} onSessionExpired={logout} />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const AdminSubscriptionsPage = () => {
  const { token, logout } = useAdminAuthContext();
  
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <SubscriptionPlansDashboard token={token || ''} />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const AdminPaymentGatewayPage = () => {
  const { token, logout } = useAdminAuthContext();
  
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <EwayDashboard token={token || ''} />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const AdminAnalyticsPage = () => {
  const { token, logout } = useAdminAuthContext();
  
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <BillingAnalyticsDashboard token={token || ''} />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const AdminSettingsPage = () => {
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <AdminSettings />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const SuperAdminSettingsPage = () => {
  // This is now just advanced settings for regular admins
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <SuperAdminSettings />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};

export const RolesEditorPage = () => {
  return (
    <ProtectedAdminRoute>
      <ModernAdminLayout>
        <RolesEditor />
      </ModernAdminLayout>
    </ProtectedAdminRoute>
  );
};