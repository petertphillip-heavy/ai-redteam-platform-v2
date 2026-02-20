import { z } from 'zod';

// ==========================================
// Payload Categories and Severity (matching types.ts)
// ==========================================

export const payloadCategorySchema = z.enum([
  'PROMPT_INJECTION',
  'DATA_EXTRACTION',
  'GUARDRAIL_BYPASS',
  'INTEGRATION_VULN',
]);

export const severitySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);

// ==========================================
// Project Schemas
// ==========================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  targetUrl: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  apiKey: z
    .string()
    .max(500, 'API key must be at most 500 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

// ==========================================
// Payload Schemas
// ==========================================

export const createPayloadSchema = z.object({
  name: z
    .string()
    .min(1, 'Payload name is required')
    .max(100, 'Payload name must be at most 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be at most 1000 characters'),
  category: payloadCategorySchema,
  content: z
    .string()
    .min(1, 'Payload content is required')
    .max(10000, 'Content must be at most 10000 characters'),
  subcategory: z
    .string()
    .max(100, 'Subcategory must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  severity: severitySchema.optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePayloadFormData = z.infer<typeof createPayloadSchema>;

// ==========================================
// Auth Schemas
// ==========================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  name: z
    .string()
    .max(100, 'Name must be at most 100 characters')
    .optional()
    .or(z.literal('')),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// Finding Schemas
// ==========================================

export const createFindingSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  testResultId: z.string().optional().or(z.literal('')),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be at most 5000 characters'),
  severity: severitySchema,
  category: payloadCategorySchema,
  remediation: z
    .string()
    .max(5000, 'Remediation must be at most 5000 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateFindingFormData = z.infer<typeof createFindingSchema>;

// ==========================================
// Test Schemas
// ==========================================

export const startTestSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  categories: z.array(payloadCategorySchema).optional(),
  payloadIds: z.array(z.string()).optional(),
  config: z
    .object({
      parallel: z.boolean().optional(),
      rateLimit: z.number().positive('Rate limit must be positive').optional(),
      timeout: z.number().positive('Timeout must be positive').optional(),
    })
    .optional(),
});

export type StartTestFormData = z.infer<typeof startTestSchema>;

// ==========================================
// Report Schemas
// ==========================================

export const reportTypeSchema = z.enum([
  'EXECUTIVE_SUMMARY',
  'TECHNICAL_DETAIL',
  'FULL_REPORT',
]);

export const generateReportSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  type: reportTypeSchema,
  title: z
    .string()
    .max(200, 'Title must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  includeRemediation: z.boolean().optional(),
});

export type GenerateReportFormData = z.infer<typeof generateReportSchema>;
