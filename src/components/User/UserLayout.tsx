/**
 * User Dashboard Layout
 * Clean, modern layout for regular users to manage projects and transcriptions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UserLayoutSidebar } from './UserLayoutSidebar';
import { UserLayoutHeader } from './UserLayoutHeader';
import { NavigationItem } from './types';

interface UserLayoutProps {
  children: React.ReactNode;
  user?: any;
  onLogout?: () => void;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Transcriptions', href: '/jobs', icon: DocumentTextIcon },
];

export default function UserLayout({ children, user, onLogout }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            
            <UserLayoutSidebar navigation={navigation} isMobile />
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <UserLayoutSidebar navigation={navigation} />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <UserLayoutHeader
          user={user}
          onToggleSidebar={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

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