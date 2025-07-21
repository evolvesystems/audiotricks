/**
 * Dashboard Test Component - Debug all admin dashboards
 */

import React, { useState } from 'react';
import { useAdminAuthContext } from '../../contexts/AdminAuthContext';

export default function DashboardTest() {
  const { user, token, loading, isAdmin } = useAdminAuthContext();
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin || !token) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You need to be logged in as an admin to access dashboards.</p>
        <div className="mt-4 space-y-2">
          <p>User: {user ? user.email : 'Not logged in'}</p>
          <p>Token: {token ? 'Present' : 'Missing'}</p>
          <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }

  const dashboards = [
    { id: 'admin', name: 'Admin Dashboard', url: '/admin/users' },
    { id: 'workspaces', name: 'Workspaces Dashboard', url: '/admin/workspaces' },
    { id: 'subscriptions', name: 'Subscriptions Dashboard', url: '/admin/subscriptions' },
    { id: 'payments', name: 'Payment Gateway Dashboard', url: '/admin/payments' },
    { id: 'analytics', name: 'Analytics Dashboard', url: '/admin/analytics' },
    { id: 'settings', name: 'Settings Dashboard', url: '/admin/settings' },
    { id: 'super-settings', name: 'Super Admin Settings', url: '/admin/super-settings' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test</h1>
      
      <div className="bg-green-100 p-4 rounded mb-6">
        <h2 className="font-bold">Auth Status:</h2>
        <p>User: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>Is Admin: {isAdmin ? 'YES' : 'NO'}</p>
        <p>Token: Present</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test All Dashboards:</h2>
        
        {dashboards.map((dashboard) => (
          <div key={dashboard.id} className="flex items-center gap-4 p-3 border rounded">
            <span className="flex-1 font-medium">{dashboard.name}</span>
            <a 
              href={dashboard.url}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Dashboard
            </a>
            <button
              onClick={() => {
                fetch(`/api${dashboard.url.replace('/admin', '/admin')}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(response => {
                  setSelectedDashboard(dashboard.id + ': ' + response.status);
                })
                .catch(error => {
                  setSelectedDashboard(dashboard.id + ': ERROR - ' + error.message);
                });
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test API
            </button>
          </div>
        ))}
        
        {selectedDashboard && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <strong>Last Test Result:</strong> {selectedDashboard}
          </div>
        )}
      </div>
    </div>
  );
}