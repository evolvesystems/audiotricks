/**
 * Modern Admin/User Dashboard Layout  
 * Professional sidebar-based design suitable for both admin and user interfaces
 * User menu shows first, admin menu shows second
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  FolderIcon,
  BriefcaseIcon,
  MicrophoneIcon,
  KeyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';

interface ModernAdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  section?: 'user' | 'admin';
}

const navigation: NavigationItem[] = [
  // Admin Features Section (shown first for admins)
  { name: 'Admin Dashboard', href: '/admin/users', icon: HomeIcon, section: 'admin' },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon, section: 'admin' },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon, section: 'admin' },
  { name: 'Payments', href: '/admin/payments', icon: CurrencyDollarIcon, section: 'admin' },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, section: 'admin' },
  { name: 'Roles & Permissions', href: '/admin/roles', icon: KeyIcon, section: 'admin' },
  { name: 'Admin Settings', href: '/admin/settings', icon: Cog6ToothIcon, section: 'admin' },
  
  // User Features Section
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, section: 'user' },
  { name: 'Projects', href: '/projects', icon: FolderIcon, section: 'user' },
  { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, section: 'user' },
  { name: 'Upload', href: '/upload', icon: MicrophoneIcon, section: 'user' },
  { name: 'Workspaces', href: '/workspaces', icon: BuildingOfficeIcon, section: 'user' },
  { name: 'Team', href: '/team', icon: UserGroupIcon, section: 'user' },
  { name: 'My Account', href: '/account', icon: UserCircleIcon, section: 'user' },
];

export default function ModernAdminLayout({ children }: ModernAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAdminAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (isAdmin) {
      // Admins see all menus
      return navigation;
    } else {
      // Regular users see only user section menus
      return navigation.filter(item => item.section === 'user');
    }
  };

  const filteredNavigation = getNavigationItems();
  
  // Group navigation items by section for better organization
  const adminNavItems = filteredNavigation.filter(item => item.section === 'admin');
  const userNavItems = filteredNavigation.filter(item => item.section === 'user');

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
                  {/* User Section - Show first */}
                  {userNavItems.length > 0 && (
                    <li>
                      <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">USER MENU</div>
                      <ul role="list" className="-mx-2 space-y-1">
                        {userNavItems.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                location.pathname === item.href
                                  ? 'bg-gray-50 text-blue-600'
                                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setSidebarOpen(false)}
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
                  )}
                  
                  {/* Admin Section - Show second for admins */}
                  {adminNavItems.length > 0 && (
                    <li>
                      <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">ADMIN MENU</div>
                      <ul role="list" className="-mx-2 space-y-1">
                        {adminNavItems.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                                location.pathname === item.href
                                  ? 'bg-gray-50 text-blue-600'
                                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setSidebarOpen(false)}
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
                  )}
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
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {/* User Section - Show first */}
              {userNavItems.length > 0 && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">USER MENU</div>
                  <ul role="list" className="-mx-2 space-y-1">
                    {userNavItems.map((item) => (
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
              )}
              
              {/* Admin Section - Show second for admins */}
              {adminNavItems.length > 0 && (
                <li>
                  <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">ADMIN MENU</div>
                  <ul role="list" className="-mx-2 space-y-1">
                    {adminNavItems.map((item) => (
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
              )}
              
              {/* Settings section */}
              <li className="mt-auto">
                <div className="border-t border-gray-200 pt-6 space-y-2">
                  <Link
                    to="/admin/settings"
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