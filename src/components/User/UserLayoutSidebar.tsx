/**
 * User Layout Sidebar - Navigation sidebar for user dashboard
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationItem } from './types';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';

interface UserLayoutSidebarProps {
  navigation: NavigationItem[];
  isMobile?: boolean;
}

export const UserLayoutSidebar: React.FC<UserLayoutSidebarProps> = ({
  navigation,
  isMobile = false
}) => {
  const location = useLocation();

  return (
    <div className={`flex grow flex-col gap-y-5 overflow-y-auto ${
      isMobile ? 'bg-white px-6 pb-4 ring-1 ring-gray-900/10' : 'bg-white px-6 pb-4 border-r border-gray-200'
    }`}>
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center gap-3">
          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-600 to-purple-600 ${
            isMobile ? 'rounded-lg' : 'rounded-xl'
          } flex items-center justify-center shadow-lg`}>
            <span className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>AT</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">AudioTricks</span>
            {!isMobile && <p className="text-xs text-gray-500">User Dashboard</p>}
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
                    className={`group flex gap-x-3 ${
                      isMobile ? 'rounded-md p-2' : 'rounded-xl p-3'
                    } text-sm leading-6 font-semibold transition-all duration-200 ${
                      location.pathname === item.href
                        ? isMobile
                          ? 'bg-gray-50 text-blue-600'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-6 w-6 shrink-0" />
                    {item.name}
                    {item.badge && (
                      <span className={`ml-auto w-6 h-6 text-xs ${
                        location.pathname === item.href || isMobile ? 'bg-blue-600' : 'bg-red-500'
                      } text-white rounded-full flex items-center justify-center`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          
          {!isMobile && (
            <>
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
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};