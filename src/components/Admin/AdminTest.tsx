/**
 * Admin Test Component - Simple test interface
 */

import React, { useState } from 'react';
import { useAdminAuthContext } from '../../contexts/AdminAuthContext';

export default function AdminTest() {
  const { user, token, loading, isAdmin, isSuperAdmin, login, logout } = useAdminAuthContext();
  const [loginForm, setLoginForm] = useState({ email: 'admin@audiotricks.com', password: 'admin123' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    
    const result = await login(loginForm.email, loginForm.password);
    
    if (!result.success && result.error) {
      setLoginError(result.error);
    }
    
    setLoginLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user && token) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Admin Test - Logged In</h1>
        
        <div className="bg-green-100 p-4 rounded mb-4">
          <h2 className="font-bold">User Info:</h2>
          <p>Email: {user.email}</p>
          <p>Username: {user.username}</p>
          <p>Role: {user.role}</p>
          <p>Is Admin: {isAdmin ? 'YES' : 'NO'}</p>
          <p>Is Super Admin: {isSuperAdmin ? 'YES' : 'NO'}</p>
          <p>Current Path: /admin/test</p>
          <p>Token Present: {token ? 'YES' : 'NO'}</p>
        </div>

        <div className="space-y-4">
          <a href="/admin/users" className="block bg-blue-500 text-white p-3 rounded text-center">
            Go to Admin Users Page
          </a>
          <a href="/admin/settings" className="block bg-green-500 text-white p-3 rounded text-center">
            Go to Admin Settings
          </a>
          <a href="/admin/super-settings" className="block bg-red-500 text-white p-3 rounded text-center">
            Go to Super Admin Settings
          </a>
          <button onClick={logout} className="block w-full bg-gray-500 text-white p-3 rounded">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test - Login</h1>
      
      {loginError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {loginError}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
            className="w-full p-2 border rounded"
            disabled={loginLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
            className="w-full p-2 border rounded"
            disabled={loginLoading}
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-3 rounded disabled:opacity-50"
          disabled={loginLoading}
        >
          {loginLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}