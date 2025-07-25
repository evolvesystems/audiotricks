/**
 * ProfileSection Component Tests
 * Tests for the refactored ProfileSection component and its subcomponents
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter, setupMocks, cleanupMocks, mockApiClient } from '../../../utils/testUtils';
import ProfileSection from '../../../../components/User/Account/ProfileSection';
import { ProfileAvatar } from '../../../../components/User/Account/ProfileAvatar';
import { ProfileForm } from '../../../../components/User/Account/ProfileForm';
import { ProfileSecurity } from '../../../../components/User/Account/ProfileSecurity';

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

describe('ProfileSection Component', () => {
  const mockProfile = {
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Test Company',
    phone: '+1234567890',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockProps = {
    profile: mockProfile,
    onUpdate: vi.fn()
  };

  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Basic Rendering', () => {
    it('should render profile information correctly', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });

    it('should show Edit Profile button initially', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('should show user avatar and info', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
    });

    it('should show security section', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByText('Two-factor authentication:')).toBeInTheDocument();
      expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit Profile is clicked', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      // Should show save/cancel buttons
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      
      // Should not show Edit Profile button
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    });

    it('should enable form fields in edit mode', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      // Initially disabled
      expect(screen.getByDisplayValue('testuser')).toBeDisabled();
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      // Now enabled
      expect(screen.getByDisplayValue('testuser')).not.toBeDisabled();
    });

    it('should cancel edit mode', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      // Make some changes
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      // Cancel
      fireEvent.click(screen.getByText('Cancel'));
      
      // Should revert changes and exit edit mode
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument(); // Original value restored
    });
  });

  describe('Form Validation and Submission', () => {
    it('should update form data on input change', () => {
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      expect(screen.getByDisplayValue('newusername')).toBeInTheDocument();
    });

    it('should save profile changes successfully', async () => {
      mockApiClient.put.mockResolvedValueOnce({ success: true });
      
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      
      // Make changes
      const usernameInput = screen.getByDisplayValue('testuser');
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      
      // Save
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalledWith('/user/profile', {
          username: 'newusername',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Test Company',
          phone: '+1234567890'
        });
      });
      
      await waitFor(() => {
        expect(mockProps.onUpdate).toHaveBeenCalled();
      });
      
      // Should exit edit mode
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('should handle save errors gracefully', async () => {
      const mockError = new Error('Save failed');
      mockApiClient.put.mockRejectedValueOnce(mockError);
      
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      await waitFor(() => {
        expect(mockApiClient.put).toHaveBeenCalled();
      });
      
      // Should remain in edit mode on error
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should show loading state during save', async () => {
      // Mock a delayed response
      mockApiClient.put.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      renderWithRouter(<ProfileSection {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit Profile'));
      fireEvent.click(screen.getByText('Save Changes'));
      
      // Should show loading text
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing profile data', () => {
      const emptyProps = {
        profile: null,
        onUpdate: vi.fn()
      };
      
      renderWithRouter(<ProfileSection {...emptyProps} />);
      
      // Should still render with empty values
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    it('should handle partial profile data', () => {
      const partialProfile = {
        username: 'testuser',
        email: 'test@example.com'
        // Missing other fields
      };
      
      const partialProps = {
        profile: partialProfile,
        onUpdate: vi.fn()
      };
      
      renderWithRouter(<ProfileSection {...partialProps} />);
      
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });
});

describe('ProfileAvatar Component', () => {
  const mockProfile = {
    firstName: 'John',
    lastName: 'Doe',
    username: 'testuser',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z'
  };

  it('should render user info correctly', () => {
    renderWithRouter(<ProfileAvatar profile={mockProfile} editing={false} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('should show default avatar when no avatar provided', () => {
    renderWithRouter(<ProfileAvatar profile={mockProfile} editing={false} />);
    
    // Should show UserCircleIcon (default avatar)
    const avatar = screen.getByRole('img', { hidden: true });
    expect(avatar).toBeInTheDocument();
  });

  it('should show custom avatar when provided', () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar: 'https://example.com/avatar.jpg'
    };
    
    renderWithRouter(<ProfileAvatar profile={profileWithAvatar} editing={false} />);
    
    const avatar = screen.getByAltText('Profile');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('should show camera button when editing', () => {
    renderWithRouter(<ProfileAvatar profile={mockProfile} editing={true} />);
    
    const cameraButton = screen.getByRole('button');
    expect(cameraButton).toBeInTheDocument();
  });

  it('should not show camera button when not editing', () => {
    renderWithRouter(<ProfileAvatar profile={mockProfile} editing={false} />);
    
    const cameraButton = screen.queryByRole('button');
    expect(cameraButton).not.toBeInTheDocument();
  });
});

describe('ProfileForm Component', () => {
  const mockFormData = {
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Test Company',
    phone: '+1234567890'
  };

  const mockProps = {
    formData: mockFormData,
    editing: false,
    onChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    renderWithRouter(<ProfileForm {...mockProps} />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  it('should display form data correctly', () => {
    renderWithRouter(<ProfileForm {...mockProps} />);
    
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  it('should disable fields when not editing', () => {
    renderWithRouter(<ProfileForm {...mockProps} />);
    
    expect(screen.getByDisplayValue('testuser')).toBeDisabled();
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
  });

  it('should enable fields when editing', () => {
    const editingProps = { ...mockProps, editing: true };
    renderWithRouter(<ProfileForm {...editingProps} />);
    
    expect(screen.getByDisplayValue('testuser')).not.toBeDisabled();
    expect(screen.getByDisplayValue('test@example.com')).not.toBeDisabled();
  });

  it('should call onChange when field value changes', () => {
    const editingProps = { ...mockProps, editing: true };
    renderWithRouter(<ProfileForm {...editingProps} />);
    
    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newusername' } });
    
    expect(mockProps.onChange).toHaveBeenCalledWith({
      ...mockFormData,
      username: 'newusername'
    });
  });

  it('should show correct placeholders for optional fields', () => {
    renderWithRouter(<ProfileForm {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Optional')).toBeInTheDocument();
  });
});

describe('ProfileSecurity Component', () => {
  it('should render security section', () => {
    renderWithRouter(<ProfileSecurity />);
    
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Two-factor authentication:')).toBeInTheDocument();
    expect(screen.getByText('Not enabled')).toBeInTheDocument();
    expect(screen.getByText('Enable 2FA')).toBeInTheDocument();
  });

  it('should have clickable buttons', () => {
    renderWithRouter(<ProfileSecurity />);
    
    const changePasswordButton = screen.getByText('Change Password');
    const enable2faButton = screen.getByText('Enable 2FA');
    
    expect(changePasswordButton).toBeInTheDocument();
    expect(enable2faButton).toBeInTheDocument();
    
    // Should be clickable (not disabled)
    expect(changePasswordButton).not.toBeDisabled();
    expect(enable2faButton).not.toBeDisabled();
  });
});