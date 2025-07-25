/**
 * ProjectsPage Component Tests
 * Tests for the refactored ProjectsPage component and its subcomponents
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter, setupMocks, cleanupMocks, mockApiClient, mockProject } from '../../../utils/testUtils';
import ProjectsPage from '../../../../components/User/Projects/ProjectsPage';
import { ProjectsHeader } from '../../../../components/User/Projects/ProjectsHeader';
import { ProjectCard } from '../../../../components/User/Projects/ProjectCard';
import { ProjectsEmptyState } from '../../../../components/User/Projects/ProjectsEmptyState';

// Mock the API service
vi.mock('../../../../services/api', () => ({
  apiClient: mockApiClient
}));

// Mock logger
vi.mock('../../../../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

describe('ProjectsPage Component', () => {
  const mockProjects = [
    {
      ...mockProject,
      id: 'project-1',
      name: 'Active Project',
      status: 'active' as const
    },
    {
      ...mockProject,
      id: 'project-2',
      name: 'Archived Project',
      status: 'archived' as const
    },
    {
      ...mockProject,
      id: 'project-3',
      name: 'Another Active',
      status: 'active' as const
    }
  ];

  beforeEach(() => {
    setupMocks();
    mockApiClient.get.mockResolvedValue({ projects: mockProjects });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Basic Rendering', () => {
    it('should render projects page correctly', async () => {
      renderWithRouter(<ProjectsPage />);
      
      // Should show loading initially
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Organize your transcriptions into projects for better management')).toBeInTheDocument();
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });

    it('should fetch projects on mount', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith('/user/projects');
      });
    });

    it('should display all projects by default', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
        expect(screen.getByText('Archived Project')).toBeInTheDocument();
        expect(screen.getByText('Another Active')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner', () => {
      renderWithRouter(<ProjectsPage />);
      
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });

    it('should hide loading after projects are fetched', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter projects by name', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'Active Project' } });
      
      expect(screen.getByText('Active Project')).toBeInTheDocument();
      expect(screen.queryByText('Archived Project')).not.toBeInTheDocument();
    });

    it('should filter projects by description', async () => {
      const projectsWithDescription = [
        {
          ...mockProject,
          name: 'Test Project',
          description: 'Machine learning research'
        }
      ];
      
      mockApiClient.get.mockResolvedValue({ projects: projectsWithDescription });
      
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'machine learning' } });
      
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'ACTIVE' } });
      
      expect(screen.getByText('Active Project')).toBeInTheDocument();
      expect(screen.getByText('Another Active')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('should show all projects by default', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
        expect(screen.getByText('Archived Project')).toBeInTheDocument();
      });
      
      const allButton = screen.getByText('All Projects');
      expect(allButton).toHaveClass('bg-blue-100');
    });

    it('should filter by active projects', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Active'));
      
      expect(screen.getByText('Active Project')).toBeInTheDocument();
      expect(screen.getByText('Another Active')).toBeInTheDocument();
      expect(screen.queryByText('Archived Project')).not.toBeInTheDocument();
    });

    it('should filter by archived projects', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Archived Project')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Archived'));
      
      expect(screen.getByText('Archived Project')).toBeInTheDocument();
      expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Active')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects', async () => {
      mockApiClient.get.mockResolvedValue({ projects: [] });
      
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
        expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
        expect(screen.getByText('Create Project')).toBeInTheDocument();
      });
    });

    it('should show search empty state', async () => {
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search projects...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent project' } });
      
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('Failed to fetch');
      mockApiClient.get.mockRejectedValue(mockError);
      
      renderWithRouter(<ProjectsPage />);
      
      await waitFor(() => {
        // Should not crash and should hide loading
        expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      });
    });
  });
});

describe('ProjectsHeader Component', () => {
  const mockProps = {
    searchTerm: '',
    filter: 'all' as const,
    onSearchChange: vi.fn(),
    onFilterChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header correctly', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Organize your transcriptions into projects for better management')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('should handle search input changes', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test search');
  });

  it('should show current search term', () => {
    const searchProps = { ...mockProps, searchTerm: 'current search' };
    renderWithRouter(<ProjectsHeader {...searchProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects...');
    expect(searchInput).toHaveValue('current search');
  });

  it('should render filter buttons', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    expect(screen.getByText('All Projects')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should highlight active filter', () => {
    const activeProps = { ...mockProps, filter: 'active' as const };
    renderWithRouter(<ProjectsHeader {...activeProps} />);
    
    const activeButton = screen.getByText('Active');
    expect(activeButton).toHaveClass('bg-blue-100');
  });

  it('should handle filter changes', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    fireEvent.click(screen.getByText('Active'));
    expect(mockProps.onFilterChange).toHaveBeenCalledWith('active');
    
    fireEvent.click(screen.getByText('Archived'));
    expect(mockProps.onFilterChange).toHaveBeenCalledWith('archived');
  });

  it('should link to new project page', () => {
    renderWithRouter(<ProjectsHeader {...mockProps} />);
    
    const newProjectLink = screen.getByText('New Project');
    expect(newProjectLink.closest('a')).toHaveAttribute('href', '/projects/new');
  });
});

describe('ProjectCard Component', () => {
  const mockProps = {
    project: mockProject
  };

  it('should render project information correctly', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should show project statistics', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText('20m')).toBeInTheDocument(); // 1200 seconds = 20 minutes
  });

  it('should format duration correctly', () => {
    const longProject = {
      ...mockProject,
      totalDuration: 3900 // 65 minutes = 1h 5m
    };
    
    renderWithRouter(<ProjectCard project={longProject} />);
    
    expect(screen.getByText('1h 5m')).toBeInTheDocument();
  });

  it('should show progress bar', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    // Progress bar should show 60% (3/5 completed)
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('should handle zero jobs without division by zero', () => {
    const emptyProject = {
      ...mockProject,
      jobCount: 0,
      completedJobs: 0
    };
    
    renderWithRouter(<ProjectCard project={emptyProject} />);
    
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    // Progress bar should be 0%
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('should show correct status styling', () => {
    const archivedProject = {
      ...mockProject,
      status: 'archived' as const
    };
    
    renderWithRouter(<ProjectCard project={archivedProject} />);
    
    const statusBadge = screen.getByText('archived');
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('should show action buttons', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    
    // Jobs button (document icon)
    const jobsButton = screen.getByRole('link', { name: /jobs/i });
    expect(jobsButton).toBeInTheDocument();
  });

  it('should link to correct URLs', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    const detailsLink = screen.getByText('View Details');
    expect(detailsLink.closest('a')).toHaveAttribute('href', '/projects/project-1');
    
    const jobsLink = screen.getByRole('link', { name: /jobs/i });
    expect(jobsLink).toHaveAttribute('href', '/projects/project-1/jobs');
  });

  it('should format update date correctly', () => {
    renderWithRouter(<ProjectCard {...mockProps} />);
    
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });
});

describe('ProjectsEmptyState Component', () => {
  const mockProps = {
    searchTerm: ''
  };

  it('should render empty state for no projects', () => {
    renderWithRouter(<ProjectsEmptyState {...mockProps} />);
    
    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  it('should show search-specific message', () => {
    const searchProps = { searchTerm: 'nonexistent' };
    renderWithRouter(<ProjectsEmptyState {...searchProps} />);
    
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });

  it('should link to new project page', () => {
    renderWithRouter(<ProjectsEmptyState {...mockProps} />);
    
    const createLink = screen.getByText('Create Project');
    expect(createLink.closest('a')).toHaveAttribute('href', '/projects/new');
  });

  it('should show folder icon', () => {
    renderWithRouter(<ProjectsEmptyState {...mockProps} />);
    
    // Should have folder icon (accessibility might vary)
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});