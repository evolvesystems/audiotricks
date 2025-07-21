/**
 * User App - Main entry point for user dashboard
 * Handles authentication and routing for user features
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ModernAdminLayout from '../Admin/Layout/ModernAdminLayout';
import UserDashboard from './UserDashboard';
import ProjectsPage from './Projects/ProjectsPage';
import NewProjectPage from './Projects/NewProjectPage';
import ProjectDetailPage from './Projects/ProjectDetailPage';
import JobsPage from './Jobs/JobsPage';
import JobDetailPage from './Jobs/JobDetailPage';
import UploadPage from './UploadPage';
import UserSettingsPage from './UserSettingsPage';
import TeamPage from './Team/TeamPage';
import MyAccountPage from './Account/MyAccountPage';
import WorkspacesPage from './WorkspacesPage';

// Mock user for now - in a real app this would come from authentication context
const mockUser = {
  id: '1',
  username: 'john_user',
  email: 'john@example.com',
  role: 'user'
};

export default function UserApp() {
  const location = useLocation();
  const handleLogout = () => {
    // In a real app, this would clear authentication state
    console.log('User logged out');
  };

  // Route to appropriate component based on current path
  const renderComponent = () => {
    const path = location.pathname;
    
    if (path.startsWith('/projects')) {
      if (path === '/projects/new') return <NewProjectPage />;
      if (path.match(/\/projects\/[^/]+$/)) return <ProjectDetailPage />;
      return <ProjectsPage />;
    }
    
    if (path.startsWith('/jobs')) {
      if (path.match(/\/jobs\/[^/]+$/)) return <JobDetailPage />;
      return <JobsPage />;
    }
    
    switch (path) {
      case '/dashboard': return <UserDashboard />;
      case '/upload': return <UploadPage />;
      case '/workspaces': return <WorkspacesPage />;
      case '/team': return <TeamPage />;
      case '/account': return <MyAccountPage />;
      case '/settings': return <UserSettingsPage />;
      default: return <UserDashboard />;
    }
  };

  return (
    <ModernAdminLayout>
      {renderComponent()}
    </ModernAdminLayout>
  );
}

