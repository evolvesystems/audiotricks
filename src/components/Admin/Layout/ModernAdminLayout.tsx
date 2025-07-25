/**
 * Modern Admin/User Dashboard Layout  
 * Professional sidebar-based design suitable for both admin and user interfaces
 * User menu shows first, admin menu shows second
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import Footer from '../../Footer';

interface ModernAdminLayoutProps {
  children: React.ReactNode;
}

export default function ModernAdminLayout({ children }: ModernAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAdminAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isAdmin={isAdmin}
        isMobile={true}
      />

      {/* Desktop sidebar */}
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isAdmin={isAdmin}
        isMobile={false}
      />

      {/* Main content */}
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <AdminHeader 
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <main className="flex-1 py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}