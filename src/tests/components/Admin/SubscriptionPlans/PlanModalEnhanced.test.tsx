import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlanModalEnhanced from '../../../../components/Admin/SubscriptionPlans/PlanModalEnhanced';
import { SubscriptionPlan } from '../../../../components/Admin/SubscriptionPlans/types';

const mockPlan: SubscriptionPlan = {
  id: '1',
  name: 'Professional',
  displayName: 'Professional Plan',
  tier: 'professional',
  description: 'Perfect for professionals',
  price: 29.99,
  currency: 'AUD',
  billingInterval: 'monthly',
  maxApiCalls: 10000,
  maxStorageMb: 5120,
  maxProcessingMin: 600,
  maxFileSize: 314572800,
  maxTranscriptionsMonthly: 500,
  maxFilesDaily: 50,
  maxFilesMonthly: 1000,
  maxAudioDurationMinutes: 480,
  maxConcurrentJobs: 5,
  maxVoiceSynthesisMonthly: 100,
  maxExportOperationsMonthly: 500,
  maxWorkspaces: 3,
  maxUsers: 10,
  priorityLevel: 7,
  features: ['Advanced Transcription', 'API Access'],
  collaborationFeatures: ['Team Projects', 'Shared Workspaces'],
  isActive: true,
  isPublic: true,
  planCategory: 'business'
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  token: 'mock-token'
};

describe('PlanModalEnhanced Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create plan modal when no plan provided', () => {
    render(<PlanModalEnhanced {...defaultProps} />);
    
    expect(screen.getByText('Create New Plan')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Limits')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('renders edit plan modal when plan provided', () => {
    render(<PlanModalEnhanced {...defaultProps} plan={mockPlan} />);
    
    expect(screen.getByText('Edit Subscription Plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Professional')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Perfect for professionals')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<PlanModalEnhanced {...defaultProps} />);
    
    // Default tab should be basic
    expect(screen.getByPlaceholderText('e.g., Professional')).toBeInTheDocument();
    
    // Switch to limits tab
    fireEvent.click(screen.getByText('Limits'));
    expect(screen.getByText('Transcription Limits')).toBeInTheDocument();
    
    // Switch to team tab
    fireEvent.click(screen.getByText('Team'));
    expect(screen.getByText('Team & Collaboration')).toBeInTheDocument();
    
    // Switch to features tab
    fireEvent.click(screen.getByText('Features'));
    expect(screen.getByText('General Features')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<PlanModalEnhanced {...defaultProps} />);
    
    const createButton = screen.getByText('Create Plan');
    fireEvent.click(createButton);
    
    // Should show validation error for required fields
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  it('handles form input changes', () => {
    render(<PlanModalEnhanced {...defaultProps} />);
    
    const nameInput = screen.getByPlaceholderText('e.g., Professional');
    fireEvent.change(nameInput, { target: { value: 'Test Plan' } });
    
    expect(nameInput.value).toBe('Test Plan');
  });

  it('handles form submission for new plan', async () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    render(<PlanModalEnhanced {...defaultProps} onSave={mockOnSave} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('e.g., Professional'), {
      target: { value: 'Test Plan' }
    });
    fireEvent.change(screen.getByPlaceholderText('Brief description of what this plan includes...'), {
      target: { value: 'Test description' }
    });
    
    const createButton = screen.getByText('Create Plan');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('closes modal when close button clicked', () => {
    const mockOnClose = vi.fn();
    render(<PlanModalEnhanced {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(<PlanModalEnhanced {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create New Plan')).not.toBeInTheDocument();
  });
});