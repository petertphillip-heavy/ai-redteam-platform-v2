// Auth
export type UserRole = 'ADMIN' | 'USER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  isActive?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

// Enums
export type PayloadCategory = 'PROMPT_INJECTION' | 'DATA_EXTRACTION' | 'GUARDRAIL_BYPASS' | 'INTEGRATION_VULN';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type TestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
export type ReportType = 'EXECUTIVE_SUMMARY' | 'TECHNICAL_DETAIL' | 'FULL_REPORT';

// Payload
export interface Payload {
  id: string;
  name: string;
  description: string;
  category: PayloadCategory;
  subcategory?: string;
  content: string;
  variables?: Record<string, unknown>;
  severity: Severity;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayloadInput {
  name: string;
  description: string;
  category: PayloadCategory;
  subcategory?: string;
  content: string;
  variables?: Record<string, unknown>;
  severity?: Severity;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdatePayloadInput extends Partial<CreatePayloadInput> {}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  targetUrl?: string;
  apiKey?: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  targetUrl?: string;
  apiKey?: string;
  config?: Record<string, unknown>;
}

// Test Run
export interface TestRun {
  name?: string;
  totalPayloads: number;
  completedPayloads: number;
  successfulAttacks: number;
  categories?: PayloadCategory[];
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  status: TestStatus;
  config?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  results?: TestResult[];
  _count?: { results: number };
}

export interface TestResult {
  id: string;
  testRunId: string;
  payloadId: string;
  payload?: Payload;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  success: boolean;
  confidence?: number;
  duration?: number;
  notes?: string;
  createdAt: string;
}

export interface StartTestInput {
  projectId: string;
  categories?: PayloadCategory[];
  payloadIds?: string[];
  config?: {
    parallel?: boolean;
    rateLimit?: number;
    timeout?: number;
  };
}

// Finding
export interface Finding {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  testResultId?: string;
  testResult?: {
    id: string;
    payload?: { id: string; name: string };
  };
  title: string;
  description: string;
  severity: Severity;
  category: PayloadCategory;
  evidence?: Record<string, unknown>;
  remediation?: string;
  status: FindingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFindingInput {
  projectId: string;
  testResultId?: string;
  title: string;
  description: string;
  severity: Severity;
  category: PayloadCategory;
  evidence?: Record<string, unknown>;
  remediation?: string;
}

// Report
export interface Report {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  title: string;
  type: ReportType;
  content: Record<string, unknown>;
  generatedAt: string;
}

export interface GenerateReportInput {
  projectId: string;
  type: ReportType;
  title?: string;
  includeRemediation?: boolean;
}

// Pagination
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Stats
export interface DashboardStats {
  payloads: {
    total: number;
    byCategory: Record<PayloadCategory, number>;
    bySeverity: Record<Severity, number>;
  };
  projects: {
    total: number;
  };
  tests: {
    total: number;
    byStatus: Record<TestStatus, number>;
    recentRuns: TestRun[];
  };
  findings: {
    total: number;
    bySeverity: Record<Severity, number>;
    byStatus: Record<FindingStatus, number>;
    byCategory: Record<PayloadCategory, number>;
  };
}

// Analytics
export interface AnalyticsData {
  testTrends: {
    date: string;
    total: number;
    successful: number;
    failed: number;
  }[];
  categoryEffectiveness: {
    category: PayloadCategory;
    total: number;
    successful: number;
    successRate: number;
  }[];
  severityDistribution: {
    severity: Severity;
    count: number;
  }[];
  projectComparison: {
    projectId: string;
    projectName: string;
    totalTests: number;
    findings: number;
    criticalFindings: number;
  }[];
  payloadEffectiveness: {
    payloadId: string;
    payloadName: string;
    timesUsed: number;
    successCount: number;
    successRate: number;
  }[];
  summary: {
    totalTests: number;
    totalFindings: number;
    avgSuccessRate: number;
    mostVulnerableCategory: string | null;
  };
}
