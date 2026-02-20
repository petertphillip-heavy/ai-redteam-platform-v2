import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Payload,
  CreatePayloadInput,
  UpdatePayloadInput,
  Project,
  CreateProjectInput,
  TestRun,
  StartTestInput,
  TestResult,
  Finding,
  CreateFindingInput,
  Report,
  GenerateReportInput,
  PaginatedResult,
  ApiResponse,
  DashboardStats,
  AnalyticsData,
  PayloadCategory,
  Severity,
  FindingStatus,
  TestStatus,
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error?: { message?: string }; message?: string }>) => {
        // Handle 401 unauthorized - clear token and redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          // Don't redirect if already on auth pages
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
        const errorData = error.response?.data;
        const message = (errorData?.error as { message?: string })?.message || errorData?.message || error.message;
        return Promise.reject(new Error(message));
      }
    );
  }

  // ============ Auth ============
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/login', input);
    localStorage.setItem(TOKEN_KEY, data.data.token);
    return data.data;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await this.client.post<ApiResponse<AuthResponse>>('/api/auth/register', input);
    localStorage.setItem(TOKEN_KEY, data.data.token);
    return data.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<ApiResponse<User>>('/api/auth/me');
    return data.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/api/auth/change-password', { currentPassword, newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Health check
  async health(): Promise<{ status: string; version: string }> {
    const { data } = await this.client.get<ApiResponse<{ status: string; version: string }>>('/health');
    return data.data;
  }

  // ============ Payloads ============
  async getPayloads(params?: {
    page?: number;
    limit?: number;
    category?: PayloadCategory;
    severity?: Severity;
    search?: string;
    tags?: string[];
    isActive?: boolean;
  }): Promise<PaginatedResult<Payload>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<Payload>>>('/api/payloads', { params });
    return data.data;
  }

  async getPayload(id: string): Promise<Payload> {
    const { data } = await this.client.get<ApiResponse<Payload>>(`/api/payloads/${id}`);
    return data.data;
  }

  async createPayload(input: CreatePayloadInput): Promise<Payload> {
    const { data } = await this.client.post<ApiResponse<Payload>>('/api/payloads', input);
    return data.data;
  }

  async updatePayload(id: string, input: UpdatePayloadInput): Promise<Payload> {
    const { data } = await this.client.put<ApiResponse<Payload>>(`/api/payloads/${id}`, input);
    return data.data;
  }

  async deletePayload(id: string): Promise<void> {
    await this.client.delete(`/api/payloads/${id}`);
  }

  async getPayloadCategories(): Promise<{
    categories: { name: PayloadCategory; count: number }[];
    subcategories: { category: PayloadCategory; subcategory: string; count: number }[];
  }> {
    const { data } = await this.client.get<ApiResponse<{
      categories: { name: PayloadCategory; count: number }[];
      subcategories: { category: PayloadCategory; subcategory: string; count: number }[];
    }>>('/api/payloads/categories');
    return data.data;
  }

  async importPayloads(payloads: CreatePayloadInput[]): Promise<{ created: number }> {
    const { data } = await this.client.post<ApiResponse<{ created: number }>>('/api/payloads/import', { payloads });
    return data.data;
  }

  async togglePayloadActive(id: string): Promise<Payload> {
    const { data } = await this.client.patch<ApiResponse<Payload>>(`/api/payloads/${id}/toggle`);
    return data.data;
  }

  // ============ Projects ============
  async getProjects(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<Project>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<Project>>>('/api/projects', { params });
    return data.data;
  }

  async getProject(id: string): Promise<Project> {
    const { data } = await this.client.get<ApiResponse<Project>>(`/api/projects/${id}`);
    return data.data;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { data } = await this.client.post<ApiResponse<Project>>('/api/projects', input);
    return data.data;
  }

  async updateProject(id: string, input: Partial<CreateProjectInput>): Promise<Project> {
    const { data } = await this.client.put<ApiResponse<Project>>(`/api/projects/${id}`, input);
    return data.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/api/projects/${id}`);
  }

  // ============ Tests ============
  async getTests(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: TestStatus;
  }): Promise<PaginatedResult<TestRun>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<TestRun>>>('/api/tests', { params });
    return data.data;
  }

  async getTest(id: string): Promise<TestRun> {
    const { data } = await this.client.get<ApiResponse<TestRun>>(`/api/tests/${id}`);
    return data.data;
  }

  async getTestResults(testId: string): Promise<TestResult[]> {
    const { data } = await this.client.get<ApiResponse<TestResult[]>>(`/api/tests/${testId}/results`);
    return data.data;
  }

  async startTest(input: StartTestInput): Promise<TestRun> {
    const { data } = await this.client.post<ApiResponse<TestRun>>(`/api/projects/${input.projectId}/tests`, input);
    return data.data;
  }

  async cancelTest(id: string): Promise<TestRun> {
    const { data } = await this.client.post<ApiResponse<TestRun>>(`/api/tests/${id}/cancel`);
    return data.data;
  }

  async getProjectTests(projectId: string): Promise<TestRun[]> {
    const { data } = await this.client.get<ApiResponse<TestRun[]>>(`/api/projects/${projectId}/tests`);
    return data.data;
  }

  // ============ Findings ============
  async getFindings(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    severity?: Severity;
    category?: PayloadCategory;
    status?: FindingStatus;
    search?: string;
  }): Promise<PaginatedResult<Finding>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<Finding>>>('/api/findings', { params });
    return data.data;
  }

  async getFinding(id: string): Promise<Finding> {
    const { data } = await this.client.get<ApiResponse<Finding>>(`/api/findings/${id}`);
    return data.data;
  }

  async createFinding(input: CreateFindingInput): Promise<Finding> {
    const { data } = await this.client.post<ApiResponse<Finding>>('/api/findings', input);
    return data.data;
  }

  async updateFinding(id: string, input: Partial<CreateFindingInput & { status: FindingStatus }>): Promise<Finding> {
    const { data } = await this.client.put<ApiResponse<Finding>>(`/api/findings/${id}`, input);
    return data.data;
  }

  async updateFindingStatus(id: string, status: FindingStatus): Promise<Finding> {
    const { data } = await this.client.patch<ApiResponse<Finding>>(`/api/findings/${id}/status`, { status });
    return data.data;
  }

  async deleteFinding(id: string): Promise<void> {
    await this.client.delete(`/api/findings/${id}`);
  }

  async getProjectFindings(projectId: string): Promise<Finding[]> {
    const { data } = await this.client.get<ApiResponse<Finding[]>>(`/api/projects/${projectId}/findings`);
    return data.data;
  }

  // ============ Reports ============
  async getReports(params?: { page?: number; limit?: number; projectId?: string }): Promise<PaginatedResult<Report>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<Report>>>('/api/reports', { params });
    return data.data;
  }

  async getReport(id: string): Promise<Report> {
    const { data } = await this.client.get<ApiResponse<Report>>(`/api/reports/${id}`);
    return data.data;
  }

  async generateReport(input: GenerateReportInput): Promise<Report> {
    const { data } = await this.client.post<ApiResponse<Report>>(`/api/projects/${input.projectId}/reports`, input);
    return data.data;
  }

  async downloadReport(id: string, format: 'html' | 'pdf' = 'html'): Promise<Blob> {
    const response = await this.client.get(`/api/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteReport(id: string): Promise<void> {
    await this.client.delete(`/api/reports/${id}`);
  }

  async getProjectReports(projectId: string): Promise<Report[]> {
    const { data } = await this.client.get<ApiResponse<Report[]>>(`/api/projects/${projectId}/reports`);
    return data.data;
  }

  // ============ Dashboard Stats ============
  async getDashboardStats(): Promise<DashboardStats> {
    const [payloadStats, projectsResult, testsResult, findingsStats] = await Promise.all([
      this.client.get<ApiResponse<{ total: number; byCategory: Record<string, number>; bySeverity: Record<string, number> }>>('/api/payloads/stats'),
      this.client.get<ApiResponse<PaginatedResult<Project>>>('/api/projects', { params: { limit: 1 } }),
      this.client.get<ApiResponse<PaginatedResult<TestRun>>>('/api/tests', { params: { limit: 5 } }),
      this.client.get<ApiResponse<{ total: number; bySeverity: Record<string, number>; byStatus: Record<string, number>; byCategory: Record<string, number> }>>('/api/findings/stats'),
    ]);

    return {
      payloads: payloadStats.data.data as DashboardStats['payloads'],
      projects: { total: projectsResult.data.data.pagination.total },
      tests: {
        total: testsResult.data.data.pagination.total,
        byStatus: {} as Record<TestStatus, number>,
        recentRuns: testsResult.data.data.data,
      },
      findings: findingsStats.data.data as DashboardStats['findings'],
    };
  }

  // ============ Analytics ============
  async getAnalytics(params?: { projectId?: string; startDate?: string; endDate?: string }): Promise<AnalyticsData> {
    const { data } = await this.client.get<ApiResponse<AnalyticsData>>('/api/analytics', { params });
    return data.data;
  }

  // ============ Users (Admin) ============
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: 'ADMIN' | 'USER' | 'VIEWER';
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResult<User>> {
    const { data } = await this.client.get<ApiResponse<PaginatedResult<User>>>('/api/users', { params });
    return data.data;
  }

  async getUser(id: string): Promise<User> {
    const { data } = await this.client.get<ApiResponse<User>>(`/api/users/${id}`);
    return data.data;
  }

  async updateUser(id: string, input: { name?: string; email?: string; isActive?: boolean }): Promise<User> {
    const { data } = await this.client.put<ApiResponse<User>>(`/api/users/${id}`, input);
    return data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/api/users/${id}`);
  }

  async changeUserRole(id: string, role: 'ADMIN' | 'USER' | 'VIEWER'): Promise<User> {
    const { data } = await this.client.patch<ApiResponse<User>>(`/api/users/${id}/role`, { role });
    return data.data;
  }

  async toggleUserStatus(id: string): Promise<User> {
    const { data } = await this.client.patch<ApiResponse<User>>(`/api/users/${id}/status`);
    return data.data;
  }
}

export const api = new ApiService();
