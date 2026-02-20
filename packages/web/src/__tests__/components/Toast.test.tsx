import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../../components/Toast';
import type { ToastType } from '../../contexts/ToastContext';

describe('Toast', () => {
  const defaultProps = {
    id: 'test-toast-1',
    type: 'info' as ToastType,
    message: 'Test message',
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with message', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with role="alert"', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-live="polite" for accessibility', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('renders dismiss button with accessible label', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders success variant with correct styling', () => {
      render(<Toast {...defaultProps} type="success" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50');
      expect(alert).toHaveClass('text-green-800');
      expect(alert).toHaveClass('border-green-200');
    });

    it('renders error variant with correct styling', () => {
      render(<Toast {...defaultProps} type="error" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50');
      expect(alert).toHaveClass('text-red-800');
      expect(alert).toHaveClass('border-red-200');
    });

    it('renders warning variant with correct styling', () => {
      render(<Toast {...defaultProps} type="warning" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50');
      expect(alert).toHaveClass('text-yellow-800');
      expect(alert).toHaveClass('border-yellow-200');
    });

    it('renders info variant with correct styling', () => {
      render(<Toast {...defaultProps} type="info" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');
      expect(alert).toHaveClass('text-blue-800');
      expect(alert).toHaveClass('border-blue-200');
    });
  });

  describe('dismiss button', () => {
    it('calls onDismiss with toast id after animation', async () => {
      vi.useRealTimers();
      const onDismiss = vi.fn();
      render(<Toast {...defaultProps} onDismiss={onDismiss} />);

      const user = userEvent.setup();
      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });

      await user.click(dismissButton);

      // Wait for exit animation (200ms) plus a small buffer
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(onDismiss).toHaveBeenCalledWith('test-toast-1');
    });

    it('triggers exit animation on dismiss', async () => {
      vi.useRealTimers();
      render(<Toast {...defaultProps} />);

      // Wait for enter animation
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('translate-x-0');
      expect(alert).toHaveClass('opacity-100');

      const user = userEvent.setup();
      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });

      await user.click(dismissButton);

      // Check that exit animation is triggered
      expect(alert).toHaveClass('translate-x-full');
      expect(alert).toHaveClass('opacity-0');
    });
  });

  describe('enter animation', () => {
    it('starts hidden and becomes visible after timeout', () => {
      render(<Toast {...defaultProps} />);

      const alert = screen.getByRole('alert');

      // Initially should have exit classes (hidden state)
      expect(alert).toHaveClass('translate-x-full');
      expect(alert).toHaveClass('opacity-0');

      // After enter animation timeout
      act(() => {
        vi.advanceTimersByTime(10);
      });

      // Should now be visible
      expect(alert).toHaveClass('translate-x-0');
      expect(alert).toHaveClass('opacity-100');
    });
  });

  describe('icon rendering', () => {
    it('renders CheckCircle icon for success type', () => {
      render(<Toast {...defaultProps} type="success" />);

      // The icon should be within a span with the success icon color
      const iconContainer = screen.getByRole('alert').querySelector('.text-green-500');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders XCircle icon for error type', () => {
      render(<Toast {...defaultProps} type="error" />);

      const iconContainer = screen.getByRole('alert').querySelector('.text-red-500');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders AlertTriangle icon for warning type', () => {
      render(<Toast {...defaultProps} type="warning" />);

      const iconContainer = screen.getByRole('alert').querySelector('.text-yellow-500');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders Info icon for info type', () => {
      render(<Toast {...defaultProps} type="info" />);

      const iconContainer = screen.getByRole('alert').querySelector('.text-blue-500');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('dismiss button colors', () => {
    it('has success dismiss button styling', () => {
      render(<Toast {...defaultProps} type="success" />);

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toHaveClass('text-green-500');
    });

    it('has error dismiss button styling', () => {
      render(<Toast {...defaultProps} type="error" />);

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toHaveClass('text-red-500');
    });

    it('has warning dismiss button styling', () => {
      render(<Toast {...defaultProps} type="warning" />);

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toHaveClass('text-yellow-500');
    });

    it('has info dismiss button styling', () => {
      render(<Toast {...defaultProps} type="info" />);

      const dismissButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(dismissButton).toHaveClass('text-blue-500');
    });
  });
});
