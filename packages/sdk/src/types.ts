// ============================================
// ENUMS & CONSTANTS
// ============================================

export type PayloadCategory =
  | 'PROMPT_INJECTION'
  | 'DATA_EXTRACTION'
  | 'GUARDRAIL_BYPASS'
  | 'INTEGRATION_VULN';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type TestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';

export type TargetType = 'API' | 'CHATBOT' | 'COPILOT' | 'AGENT' | 'CUSTOM';

export type ReportType = 'EXECUTIVE_SUMMARY' | 'TECHNICAL_DETAIL' | 'FULL_REPORT';

// ============================================
// PAYLOADS
// ============================================

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

export interface PayloadFilters {
  category?: PayloadCategory;
  subcategory?: string;
  severity?: Severity;
  tags?: string[];
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// PROJECTS
// ============================================

export interface ProjectConfig {
  headers?: Record<string, string>;
  method?: 'POST' | 'GET';
  bodyTemplate?: string;
  responseField?: string;
  timeout?: number;
  rateLimit?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  targetUrl?: string;
  targetType: TargetType;
  apiKey?: string;
  config?: ProjectConfig;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testRuns: number;
    findings: number;
    reports: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  targetUrl?: string;
  targetType?: TargetType;
  apiKey?: string;
  config?: ProjectConfig;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  targetUrl?: string | null;
  targetType?: TargetType;
  apiKey?: string | null;
  config?: ProjectConfig | null;
}

// ============================================
// TESTS
// ============================================

export interface TestConfig {
  projectId: string;
  name?: string;
  categories?: PayloadCategory[];
  payloadIds?: string[];
  rateLimit?: number;
  timeout?: number;
  retries?: number;
  stopOnFirstSuccess?: boolean;
  dryRun?: boolean;
}

export interface TestProgress {
  testRunId: string;
  status: TestStatus;
  totalPayloads: number;
  completedPayloads: number;
  successfulAttacks: number;
  currentPayload?: string;
  errors: string[];
}

export interface TestResult {
  id: string;
  testRunId: string;
  payloadId: string;
  payload: {
    id: string;
    name: string;
    category: PayloadCategory;
    severity: Severity;
    content?: string;
  };
  request: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response: {
    body?: string;
    status?: number;
    duration?: number;
    error?: string;
  };
  success: boolean;
  confidence: number | null;
  duration: number | null;
  notes?: string;
  createdAt: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  name?: string;
  status: TestStatus;
  categories: PayloadCategory[];
  totalPayloads: number;
  completedPayloads: number;
  successfulAttacks: number;
  config?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  results?: TestResult[];
  liveProgress?: TestProgress;
}

// ============================================
// FINDINGS
// ============================================

export interface Finding {
  id: string;
  projectId: string;
  testResultId?: string;
  title: string;
  description: string;
  severity: Severity;
  category: PayloadCategory;
  evidence?: {
    payload?: string;
    response?: string;
    confidence?: number;
    indicators?: string[];
  };
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

export interface UpdateFindingInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: FindingStatus;
  remediation?: string;
}

export interface FindingFilters {
  projectId?: string;
  severity?: Severity;
  category?: PayloadCategory;
  status?: FindingStatus;
  page?: number;
  limit?: number;
}

// ============================================
// REPORTS
// ============================================

export interface Report {
  id: string;
  projectId: string;
  title: string;
  type: ReportType;
  content: ReportContent;
  generatedAt: string;
}

export interface ReportContent {
  summary?: {
    projectName: string;
    testDate: string;
    totalTests: number;
    successfulAttacks: number;
    criticalFindings: number;
    highFindings: number;
    overallRisk: string;
  };
  findings?: Array<{
    title: string;
    severity: Severity;
    category: PayloadCategory;
    description: string;
    evidence?: string;
    remediation?: string;
  }>;
  methodology?: string;
  recommendations?: string[];
  appendix?: Record<string, unknown>;
}

export interface GenerateReportInput {
  projectId: string;
  type: ReportType;
  title?: string;
  includeEvidence?: boolean;
  testRunIds?: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// CLIENT CONFIG
// ============================================

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// ============================================
// LOCAL TESTING
// ============================================

export interface LocalTestConfig {
  payloads: Payload[];
  targetFn: (prompt: string) => Promise<string>;
  rateLimit?: number;
  onProgress?: (progress: LocalTestProgress) => void;
  onResult?: (result: LocalTestResult) => void;
}

export interface LocalTestProgress {
  total: number;
  completed: number;
  successful: number;
  currentPayload?: string;
}

export interface LocalTestResult {
  payload: Payload;
  response: string;
  success: boolean;
  confidence: number;
  duration: number;
  indicators: string[];
}

export interface LocalTestSummary {
  total: number;
  successful: number;
  successRate: number;
  avgConfidence: number;
  byCategory: Record<PayloadCategory, { total: number; successful: number }>;
  results: LocalTestResult[];
}
