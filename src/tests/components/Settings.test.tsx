/**
 * Settings Component Tests
 * Tests for the Settings modal component and its functionality
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter, setupMocks, cleanupMocks } from '../utils/testUtils';
import Settings, { UserSettings } from '../../components/Settings';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = mockLocalStorage as any;

describe('Settings Component', () => {
  const mockSettings: UserSettings = {
    summaryStyle: 'formal',
    outputLanguage: 'en',
    temperature: 0.3,
    maxTokens: 2000,
    showCostEstimates: true
  };

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSettingsChange: vi.fn(),
    currentSettings: mockSettings
  };

  beforeEach(() => {
    setupMocks();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when open', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByText('Default Settings')).toBeInTheDocument();
      expect(screen.getByText('Default Summary Style')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const closedProps = { ...mockProps, isOpen: false };
      renderWithRouter(<Settings {...closedProps} />);
      
      expect(screen.queryByText('Default Settings')).not.toBeInTheDocument();
    });

    it('should show close button', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Settings Sections', () => {
    it('should render summary style section', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByText('Summary Style')).toBeInTheDocument();
      expect(screen.getByText('Choose how you want your summaries formatted')).toBeInTheDocument();
    });

    it('should render language settings', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByText('Output Language')).toBeInTheDocument();
      expect(screen.getByText('Language for generated summaries and analysis')).toBeInTheDocument();
    });

    it('should render advanced settings', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
      expect(screen.getByText('Fine-tune the AI processing parameters')).toBeInTheDocument();
    });

    it('should render display preferences', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByText('Display Preferences')).toBeInTheDocument();
      expect(screen.getByText('Customize the user interface')).toBeInTheDocument();
    });
  });

  describe('Form Controls', () => {
    it('should show current summary style selection', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const formalRadio = screen.getByRole('radio', { name: /formal/i });
      expect(formalRadio).toBeChecked();
    });

    it('should show current language selection', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const languageSelect = screen.getByDisplayValue('English');
      expect(languageSelect).toBeInTheDocument();
    });

    it('should show temperature slider with current value', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tempSlider = screen.getByLabelText(/temperature/i);
      expect(tempSlider).toHaveValue('0.3');
    });

    it('should show max tokens input with current value', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tokensInput = screen.getByLabelText(/max tokens/i);
      expect(tokensInput).toHaveValue(2000);
    });

    it('should show cost estimates toggle in correct state', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const costToggle = screen.getByRole('checkbox', { name: /show cost estimates/i });
      expect(costToggle).toBeChecked();
    });
  });

  describe('Form Interactions', () => {
    it('should update summary style when changed', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const casualRadio = screen.getByRole('radio', { name: /casual/i });
      fireEvent.click(casualRadio);
      
      expect(casualRadio).toBeChecked();
    });

    it('should update language when changed', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const languageSelect = screen.getByDisplayValue('English');
      fireEvent.change(languageSelect, { target: { value: 'es' } });
      
      expect(languageSelect).toHaveValue('es');
    });

    it('should update temperature when slider moved', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tempSlider = screen.getByLabelText(/temperature/i);
      fireEvent.change(tempSlider, { target: { value: '0.7' } });
      
      expect(tempSlider).toHaveValue('0.7');
    });

    it('should update max tokens when input changed', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tokensInput = screen.getByLabelText(/max tokens/i);
      fireEvent.change(tokensInput, { target: { value: '3000' } });
      
      expect(tokensInput).toHaveValue(3000);
    });

    it('should toggle cost estimates', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const costToggle = screen.getByRole('checkbox', { name: /show cost estimates/i });
      fireEvent.click(costToggle);
      
      expect(costToggle).not.toBeChecked();
    });
  });

  describe('Action Buttons', () => {
    it('should render save and cancel buttons', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render reset button', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Save Functionality', () => {
    it('should save settings and close modal', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      // Change a setting
      const casualRadio = screen.getByRole('radio', { name: /casual/i });
      fireEvent.click(casualRadio);
      
      // Save
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      expect(mockProps.onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ summaryStyle: 'casual' })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'audioTricksSettings',
        expect.stringContaining('casual')
      );
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should save multiple setting changes', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      // Change multiple settings
      const casualRadio = screen.getByRole('radio', { name: /casual/i });
      fireEvent.click(casualRadio);
      
      const tempSlider = screen.getByLabelText(/temperature/i);
      fireEvent.change(tempSlider, { target: { value: '0.7' } });
      
      const costToggle = screen.getByRole('checkbox', { name: /show cost estimates/i });
      fireEvent.click(costToggle);
      
      // Save
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveButton);
      
      expect(mockProps.onSettingsChange).toHaveBeenCalledWith({
        summaryStyle: 'casual',
        outputLanguage: 'en',
        temperature: 0.7,
        maxTokens: 2000,
        showCostEstimates: false
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset settings to defaults', () => {
      const customSettings = {
        ...mockSettings,
        summaryStyle: 'casual' as const,
        temperature: 0.8,
        showCostEstimates: false
      };
      const propsWithCustom = { ...mockProps, currentSettings: customSettings };
      
      renderWithRouter(<Settings {...propsWithCustom} />);
      
      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
      fireEvent.click(resetButton);
      
      // Check that form shows default values
      const formalRadio = screen.getByRole('radio', { name: /formal/i });
      expect(formalRadio).toBeChecked();
      
      const tempSlider = screen.getByLabelText(/temperature/i);
      expect(tempSlider).toHaveValue('0.3');
      
      const costToggle = screen.getByRole('checkbox', { name: /show cost estimates/i });
      expect(costToggle).toBeChecked();
    });
  });

  describe('Settings Persistence', () => {
    it('should update local settings when props change', () => {
      const { rerender } = renderWithRouter(<Settings {...mockProps} />);
      
      const updatedSettings = { ...mockSettings, summaryStyle: 'technical' as const };
      const updatedProps = { ...mockProps, currentSettings: updatedSettings };
      
      rerender(<Settings {...updatedProps} />);
      
      const technicalRadio = screen.getByRole('radio', { name: /technical/i });
      expect(technicalRadio).toBeChecked();
    });
  });

  describe('Validation', () => {
    it('should handle invalid temperature values', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tempSlider = screen.getByLabelText(/temperature/i);
      fireEvent.change(tempSlider, { target: { value: '1.5' } });
      
      // Should be clamped to max value
      expect(parseFloat(tempSlider.value)).toBeLessThanOrEqual(1.0);
    });

    it('should handle invalid max tokens values', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const tokensInput = screen.getByLabelText(/max tokens/i);
      fireEvent.change(tokensInput, { target: { value: '-100' } });
      
      // Should handle negative values gracefully
      expect(parseInt(tokensInput.value)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithRouter(<Settings {...mockProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex');
    });
  });
});