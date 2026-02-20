import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('renders correctly with children', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with an icon', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(<Button icon={<TestIcon />}>With Icon</Button>);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /with icon/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);

      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
    });

    it('renders primary variant explicitly', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
      expect(button).toHaveClass('text-white');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200');
      expect(button).toHaveClass('text-gray-900');
    });

    it('renders danger variant', () => {
      render(<Button variant="danger">Danger</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
      expect(button).toHaveClass('text-white');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-700');
      expect(button).not.toHaveClass('bg-indigo-600');
      expect(button).not.toHaveClass('bg-gray-200');
      expect(button).not.toHaveClass('bg-red-600');
    });
  });

  describe('sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2.5');
      expect(button).toHaveClass('py-1.5');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole('button');
      // The Loader2 icon should be rendered with animate-spin class
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('hides icon when loading', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(
        <Button loading icon={<TestIcon />}>
          Loading
        </Button>
      );

      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });

    it('shows icon when not loading', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(
        <Button loading={false} icon={<TestIcon />}>
          Not Loading
        </Button>
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('click handler', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>
      );

      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('has disabled styling', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
      expect(screen.getByRole('button')).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('HTML attributes', () => {
    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('supports aria-label attribute', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('supports data attributes', () => {
      render(<Button data-testid="my-button">Test</Button>);

      expect(screen.getByTestId('my-button')).toBeInTheDocument();
    });
  });
});
