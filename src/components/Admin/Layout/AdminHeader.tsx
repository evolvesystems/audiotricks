/**
 * AdminHeader Component
 * Top navigation bar with search, notifications, and user profile
 */

import React from 'react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  username?: string;
  email: string;
  role: string;
}

interface AdminHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

export default function AdminHeader({ setSidebarOpen, user, onLogout }: AdminHeaderProps) {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" />
          <input
            className="block h-full w-full border-0 py-0 pl-11 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search..."
            type="search"
          />
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
          >
            <BellIcon className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

          {/* Profile dropdown */}
          <div className="relative">
            <div className="flex items-center gap-x-4">
              <div className="hidden lg:flex lg:flex-col lg:text-right">
                <span className="text-sm font-semibold leading-6 text-gray-900">
                  {user?.username || user?.email}
                </span>
                <span className="text-xs leading-5 text-gray-500">
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <UserCircleIcon className="h-5 w-5 text-white" />
                </div>
                
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}