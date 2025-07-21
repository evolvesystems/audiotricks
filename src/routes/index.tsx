// Route configuration with lazy loading
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load route components
const Home = lazy(() => import('../App'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));
const UserDashboard = lazy(() => import('../pages/UserDashboard'));
const WorkspaceManager = lazy(() => import('../pages/WorkspaceManager'));
const Settings = lazy(() => import('../pages/Settings'));

// Loading component
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
  </div>
);

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/workspaces" element={<WorkspaceManager />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}