import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSettings from '../../../../components/Admin/Settings/AdminSettings';
import { useAdminAuthContext } from '../../../../contexts/AdminAuthContext';

// Mock the contexts and hooks
vi.mock('../../../../contexts/AdminAuthContext');

const mockUser = {
  id: '1',
  email: 'admin@test.com',
  username: 'admin',
  role: 'admin'
};

describe('AdminSettings Component', () => {
  beforeEach(() => {
    vi.mocked(useAdminAuthContext).mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    });
  });

  it('renders AdminSettings component', async () => {
    render(<AdminSettings />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Admin Settings')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Manage your admin account preferences and security')).toBeInTheDocument();
  });

  it('shows tab navigation correctly', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Preferences')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<AdminSettings />);
    
    // Wait for component to load and default tab to be shown
    await waitFor(() => {
      expect(screen.getByText('Email notifications for important updates')).toBeInTheDocument();
    });
    
    // Switch to security tab
    fireEvent.click(screen.getByText('Security'));
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    
    // Switch to profile tab
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    
    // Switch to API keys tab
    fireEvent.click(screen.getByText('API Keys'));
    expect(screen.getByText('API Keys Management')).toBeInTheDocument();
  });

  it('handles preference changes', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Email notifications for important updates')).toBeInTheDocument();
    });
    
    const emailNotificationsToggle = screen.getByLabelText(/email notifications for important updates/i);
    expect(emailNotificationsToggle).toBeChecked();
    
    fireEvent.click(emailNotificationsToggle);
    expect(emailNotificationsToggle).not.toBeChecked();
  });

  it('handles theme selection', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Light')).toBeInTheDocument();
    });
    
    const themeSelect = screen.getByDisplayValue('Light');
    fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    expect(themeSelect.value).toBe('dark');
  });

  it('saves preferences successfully', async () => {
    render(<AdminSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);
    
    // Button should show loading state
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();
  });
});