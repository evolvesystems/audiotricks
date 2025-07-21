/**
 * Navigation types and menu structure definitions
 */

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiredRole?: 'user' | 'admin';
  section?: 'user' | 'admin';
}

// User Menu Items - Available to all authenticated users
export const userMenuItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    section: 'user',
    requiredRole: 'user'
  },
  {
    name: 'Projects',
    href: '/projects',
    section: 'user',
    requiredRole: 'user'
  },
  {
    name: 'Jobs',
    href: '/jobs',
    section: 'user',
    requiredRole: 'user'
  },
  {
    name: 'Upload',
    href: '/upload',
    section: 'user',
    requiredRole: 'user'
  },
  {
    name: 'Team',
    href: '/team',
    section: 'user',
    requiredRole: 'user'
  },
  {
    name: 'My Account',
    href: '/account',
    section: 'user',
    requiredRole: 'user'
  }
];

// Admin Menu Items - Only for admin users
export const adminMenuItems: NavigationItem[] = [
  {
    name: 'Admin Dashboard',
    href: '/admin/dashboard',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Workspaces',
    href: '/admin/workspaces',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Subscriptions',
    href: '/admin/subscriptions',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Roles & Permissions',
    href: '/admin/roles',
    section: 'admin',
    requiredRole: 'admin'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    section: 'admin',
    requiredRole: 'admin'
  }
];

/**
 * Get menu items based on user role
 * Admins get both user and admin menus
 * Regular users get only user menus
 */
export function getMenuItemsForRole(role: string): NavigationItem[] {
  if (role === 'admin') {
    // Admins see all menus
    return [...userMenuItems, ...adminMenuItems];
  }
  
  // Regular users see only user menus
  return userMenuItems;
}