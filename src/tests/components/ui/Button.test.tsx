import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../components/ui/Button';

/**
 * Test suite for Button component
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('Button Component', () => {
  test('expected use case - renders button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('px-4', 'py-2');
  });

  test('expected use case - handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('expected use case - applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');

    rerender(<Button variant="secondary">Secondary</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'border-gray-300');
  });

  test('edge case - shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    // Should show loading spinner
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('edge case - handles different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm');

    rerender(<Button size="md">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  test('edge case - applies custom className correctly', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    // Should still have base classes
    expect(button).toHaveClass('px-4', 'py-2');
  });

  test('failure case - disabled button does not trigger onClick', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('failure case - loading button does not trigger onClick', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('failure case - handles invalid variant gracefully', () => {
    // Should fallback to primary variant
    render(<Button variant={'invalid' as any}>Invalid</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white'); // Primary styles
  });

  test('edge case - forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref test</Button>);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  test('edge case - spreads additional props', () => {
    render(<Button data-testid="test-button" aria-label="Test button">Test</Button>);
    
    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });
});