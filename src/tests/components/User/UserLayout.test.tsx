/**
 * UserLayout Component Tests
 * Tests for the refactored UserLayout component and its subcomponents
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter, setupMocks, cleanupMocks } from '../../utils/testUtils';
import UserLayout from '../../../components/User/UserLayout';
import { UserLayoutSidebar } from '../../../components/User/UserLayoutSidebar';
import { UserLayoutHeader } from '../../../components/User/UserLayoutHeader';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('UserLayout Component', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user'
  };

  const mockOnLogout = vi.fn();

  const defaultProps = {
    children: <div data-testid="page-content">Test Content</div>,
    user: mockUser,
    onLogout: mockOnLogout
  };

  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Basic Rendering', () => {
    it('should render layout correctly', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      expect(screen.getAllByText('AudioTricks')).toHaveLength(2); // One for mobile, one for desktop
      expect(screen.getAllByText('Dashboard')).toHaveLength(2); // One for mobile, one for desktop
      expect(screen.getAllByText('Projects')).toHaveLength(2); // One for mobile, one for desktop
      expect(screen.getAllByText('Transcriptions')).toHaveLength(2); // One for mobile, one for desktop
    });

    it('should render without user', () => {
      const propsWithoutUser = { ...defaultProps, user: undefined };
      renderWithRouter(<UserLayout {...propsWithoutUser} />);
      
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });

    it('should render without onLogout callback', () => {
      const propsWithoutCallback = { ...defaultProps, onLogout: undefined };
      renderWithRouter(<UserLayout {...propsWithoutCallback} />);
      
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar', () => {
    beforeEach(() => {
      // Mock window.innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
    });

    it('should start with closed mobile sidebar', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      // Mobile sidebar toggle should be visible, but sidebar should be hidden
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.h-6.w-6') && btn.className.includes('lg:hidden')
      );
      expect(toggleButton).toBeInTheDocument();
      
      // Mobile sidebar itself should not be visible initially
      expect(screen.queryByRole('button', { name: /close sidebar/i })).not.toBeInTheDocument();
    });

    it('should open mobile sidebar when toggle clicked', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.h-6.w-6') && btn.className.includes('lg:hidden')
      );
      expect(toggleButton).toBeInTheDocument();
      fireEvent.click(toggleButton!);
      
      // Should show mobile sidebar with close button
      const closeButton = screen.getByRole('button', { name: /close sidebar/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should close mobile sidebar when close button clicked', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      // Open sidebar first
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.h-6.w-6') && btn.className.includes('lg:hidden')
      );
      fireEvent.click(toggleButton!);
      
      // Then close it
      const closeButton = screen.getByRole('button', { name: /close sidebar/i });
      fireEvent.click(closeButton);
      
      // Close button should no longer be visible
      expect(screen.queryByRole('button', { name: /close sidebar/i })).not.toBeInTheDocument();
    });

    it('should close mobile sidebar when backdrop clicked', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      // Open sidebar first
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.h-6.w-6') && btn.className.includes('lg:hidden')
      );
      fireEvent.click(toggleButton!);
      
      // Click backdrop
      const backdrop = screen.getByText('AudioTricks').closest('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      
      // Close button should no longer be visible  
      expect(screen.queryByRole('button', { name: /close sidebar/i })).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should show all navigation items', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      expect(screen.getAllByText('Dashboard')).toHaveLength(2);
      expect(screen.getAllByText('Projects')).toHaveLength(2);
      expect(screen.getAllByText('Transcriptions')).toHaveLength(2);
    });

    it('should have correct navigation links', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      const dashboardLinks = screen.getAllByText('Dashboard').map(el => el.closest('a'));
      const projectsLinks = screen.getAllByText('Projects').map(el => el.closest('a'));
      const transcriptionsLinks = screen.getAllByText('Transcriptions').map(el => el.closest('a'));
      
      dashboardLinks.forEach(link => expect(link).toHaveAttribute('href', '/dashboard'));
      projectsLinks.forEach(link => expect(link).toHaveAttribute('href', '/projects'));
      transcriptionsLinks.forEach(link => expect(link).toHaveAttribute('href', '/jobs'));
    });

    it('should highlight active navigation item', () => {
      renderWithRouter(<UserLayout {...defaultProps} />, { initialEntries: ['/projects'] });
      
      const projectsLinks = screen.getAllByText('Projects').map(el => el.closest('a'));
      // Desktop version should have gradient background
      const desktopLink = projectsLinks.find(link => 
        link?.className.includes('bg-gradient-to-r')
      );
      expect(desktopLink).toBeInTheDocument();
      expect(desktopLink).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600');
    });
  });

  describe('Logout Functionality', () => {
    it('should call onLogout when logout is triggered', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      // Find logout button by text content
      const logoutButton = screen.getByText('Logout').closest('button');
      expect(logoutButton).toBeInTheDocument();
      fireEvent.click(logoutButton!);
      
      expect(mockOnLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to home without onLogout callback', () => {
      const propsWithoutCallback = { ...defaultProps, onLogout: undefined };
      renderWithRouter(<UserLayout {...propsWithoutCallback} />);
      
      const logoutButton = screen.getByText('Logout').closest('button');
      expect(logoutButton).toBeInTheDocument();
      fireEvent.click(logoutButton!);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Content Area', () => {
    it('should render children in main content area', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      const content = screen.getByTestId('page-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Test Content');
    });

    it('should have correct padding and layout', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('py-10');
      
      const contentContainer = main.firstChild;
      expect(contentContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Responsive Design', () => {
    it('should show desktop sidebar on large screens', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      // Desktop sidebar should be visible
      expect(screen.getByText('User Dashboard')).toBeInTheDocument();
    });

    it('should apply correct layout classes', () => {
      renderWithRouter(<UserLayout {...defaultProps} />);
      
      const layout = screen.getByRole('main').parentElement;
      expect(layout).toHaveClass('lg:pl-72');
    });
  });
});

describe('UserLayoutSidebar Component', () => {
  const mockNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: vi.fn(() => <div>Dashboard Icon</div>) },
    { name: 'Projects', href: '/projects', icon: vi.fn(() => <div>Projects Icon</div>) },
    { name: 'Jobs', href: '/jobs', icon: vi.fn(() => <div>Jobs Icon</div>), badge: '3' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Sidebar', () => {
    it('should render navigation items correctly', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
    });

    it('should show AudioTricks branding', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      expect(screen.getByText('AudioTricks')).toBeInTheDocument();
      expect(screen.getByText('User Dashboard')).toBeInTheDocument();
      expect(screen.getByText('AT')).toBeInTheDocument();
    });

    it('should show quick actions section', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('should show settings section', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have correct links', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      const newProjectLink = screen.getByText('New Project').closest('a');
      const settingsLink = screen.getByText('Settings').closest('a');
      
      expect(newProjectLink).toHaveAttribute('href', '/projects/new');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should show navigation badges', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Mobile Sidebar', () => {
    it('should render mobile version correctly', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} isMobile />);
      
      expect(screen.getByText('AudioTricks')).toBeInTheDocument();
      expect(screen.queryByText('User Dashboard')).not.toBeInTheDocument();
    });

    it('should not show quick actions and settings on mobile', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} isMobile />);
      
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    it('should have mobile-specific styling', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} isMobile />);
      
      // Find the main sidebar container which should have the mobile styling
      const sidebarContainer = screen.getByRole('navigation').parentElement;
      expect(sidebarContainer).toHaveClass('bg-white', 'px-6', 'pb-4', 'ring-1', 'ring-gray-900/10');
    });
  });

  describe('Active State', () => {
    it('should highlight active navigation item', () => {
      renderWithRouter(
        <UserLayoutSidebar navigation={mockNavigation} />,
        { initialEntries: ['/dashboard'] }
      );
      
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white');
    });

    it('should show correct badge colors for active items', () => {
      renderWithRouter(
        <UserLayoutSidebar navigation={mockNavigation} />,
        { initialEntries: ['/jobs'] }
      );
      
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-blue-600'); // Should be blue when active
    });

    it('should show red badge for non-active items', () => {
      renderWithRouter(
        <UserLayoutSidebar navigation={mockNavigation} />,
        { initialEntries: ['/dashboard'] } // Different path, so Jobs badge should be red
      );
      
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('bg-red-500'); // Should be red when not active
    });
  });

  describe('Hover States', () => {
    it('should have hover styles for non-active items', () => {
      renderWithRouter(<UserLayoutSidebar navigation={mockNavigation} />);
      
      const projectsLink = screen.getByText('Projects').closest('a');
      expect(projectsLink).toHaveClass('hover:text-blue-600', 'hover:bg-gray-50');
    });
  });
});

describe('UserLayoutHeader Component', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser'
  };

  const mockProps = {
    user: mockUser,
    onToggleSidebar: vi.fn(),
    onLogout: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header correctly', () => {
    renderWithRouter(<UserLayoutHeader {...mockProps} />);
    
    const toggleButton = screen.getAllByRole('button').find(btn => 
      btn.className.includes('lg:hidden')
    );
    expect(toggleButton).toBeInTheDocument();
    
    expect(screen.getByPlaceholderText('Search projects, transcriptions...')).toBeInTheDocument();
  });

  it('should call onToggleSidebar when toggle button clicked', () => {
    renderWithRouter(<UserLayoutHeader {...mockProps} />);
    
    const toggleButton = screen.getAllByRole('button').find(btn => 
      btn.className.includes('lg:hidden')
    );
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton!);
    
    expect(mockProps.onToggleSidebar).toHaveBeenCalled();
  });

  it('should show user information', () => {
    renderWithRouter(<UserLayoutHeader {...mockProps} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  it('should handle logout', () => {
    renderWithRouter(<UserLayoutHeader {...mockProps} />);
    
    const logoutButton = screen.getByText('Logout').closest('button');
    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton!);
    
    expect(mockProps.onLogout).toHaveBeenCalled();
  });

  it('should render without user', () => {
    const propsWithoutUser = { ...mockProps, user: undefined };
    renderWithRouter(<UserLayoutHeader {...propsWithoutUser} />);
    
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
  });
});