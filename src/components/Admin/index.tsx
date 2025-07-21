// Lazy-loaded admin components for code splitting
import { lazy } from 'react';

// Lazy load all admin components
export const AdminDashboard = lazy(() => import('./AdminDashboard'));
export const UserDashboard = lazy(() => import('./UserDashboard'));
export const WorkspaceDashboard = lazy(() => import('./WorkspaceDashboard'));
export const UserModal = lazy(() => import('./UserModal'));
export const WorkspaceModal = lazy(() => import('./WorkspaceModal'));
export const WorkspaceUsersModal = lazy(() => import('./WorkspaceUsers'));

// Export types directly (not lazy loaded)
export type { 
  AdminDashboardProps, 
  User, 
  Stats 
} from './AdminDashboard/types';

export type { 
  WorkspaceDashboardProps, 
  Workspace 
} from './WorkspaceDashboard/types';

export type { 
  WorkspaceUsersModalProps 
} from './WorkspaceUsers/types';