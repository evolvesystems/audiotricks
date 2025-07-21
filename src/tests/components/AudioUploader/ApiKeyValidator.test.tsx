import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyValidator } from '../../../components/AudioUploader/ApiKeyValidator';
import ApiKeyService from '../../../services/apikey.service';

// Mock the API key service
vi.mock('../../../services/apikey.service', () => ({
  default: {
    getApiKeyInfo: vi.fn(),
  },
}));

/**
 * Test suite for ApiKeyValidator component - API key validation before upload
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('ApiKeyValidator Component', () => {
  const mockOnValidationChange = vi.fn();
  const mockApiKeyService = vi.mocked(ApiKeyService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('expected use case - shows all required keys are configured when valid', async () => {
    mockApiKeyService.getApiKeyInfo.mockResolvedValue({ isValid: true });
    
    render(
      <ApiKeyValidator 
        requiredKeys={['openai', 'elevenlabs']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for async validation
    await waitFor(() => {
      expect(screen.getByText(/all required api keys are configured and valid/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveClass('bg-green-50', 'border-green-200');
    expect(mockOnValidationChange).toHaveBeenCalledWith(true, []);
  });

  test('expected use case - shows configuration needed when keys missing', async () => {
    mockApiKeyService.getApiKeyInfo
      .mockResolvedValueOnce({ isValid: false }) // openai
      .mockResolvedValueOnce({ isValid: true });  // elevenlabs

    render(
      <ApiKeyValidator 
        requiredKeys={['openai', 'elevenlabs']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/api keys required/i)).toBeInTheDocument();
    });

    expect(screen.getByText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByText('ElevenLabs API Key')).toBeInTheDocument();
    
    // OpenAI should show as missing, ElevenLabs as valid
    const openaiSection = screen.getByText('OpenAI API Key').closest('div');
    const elevenlabsSection = screen.getByText('ElevenLabs API Key').closest('div');
    
    expect(openaiSection).toContainElement(screen.getByText('Get Key'));
    expect(elevenlabsSection).not.toContainElement(screen.getByText('Get Key'));

    expect(mockOnValidationChange).toHaveBeenCalledWith(false, ['openai']);
  });

  test('expected use case - provides links to get API keys', async () => {
    mockApiKeyService.getApiKeyInfo.mockResolvedValue({ isValid: false });
    
    render(
      <ApiKeyValidator 
        requiredKeys={['openai', 'elevenlabs']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/api keys required/i)).toBeInTheDocument();
    });

    const getKeyLinks = screen.getAllByText('Get Key');
    expect(getKeyLinks).toHaveLength(2);
    
    // Check that links have correct URLs
    expect(getKeyLinks[0]).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
    expect(getKeyLinks[1]).toHaveAttribute('href', 'https://elevenlabs.io/app/settings/api');
  });

  test('expected use case - configure button navigates to settings', async () => {
    mockApiKeyService.getApiKeyInfo.mockResolvedValue({ isValid: false });
    
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/configure api keys/i)).toBeInTheDocument();
    });

    const configureButton = screen.getByText(/configure api keys/i);
    fireEvent.click(configureButton);

    expect(window.location.href).toBe('/settings?tab=api-keys');
  });

  test('edge case - handles unknown key types gracefully', async () => {
    mockApiKeyService.getApiKeyInfo.mockResolvedValue({ isValid: false });
    
    render(
      <ApiKeyValidator 
        requiredKeys={['unknown-service']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('UNKNOWN-SERVICE API Key')).toBeInTheDocument();
    });

    // Should still show get key link (fallback behavior)
    expect(screen.getByText('Get Key')).toHaveAttribute('href', '#');
  });

  test('edge case - shows loading state during validation', () => {
    // Make the API call hang to test loading state
    mockApiKeyService.getApiKeyInfo.mockImplementation(() => new Promise(() => {}));
    
    render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText(/checking api keys.../i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  test('edge case - refresh button re-validates keys', async () => {
    mockApiKeyService.getApiKeyInfo
      .mockResolvedValueOnce({ isValid: false })
      .mockResolvedValueOnce({ isValid: true });

    render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for initial validation
    await waitFor(() => {
      expect(screen.getByText(/api keys required/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByText(/refresh/i);
    fireEvent.click(refreshButton);

    // Should show loading state and then success
    await waitFor(() => {
      expect(screen.getByText(/all required api keys are configured and valid/i)).toBeInTheDocument();
    });

    expect(mockApiKeyService.getApiKeyInfo).toHaveBeenCalledTimes(2);
  });

  test('failure case - handles API service errors gracefully', async () => {
    mockApiKeyService.getApiKeyInfo.mockRejectedValue(new Error('Service unavailable'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false, ['openai']);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking API keys:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  test('failure case - handles partial validation failures', async () => {
    mockApiKeyService.getApiKeyInfo
      .mockResolvedValueOnce({ isValid: true })  // openai succeeds
      .mockRejectedValueOnce(new Error('Network error')); // elevenlabs fails

    render(
      <ApiKeyValidator 
        requiredKeys={['openai', 'elevenlabs']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false, ['elevenlabs']);
    });

    // Should show mixed state - openai valid, elevenlabs invalid
    expect(screen.getByText(/api keys required/i)).toBeInTheDocument();
  });

  test('edge case - updates validation when required keys change', async () => {
    mockApiKeyService.getApiKeyInfo.mockResolvedValue({ isValid: true });
    
    const { rerender } = render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockApiKeyService.getApiKeyInfo).toHaveBeenCalledTimes(1);
    });

    // Change required keys
    rerender(
      <ApiKeyValidator 
        requiredKeys={['openai', 'elevenlabs']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockApiKeyService.getApiKeyInfo).toHaveBeenCalledTimes(3); // 1 initial + 2 for new keys
    });
  });

  test('edge case - handles empty required keys array', async () => {
    render(
      <ApiKeyValidator 
        requiredKeys={[]} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(true, []);
    });

    expect(screen.getByText(/all required api keys are configured and valid/i)).toBeInTheDocument();
  });

  test('failure case - validates key info structure', async () => {
    // Test malformed response from API service
    mockApiKeyService.getApiKeyInfo.mockResolvedValue(null as any);
    
    render(
      <ApiKeyValidator 
        requiredKeys={['openai']} 
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false, ['openai']);
    });
  });
});