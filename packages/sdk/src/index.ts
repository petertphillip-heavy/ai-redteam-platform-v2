// Main client exports
export { RedTeamClient, LocalTester } from './client.js';

// Type exports
export type {
  // Enums
  PayloadCategory,
  Severity,
  TestStatus,
  FindingStatus,
  TargetType,
  ReportType,

  // Payloads
  Payload,
  PayloadFilters,

  // Projects
  Project,
  ProjectConfig,
  CreateProjectInput,
  UpdateProjectInput,

  // Tests
  TestConfig,
  TestProgress,
  TestResult,
  TestRun,

  // Findings
  Finding,
  CreateFindingInput,
  UpdateFindingInput,
  FindingFilters,

  // Reports
  Report,
  ReportContent,
  GenerateReportInput,

  // API
  ApiResponse,
  PaginatedResponse,
  ClientConfig,

  // Local Testing
  LocalTestConfig,
  LocalTestProgress,
  LocalTestResult,
  LocalTestSummary,
} from './types.js';
