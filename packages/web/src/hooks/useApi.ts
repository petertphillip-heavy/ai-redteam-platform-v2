import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  CreatePayloadInput,
  UpdatePayloadInput,
  CreateProjectInput,
  StartTestInput,
  CreateFindingInput,
  GenerateReportInput,
  PayloadCategory,
  Severity,
  FindingStatus,
  TestStatus,
  UserRole,
  UpdateUserInput,
} from '../types';

// Query keys
export const queryKeys = {
  health: ['health'],
  payloads: (params?: Record<string, unknown>) => ['payloads', params],
  payload: (id: string) => ['payload', id],
  payloadCategories: ['payloadCategories'],
  projects: (params?: Record<string, unknown>) => ['projects', params],
  project: (id: string) => ['project', id],
  tests: (params?: Record<string, unknown>) => ['tests', params],
  test: (id: string) => ['test', id],
  testResults: (id: string) => ['testResults', id],
  projectTests: (projectId: string) => ['projectTests', projectId],
  findings: (params?: Record<string, unknown>) => ['findings', params],
  finding: (id: string) => ['finding', id],
  projectFindings: (projectId: string) => ['projectFindings', projectId],
  reports: (params?: Record<string, unknown>) => ['reports', params],
  report: (id: string) => ['report', id],
  projectReports: (projectId: string) => ['projectReports', projectId],
  dashboardStats: ['dashboardStats'],
  analytics: (params?: Record<string, unknown>) => ['analytics', params],
  users: (params?: Record<string, unknown>) => ['users', params],
  user: (id: string) => ['user', id],
};

// ============ Health ============
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.health(),
    staleTime: 30000,
  });
}

// ============ Payloads ============
export function usePayloads(params?: {
  page?: number;
  limit?: number;
  category?: PayloadCategory;
  severity?: Severity;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.payloads(params),
    queryFn: () => api.getPayloads(params),
  });
}

export function usePayload(id: string) {
  return useQuery({
    queryKey: queryKeys.payload(id),
    queryFn: () => api.getPayload(id),
    enabled: !!id,
  });
}

export function usePayloadCategories() {
  return useQuery({
    queryKey: queryKeys.payloadCategories,
    queryFn: () => api.getPayloadCategories(),
  });
}

export function useCreatePayload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePayloadInput) => api.createPayload(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useUpdatePayload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePayloadInput }) => api.updatePayload(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.payload(id) });
    },
  });
}

export function useDeletePayload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePayload(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useTogglePayloadActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.togglePayloadActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.payload(id) });
    },
  });
}

export function useImportPayloads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payloads: CreatePayloadInput[]) => api.importPayloads(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payloads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

// ============ Projects ============
export function useProjects(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => api.getProjects(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => api.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateProjectInput> }) => api.updateProject(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

// ============ Tests ============
export function useTests(params?: { page?: number; limit?: number; projectId?: string; status?: TestStatus }) {
  return useQuery({
    queryKey: queryKeys.tests(params),
    queryFn: () => api.getTests(params),
  });
}

export function useTest(id: string) {
  return useQuery({
    queryKey: queryKeys.test(id),
    queryFn: () => api.getTest(id),
    enabled: !!id,
  });
}

export function useTestResults(testId: string) {
  return useQuery({
    queryKey: queryKeys.testResults(testId),
    queryFn: () => api.getTestResults(testId),
    enabled: !!testId,
  });
}

export function useProjectTests(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectTests(projectId),
    queryFn: () => api.getProjectTests(projectId),
    enabled: !!projectId,
  });
}

export function useStartTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartTestInput) => api.startTest(input),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTests(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useCancelTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelTest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.test(id) });
    },
  });
}

// ============ Findings ============
export function useFindings(params?: {
  page?: number;
  limit?: number;
  projectId?: string;
  severity?: Severity;
  category?: PayloadCategory;
  status?: FindingStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.findings(params),
    queryFn: () => api.getFindings(params),
  });
}

export function useFinding(id: string) {
  return useQuery({
    queryKey: queryKeys.finding(id),
    queryFn: () => api.getFinding(id),
    enabled: !!id,
  });
}

export function useProjectFindings(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectFindings(projectId),
    queryFn: () => api.getProjectFindings(projectId),
    enabled: !!projectId,
  });
}

export function useCreateFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFindingInput) => api.createFinding(input),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectFindings(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useUpdateFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateFindingInput & { status: FindingStatus }> }) =>
      api.updateFinding(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finding(id) });
    },
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FindingStatus }) => api.updateFindingStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finding(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

export function useDeleteFinding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFinding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}

// ============ Reports ============
export function useReports(params?: { page?: number; limit?: number; projectId?: string }) {
  return useQuery({
    queryKey: queryKeys.reports(params),
    queryFn: () => api.getReports(params),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: queryKeys.report(id),
    queryFn: () => api.getReport(id),
    enabled: !!id,
  });
}

export function useProjectReports(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projectReports(projectId),
    queryFn: () => api.getProjectReports(projectId),
    enabled: !!projectId,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateReportInput) => api.generateReport(input),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectReports(projectId) });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format: 'html' | 'pdf' }) => {
      const blob = await api.downloadReport(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// ============ Dashboard ============
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => api.getDashboardStats(),
    staleTime: 30000,
  });
}

// ============ Analytics ============
export function useAnalytics(params?: { projectId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.analytics(params),
    queryFn: () => api.getAnalytics(params),
    staleTime: 60000,
  });
}

// ============ Users (Admin) ============
export function useUsers(params?: {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => api.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => api.updateUser(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.changeUserRole(id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleUserStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
    },
  });
}
