import React from 'react';
import { useAdminAuthContext } from '../../contexts/AdminAuthContext';
import AdminLogin from './AdminLogin';
import { Navigate } from 'react-router-dom';

export default function AdminApp() {
  const { user, token, loading, isAdmin, login } = useAdminAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user && isAdmin && token) {
    return <Navigate to="/admin/users" replace />;
  }

  return <AdminLogin onLogin={login} />;
}