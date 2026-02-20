import { useState, useCallback } from 'react';
import type { ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export interface UseFormValidationReturn<T> {
  /** Map of field names to error messages */
  errors: Record<string, string>;
  /** Validate data against the schema, returns success status and validated data */
  validate: (data: unknown) => ValidationResult<T>;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear error for a specific field */
  clearFieldError: (field: string) => void;
  /** Manually set an error for a specific field */
  setFieldError: (field: string, message: string) => void;
  /** Check if a specific field has an error */
  hasError: (field: string) => boolean;
  /** Get error message for a specific field */
  getError: (field: string) => string | undefined;
}

/**
 * Custom hook for form validation using Zod schemas.
 *
 * @param schema - A Zod schema to validate against
 * @returns Validation utilities including errors map and validate function
 *
 * @example
 * ```tsx
 * const { errors, validate, clearFieldError } = useFormValidation(createProjectSchema);
 *
 * const handleSubmit = (e: React.FormEvent) => {
 *   e.preventDefault();
 *   const result = validate(formData);
 *   if (result.success) {
 *     // Submit validated data
 *     onSubmit(result.data);
 *   }
 * };
 * ```
 */
export function useFormValidation<T>(
  schema: ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseZodErrors = useCallback((error: ZodError): Record<string, string> => {
    const errorMap: Record<string, string> = {};

    for (const issue of error.issues) {
      // Get the field path (handles nested fields like "config.timeout")
      const path = issue.path.join('.');

      // Only set the first error for each field
      if (!errorMap[path]) {
        errorMap[path] = issue.message;
      }
    }

    return errorMap;
  }, []);

  const validate = useCallback(
    (data: unknown): ValidationResult<T> => {
      const result = schema.safeParse(data);

      if (result.success) {
        setErrors({});
        return {
          success: true,
          data: result.data,
        };
      }

      const errorMap = parseZodErrors(result.error);
      setErrors(errorMap);

      return {
        success: false,
        errors: errorMap,
      };
    },
    [schema, parseZodErrors]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const hasError = useCallback(
    (field: string): boolean => {
      return !!errors[field];
    },
    [errors]
  );

  const getError = useCallback(
    (field: string): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  return {
    errors,
    validate,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasError,
    getError,
  };
}

/**
 * Utility type to extract the inferred type from a Zod schema
 */
export type InferSchema<S extends ZodSchema> = S extends ZodSchema<infer T> ? T : never;
