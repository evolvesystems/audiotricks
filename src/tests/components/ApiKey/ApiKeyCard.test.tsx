/**
 * ApiKeyCard Component Tests
 * Tests for the refactored ApiKeyCard component and its subcomponents
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter, setupMocks, cleanupMocks, mockApiClient } from '../../utils/testUtils';
import { ApiKeyCard } from '../../../components/ApiKey/ApiKeyCard';
import { ApiKeyEditForm } from '../../../components/ApiKey/ApiKeyEditForm';
import { ApiKeyUsageStats } from '../../../components/ApiKey/ApiKeyUsageStats';

// Mock the API service
vi.mock('../../../services/api', () => ({
  apiClient: mockApiClient
}));

describe('ApiKeyCard Component', () => {
  const mockProps = {
    provider: 'openai',
    info: {
      id: 'key-1',
      provider: 'openai',
      maskedKey: 'sk-...abc123',
      isValid: true,
      updatedAt: '2024-01-01T00:00:00Z'
    },
    loading: false,
    editing: false,
    testing: false,
    usage: {
      totalRequests: 150,
      totalTokens: 50000,
      currentMonthRequests: 25,
      lastUsed: '2024-01-15T10:00:00Z'
    },
    showUsage: false,
    newKey: '',
    showKey: false,
    onEdit: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onTest: vi.fn(),
    onLoadUsage: vi.fn(),
    onToggleUsage: vi.fn(),
    onKeyChange: vi.fn(),
    onToggleShow: vi.fn()
  };

  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Basic Rendering', () => {
    it('should render OpenAI provider correctly', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Used for audio transcription and text analysis')).toBeInTheDocument();
      expect(screen.getByText('Valid')).toBeInTheDocument();
      expect(screen.getByText('sk-...abc123')).toBeInTheDocument();
    });

    it('should render ElevenLabs provider correctly', () => {
      const elevenLabsProps = {
        ...mockProps,
        provider: 'elevenlabs',
        info: {
          ...mockProps.info,
          provider: 'elevenlabs'
        }
      };
      
      renderWithRouter(<ApiKeyCard {...elevenLabsProps} />);
      
      expect(screen.getByText('ElevenLabs')).toBeInTheDocument();
      expect(screen.getByText('Used for voice synthesis and audio generation')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} loading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should show invalid key status', () => {
      const invalidProps = {
        ...mockProps,
        info: {
          ...mockProps.info,
          isValid: false
        }
      };
      
      renderWithRouter(<ApiKeyCard {...invalidProps} />);
      
      expect(screen.getByText('Invalid')).toBeInTheDocument();
    });
  });

  describe('No API Key State', () => {
    it('should render no API key state', () => {
      const noKeyProps = {
        ...mockProps,
        info: null
      };
      
      renderWithRouter(<ApiKeyCard {...noKeyProps} />);
      
      expect(screen.getByText('No API Key')).toBeInTheDocument();
      expect(screen.getByText('Add API Key')).toBeInTheDocument();
      expect(screen.getByText('Get API Key')).toBeInTheDocument();
    });

    it('should trigger edit mode when Add API Key is clicked', () => {
      const noKeyProps = {
        ...mockProps,
        info: null
      };
      
      renderWithRouter(<ApiKeyCard {...noKeyProps} />);
      
      fireEvent.click(screen.getByText('Add API Key'));
      expect(mockProps.onEdit).toHaveBeenCalledWith(true);
    });
  });

  describe('Action Buttons', () => {
    it('should render action buttons for valid keys', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      // Should have at least 3 action buttons (test, usage, delete)
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle test button click', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      const testButton = buttons.find(btn => btn.querySelector('.lucide-test-tube'));
      expect(testButton).toBeInTheDocument();
      fireEvent.click(testButton!);
      expect(mockProps.onTest).toHaveBeenCalled();
    });

    it('should handle usage toggle', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      const usageButton = buttons.find(btn => btn.querySelector('.lucide-bar-chart-3'));
      expect(usageButton).toBeInTheDocument();
      fireEvent.click(usageButton!);
      expect(mockProps.onToggleUsage).toHaveBeenCalled();
    });

    it('should handle delete button click', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(btn => btn.querySelector('.lucide-trash-2'));
      expect(deleteButton).toBeInTheDocument();
      fireEvent.click(deleteButton!);
      expect(mockProps.onDelete).toHaveBeenCalled();
    });

    it('should show testing state', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} testing={true} />);
      
      // Should show loading spinner instead of test icon
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should show edit form when editing', () => {
      const editingProps = {
        ...mockProps,
        editing: true,
        newKey: 'sk-new-key-12345'
      };
      
      renderWithRouter(<ApiKeyCard {...editingProps} />);
      
      expect(screen.getByDisplayValue('sk-new-key-12345')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show Edit button when not editing', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should trigger edit mode', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} />);
      
      fireEvent.click(screen.getByText('Edit'));
      expect(mockProps.onEdit).toHaveBeenCalledWith(true);
    });
  });

  describe('Usage Statistics', () => {
    it('should show usage statistics when toggled', () => {
      const usageProps = {
        ...mockProps,
        showUsage: true
      };
      
      renderWithRouter(<ApiKeyCard {...usageProps} />);
      
      expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
      expect(screen.getByText('Total Requests:')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Total Tokens:')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
    });

    it('should handle refresh usage stats', () => {
      const usageProps = {
        ...mockProps,
        showUsage: true
      };
      
      renderWithRouter(<ApiKeyCard {...usageProps} />);
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockProps.onLoadUsage).toHaveBeenCalled();
    });

    it('should show loading state for usage stats', () => {
      const usageProps = {
        ...mockProps,
        showUsage: true,
        usage: null
      };
      
      renderWithRouter(<ApiKeyCard {...usageProps} />);
      
      // Should show loading spinner for usage stats
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Provider-specific behavior', () => {
    it('should show correct URLs for OpenAI', () => {
      renderWithRouter(<ApiKeyCard {...mockProps} info={null} />);
      
      const getKeyLink = screen.getByText('Get API Key');
      expect(getKeyLink).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
    });

    it('should show correct URLs for ElevenLabs', () => {
      const elevenLabsProps = {
        ...mockProps,
        provider: 'elevenlabs',
        info: null
      };
      
      renderWithRouter(<ApiKeyCard {...elevenLabsProps} />);
      
      const getKeyLink = screen.getByText('Get API Key');
      expect(getKeyLink).toHaveAttribute('href', 'https://elevenlabs.io/app/settings/api');
    });
  });
});

describe('ApiKeyEditForm Component', () => {
  const mockProps = {
    newKey: 'sk-test-key',
    showKey: false,
    onKeyChange: vi.fn(),
    onToggleShow: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form correctly', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your API key...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sk-test-key')).toBeInTheDocument();
  });

  it('should handle key input changes', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    const input = screen.getByDisplayValue('sk-test-key');
    fireEvent.change(input, { target: { value: 'sk-new-key' } });
    
    expect(mockProps.onKeyChange).toHaveBeenCalledWith('sk-new-key');
  });

  it('should toggle key visibility', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(btn => btn.querySelector('.lucide-eye, .lucide-eye-off'));
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton!);
    
    expect(mockProps.onToggleShow).toHaveBeenCalled();
  });

  it('should show key as text when showKey is true', () => {
    const visibleProps = { ...mockProps, showKey: true };
    renderWithRouter(<ApiKeyEditForm {...visibleProps} />);
    
    const input = screen.getByDisplayValue('sk-test-key');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should show key as password when showKey is false', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    const input = screen.getByDisplayValue('sk-test-key');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should handle save button click', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(mockProps.onSave).toHaveBeenCalled();
  });

  it('should handle cancel button click', () => {
    renderWithRouter(<ApiKeyEditForm {...mockProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});

describe('ApiKeyUsageStats Component', () => {
  const mockUsage = {
    totalRequests: 1500,
    totalTokens: 75000,
    currentMonthRequests: 250,
    lastUsed: '2024-01-15T10:00:00Z'
  };

  const mockProps = {
    usage: mockUsage,
    onRefresh: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render usage statistics correctly', () => {
    renderWithRouter(<ApiKeyUsageStats {...mockProps} />);
    
    expect(screen.getByText('Usage Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Requests:')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('Total Tokens:')).toBeInTheDocument();
    expect(screen.getByText('75,000')).toBeInTheDocument();
    expect(screen.getByText('This Month:')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('Last Used:')).toBeInTheDocument();
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
  });

  it('should handle refresh button click', () => {
    renderWithRouter(<ApiKeyUsageStats {...mockProps} />);
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  it('should show loading state when usage is null', () => {
    const loadingProps = { ...mockProps, usage: null };
    renderWithRouter(<ApiKeyUsageStats {...loadingProps} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle null total tokens', () => {
    const noTokensUsage = { ...mockUsage, totalTokens: null };
    const noTokensProps = { ...mockProps, usage: noTokensUsage };
    
    renderWithRouter(<ApiKeyUsageStats {...noTokensProps} />);
    
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle null last used date', () => {
    const noLastUsedUsage = { ...mockUsage, lastUsed: null };
    const noLastUsedProps = { ...mockProps, usage: noLastUsedUsage };
    
    renderWithRouter(<ApiKeyUsageStats {...noLastUsedProps} />);
    
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should disable refresh button when usage is null', () => {
    const loadingProps = { ...mockProps, usage: null };
    renderWithRouter(<ApiKeyUsageStats {...loadingProps} />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeDisabled();
  });
});