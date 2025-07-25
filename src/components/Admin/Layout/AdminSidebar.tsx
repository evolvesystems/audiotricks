/**
 * AdminSidebar Component
 * Handles both mobile and desktop sidebar navigation
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  FolderIcon,
  BriefcaseIcon,
  MicrophoneIcon,
  KeyIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  section?: 'user' | 'admin';
}

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAdmin: boolean;
  isMobile?: boolean;
}

const navigation: NavigationItem[] = [
  // Admin Features Section
  { name: 'Admin Dashboard', href: '/admin/users', icon: HomeIcon, section: 'admin' },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon, section: 'admin' },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon, section: 'admin' },
  { name: 'Payment Gateway', href: '/admin/payments', icon: CreditCardIcon, section: 'admin' },
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

export default function AdminSidebar({ sidebarOpen, setSidebarOpen, isAdmin, isMobile = false }: AdminSidebarProps) {
  const location = useLocation();

  const getNavigationItems = () => {
    if (isAdmin) {
      return navigation;
    } else {
      return navigation.filter(item => item.section === 'user');
    }
  };

  const filteredNavigation = getNavigationItems();
  const adminNavItems = filteredNavigation.filter(item => item.section === 'admin');
  const userNavItems = filteredNavigation.filter(item => item.section === 'user');

  const renderNavItems = (items: NavigationItem[], sectionTitle: string) => (
    <li>
      <div className="text-xs font-semibold leading-6 text-gray-400 mb-2">{sectionTitle}</div>
      <ul role="list" className="-mx-2 space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              to={item.href}
              className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-semibold transition-all duration-200 ${
                location.pathname === item.href
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => isMobile && setSidebarOpen(false)}
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
  );

  const sidebarContent = (
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
          {userNavItems.length > 0 && renderNavItems(userNavItems, 'USER MENU')}
          {adminNavItems.length > 0 && renderNavItems(adminNavItems, 'ADMIN MENU')}
          
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
  );

  if (isMobile) {
    return (
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
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
                  {userNavItems.length > 0 && renderNavItems(userNavItems, 'USER MENU')}
                  {adminNavItems.length > 0 && renderNavItems(adminNavItems, 'ADMIN MENU')}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {sidebarContent}
    </div>
  );
}