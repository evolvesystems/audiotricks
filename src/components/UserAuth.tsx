import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
}

interface UserAuthProps {
  onUserChange?: (user: User | null) => void;
}

export default function UserAuth({ onUserChange }: UserAuthProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        onUserChange?.(data.user);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      logger.error('Auth check failed:', error);
    }
  };


  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        logger.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('authToken');
    setUser(null);
    onUserChange?.(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/dashboard"
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <HomeIcon className="h-4 w-4" />
          Dashboard
        </a>
        {user.role === 'admin' && (
          <a
            href="/admin"
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Admin
          </a>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircleIcon className="h-5 w-5" />
          <span>{user.username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          title="Logout"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <a
      href="/admin/login"
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
    >
      <UserCircleIcon className="h-5 w-5" />
      <span>Login</span>
    </a>
  );
}