import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation, ValidationResult } from '../../hooks/useFormValidation';

describe('useFormValidation', () => {
  // Sample schemas for testing
  const simpleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
  });

  const nestedSchema = z.object({
    user: z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().min(0, 'Age must be positive'),
    }),
    settings: z.object({
      notifications: z.boolean(),
    }),
  });

  const complexSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().max(100, 'Description must be at most 100 characters').optional(),
    priority: z.enum(['low', 'medium', 'high']),
  });

  describe('initial state', () => {
    it('starts with empty errors', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      expect(result.current.errors).toEqual({});
    });
  });

  describe('validate', () => {
    describe('validation success', () => {
      it('returns success true for valid data', () => {
        const { result } = renderHook(() => useFormValidation(simpleSchema));

        let validationResult;
        act(() => {
          validationResult = result.current.validate({
            name: 'John Doe',
            email: 'john@example.com',
          });
        });

        expect(validationResult).toEqual({
          success: true,
          data: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        });
      });

      it('clears errors on successful validation', () => {
        const { result } = renderHook(() => useFormValidation(simpleSchema));

        // First, trigger validation errors
        act(() => {
          result.current.validate({ name: '', email: 'invalid' });
        });
        expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

        // Then validate with valid data
        act(() => {
          result.current.validate({
            name: 'John Doe',
            email: 'john@example.com',
          });
        });

        expect(result.current.errors).toEqual({});
      });

      it('returns validated and transformed data', () => {
        const transformSchema = z.object({
          email: z.string().email().toLowerCase(),
        });
        const { result } = renderHook(() => useFormValidation(transformSchema));

        let validationResult;
        act(() => {
          validationResult = result.current.validate({
            email: 'JOHN@EXAMPLE.COM',
          });
        });

        expect(validationResult).toEqual({
          success: true,
          data: {
            email: 'john@example.com',
          },
        });
      });
    });

    describe('validation failure with errors', () => {
      it('returns success false for invalid data', () => {
        const { result } = renderHook(() => useFormValidation(simpleSchema));

        let validationResult: ValidationResult<unknown> | undefined;
        act(() => {
          validationResult = result.current.validate({
            name: '',
            email: 'invalid-email',
          });
        });

        expect(validationResult?.success).toBe(false);
      });

      it('populates errors for invalid fields', () => {
        const { result } = renderHook(() => useFormValidation(simpleSchema));

        act(() => {
          result.current.validate({
            name: '',
            email: 'invalid-email',
          });
        });

        expect(result.current.errors).toEqual({
          name: 'Name is required',
          email: 'Invalid email address',
        });
      });

      it('returns errors in validation result', () => {
        const { result } = renderHook(() => useFormValidation(simpleSchema));

        let validationResult: ValidationResult<unknown> | undefined;
        act(() => {
          validationResult = result.current.validate({
            name: '',
            email: 'invalid-email',
          });
        });

        expect(validationResult?.errors).toEqual({
          name: 'Name is required',
          email: 'Invalid email address',
        });
      });

      it('handles nested field errors with dot notation', () => {
        const { result } = renderHook(() => useFormValidation(nestedSchema));

        act(() => {
          result.current.validate({
            user: {
              name: '',
              age: -5,
            },
            settings: {
              notifications: true,
            },
          });
        });

        expect(result.current.errors['user.name']).toBe('Name is required');
        expect(result.current.errors['user.age']).toBe('Age must be positive');
      });

      it('only keeps first error per field', () => {
        const multiErrorSchema = z.object({
          password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain uppercase')
            .regex(/[0-9]/, 'Password must contain number'),
        });
        const { result } = renderHook(() => useFormValidation(multiErrorSchema));

        act(() => {
          result.current.validate({ password: 'ab' });
        });

        // Should only have one error for password (the first one)
        expect(result.current.errors.password).toBe('Password must be at least 8 characters');
      });

      it('handles missing required fields', () => {
        const { result } = renderHook(() => useFormValidation(complexSchema));

        act(() => {
          result.current.validate({});
        });

        expect(result.current.errors.title).toBeDefined();
        expect(result.current.errors.priority).toBeDefined();
      });
    });
  });

  describe('clearErrors', () => {
    it('clears all errors', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      // First add some errors
      act(() => {
        result.current.validate({ name: '', email: 'invalid' });
      });
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Then clear them
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });

    it('has no effect when there are no errors', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('clearFieldError', () => {
    it('clears error for specific field', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      // First add errors
      act(() => {
        result.current.validate({ name: '', email: 'invalid' });
      });
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();

      // Clear only the name error
      act(() => {
        result.current.clearFieldError('name');
      });

      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.email).toBeDefined();
    });

    it('does nothing when clearing non-existent field error', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: '', email: 'valid@email.com' });
      });
      const errorsBefore = { ...result.current.errors };

      act(() => {
        result.current.clearFieldError('nonexistent');
      });

      expect(result.current.errors).toEqual(errorsBefore);
    });
  });

  describe('setFieldError', () => {
    it('sets error for a specific field', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.setFieldError('name', 'Custom error message');
      });

      expect(result.current.errors.name).toBe('Custom error message');
    });

    it('overwrites existing error for a field', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: '', email: 'valid@email.com' });
      });
      expect(result.current.errors.name).toBe('Name is required');

      act(() => {
        result.current.setFieldError('name', 'Different error');
      });

      expect(result.current.errors.name).toBe('Different error');
    });

    it('can set error for field not in schema', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.setFieldError('customField', 'Server error');
      });

      expect(result.current.errors.customField).toBe('Server error');
    });

    it('preserves other field errors', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: '', email: 'invalid' });
      });

      act(() => {
        result.current.setFieldError('name', 'New name error');
      });

      expect(result.current.errors.name).toBe('New name error');
      expect(result.current.errors.email).toBe('Invalid email address');
    });
  });

  describe('hasError', () => {
    it('returns true when field has error', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: '', email: 'valid@email.com' });
      });

      expect(result.current.hasError('name')).toBe(true);
    });

    it('returns false when field has no error', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: 'John', email: 'invalid' });
      });

      expect(result.current.hasError('name')).toBe(false);
    });

    it('returns false for non-existent field', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      expect(result.current.hasError('nonexistent')).toBe(false);
    });
  });

  describe('getError', () => {
    it('returns error message when field has error', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: '', email: 'valid@email.com' });
      });

      expect(result.current.getError('name')).toBe('Name is required');
    });

    it('returns undefined when field has no error', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      act(() => {
        result.current.validate({ name: 'John', email: 'invalid' });
      });

      expect(result.current.getError('name')).toBeUndefined();
    });

    it('returns undefined for non-existent field', () => {
      const { result } = renderHook(() => useFormValidation(simpleSchema));

      expect(result.current.getError('nonexistent')).toBeUndefined();
    });
  });

  describe('schema changes', () => {
    it('uses updated schema when re-rendered with new schema', () => {
      const schema1 = z.object({
        name: z.string().min(1, 'Name required'),
      });
      const schema2 = z.object({
        name: z.string().min(5, 'Name must be at least 5 characters'),
      });

      const { result, rerender } = renderHook(
        ({ schema }) => useFormValidation(schema),
        { initialProps: { schema: schema1 } }
      );

      // Validate with original schema
      act(() => {
        result.current.validate({ name: 'abc' });
      });
      expect(result.current.errors.name).toBeUndefined();

      // Rerender with new schema
      rerender({ schema: schema2 });

      // Validate with new schema
      act(() => {
        result.current.validate({ name: 'abc' });
      });
      expect(result.current.errors.name).toBe('Name must be at least 5 characters');
    });
  });
});
