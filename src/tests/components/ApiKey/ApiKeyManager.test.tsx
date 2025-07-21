import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyManager } from '../../../../components/ApiKeyManager.backup';
import ApiKeyService from '../../../../services/apikey.service';

// Mock the API service
vi.mock('../../../../services/apikey.service');

const mockApiKeyService = vi.mocked(ApiKeyService);

describe('ApiKeyManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockApiKeyService.listApiKeys.mockResolvedValue({
      keys: [
        {
          id: '1',
          provider: 'openai',
          keyPrefix: 'sk-****',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastUsedAt: '2024-01-02T00:00:00Z',
          usageCount: 10
        }
      ]
    });
    
    mockApiKeyService.getProviderInfo.mockImplementation((provider) => ({
      name: provider === 'openai' ? 'OpenAI' : 'ElevenLabs',
      description: 'AI service provider',
      icon: '🤖'
    }));
    
    mockApiKeyService.getSetupInstructions.mockReturnValue({
      title: 'Setup Instructions',
      steps: ['Step 1', 'Step 2'],
      helpUrl: 'https://example.com/help'
    });
    
    mockApiKeyService.validateApiKeyFormat.mockReturnValue({
      valid: true,
      error: null
    });
  });

  it('renders API key management interface', async () => {
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('API Key Management')).toBeInTheDocument();
      expect(screen.getByText('Securely store and manage your API keys for audio processing services.')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<ApiKeyManager />);
    
    expect(screen.getByText('Loading API keys...')).toBeInTheDocument();
  });

  it('displays provider cards after loading', async () => {
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('ElevenLabs')).toBeInTheDocument();
    });
  });

  it('shows configured status for existing keys', async () => {
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Configured')).toBeInTheDocument();
    });
  });

  it('handles saving new API key', async () => {
    mockApiKeyService.saveApiKey.mockResolvedValue(undefined);
    
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('ElevenLabs')).toBeInTheDocument();
    });
    
    // Find the key input for ElevenLabs (which should show add form since no key exists)
    const keyInputs = screen.getAllByPlaceholderText(/Enter your .* API key/);
    const elevenlabsInput = keyInputs.find(input => 
      input.getAttribute('placeholder')?.includes('ElevenLabs')
    );
    
    if (elevenlabsInput) {
      fireEvent.change(elevenlabsInput, { target: { value: 'test-api-key' } });
      
      const saveButtons = screen.getAllByText(/Save Key/);
      fireEvent.click(saveButtons[0]);
      
      await waitFor(() => {
        expect(mockApiKeyService.saveApiKey).toHaveBeenCalledWith('elevenlabs', 'test-api-key');
      });
    }
  });

  it('handles testing API key', async () => {
    mockApiKeyService.testApiKey.mockResolvedValue({
      valid: true,
      error: null
    });
    
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      const testButton = screen.getByText('Test Key');
      fireEvent.click(testButton);
    });
    
    await waitFor(() => {
      expect(mockApiKeyService.testApiKey).toHaveBeenCalledWith('openai');
    });
  });

  it('handles deleting API key', async () => {
    mockApiKeyService.deleteApiKey.mockResolvedValue(undefined);
    
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
    
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
    });
    
    await waitFor(() => {
      expect(mockApiKeyService.deleteApiKey).toHaveBeenCalledWith('openai');
    });
    
    vi.unstubAllGlobals();
  });

  it('shows security notice', async () => {
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Security Notice')).toBeInTheDocument();
      expect(screen.getByText(/Your API keys are encrypted and stored securely/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApiKeyService.listApiKeys.mockRejectedValue(new Error('Failed to load'));
    
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load API keys')).toBeInTheDocument();
    });
  });

  it('validates API key format before saving', async () => {
    mockApiKeyService.validateApiKeyFormat.mockReturnValue({
      valid: false,
      error: 'Invalid format'
    });
    
    render(<ApiKeyManager />);
    
    await waitFor(() => {
      expect(screen.getByText('ElevenLabs')).toBeInTheDocument();
    });
    
    const keyInputs = screen.getAllByPlaceholderText(/Enter your .* API key/);
    const elevenlabsInput = keyInputs.find(input => 
      input.getAttribute('placeholder')?.includes('ElevenLabs')
    );
    
    if (elevenlabsInput) {
      fireEvent.change(elevenlabsInput, { target: { value: 'invalid-key' } });
      
      const saveButtons = screen.getAllByText(/Save Key/);
      fireEvent.click(saveButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid format')).toBeInTheDocument();
      });
    }
  });
});