import React from 'react';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface UserAuthProps {
  onUserChange?: (user: any | null) => void;
}

export default function UserAuth({ onUserChange }: UserAuthProps) {
  const { user, isAuthenticated, logout, loading } = useAuth();

  // Notify parent component when user changes
  React.useEffect(() => {
    onUserChange?.(user);
  }, [user, onUserChange]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Error is handled by the AuthContext
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
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
      href="/login"
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
    >
      <UserCircleIcon className="h-5 w-5" />
      <span>Sign In</span>
    </a>
  );
}