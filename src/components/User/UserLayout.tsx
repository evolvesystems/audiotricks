/**
 * User Dashboard Layout
 * Clean, modern layout for regular users to manage projects and transcriptions
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface UserLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Transcriptions', href: '/jobs', icon: DocumentTextIcon },
];

export default function UserLayout({ children, user, onLogout }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 ring-1 ring-gray-900/10">
              <div className="flex h-16 shrink-0 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AT</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">AudioTricks</span>
                </div>
              </div>
              
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            to={item.href}
                            className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                              location.pathname === item.href
                                ? 'bg-gray-50 text-blue-600'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            <item.icon className="h-6 w-6 shrink-0" />
                            {item.name}
                            {item.badge && (
                              <span className="ml-auto w-6 h-6 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AT</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">AudioTricks</span>
                <p className="text-xs text-gray-500">User Dashboard</p>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                          location.pathname === item.href
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                        {item.badge && (
                          <span className="ml-auto w-6 h-6 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              {/* Quick Actions */}
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">Quick Actions</div>
                <Link
                  to="/projects/new"
                  className="group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                >
                  <PlusIcon className="h-6 w-6 shrink-0" />
                  New Project
                </Link>
              </li>
              
              {/* Settings section */}
              <li className="mt-auto">
                <div className="border-t border-gray-200 pt-6 space-y-2">
                  <Link
                    to="/settings"
                    className="group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Cog6ToothIcon className="h-6 w-6 shrink-0" />
                    Settings
                  </Link>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navigation */}
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
                placeholder="Search projects, transcriptions..."
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
                      {user?.username || user?.email || 'User'}
                    </span>
                    <span className="text-xs leading-5 text-gray-500">
                      Free Plan
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <UserCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    
                    <button
                      onClick={handleLogout}
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

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}