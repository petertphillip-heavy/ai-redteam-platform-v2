import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Filter, Calendar, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAnalytics, useProjects } from '../hooks/useApi';
import { Card, CardHeader } from '../components/ui/Card';
import type { PayloadCategory } from '../types';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
  neutral: '#6B7280',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#3B82F6',
  INFO: '#6B7280',
};

const CATEGORY_COLORS: Record<PayloadCategory, string> = {
  PROMPT_INJECTION: '#EF4444',
  DATA_EXTRACTION: '#F59E0B',
  GUARDRAIL_BYPASS: '#3B82F6',
  INTEGRATION_VULN: '#6B7280',
};

const CATEGORY_LABELS: Record<PayloadCategory, string> = {
  PROMPT_INJECTION: 'Prompt Injection',
  DATA_EXTRACTION: 'Data Extraction',
  GUARDRAIL_BYPASS: 'Guardrail Bypass',
  INTEGRATION_VULN: 'Integration Vuln',
};

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function Analytics() {
  const [projectId, setProjectId] = useState('');
  const [dateRange, setDateRange] = useState('30d');

  const { data: projects } = useProjects({ limit: 100 });

  // Calculate date range
  const endDate = new Date();
  let startDate = new Date();
  switch (dateRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'all':
      startDate = new Date(0);
      break;
  }

  const { data: analytics, isLoading } = useAnalytics({
    projectId: projectId || undefined,
    startDate: dateRange !== 'all' ? startDate.toISOString() : undefined,
    endDate: endDate.toISOString(),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // Format trend data for line chart
  const trendData = analytics?.testTrends.map((t) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: t.total,
    successful: t.successful,
    failed: t.failed,
  })) || [];

  // Format category data
  const categoryData = analytics?.categoryEffectiveness.map((c) => ({
    name: CATEGORY_LABELS[c.category as PayloadCategory] || c.category,
    total: c.total,
    successful: c.successful,
    successRate: Math.round(c.successRate * 100),
    fill: CATEGORY_COLORS[c.category as PayloadCategory] || COLORS.neutral,
  })) || [];

  // Format severity data for pie chart
  const severityData = analytics?.severityDistribution
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: s.severity,
      value: s.count,
      fill: SEVERITY_COLORS[s.severity] || COLORS.neutral,
    })) || [];

  // Top payloads
  const topPayloads = analytics?.payloadEffectiveness.slice(0, 10) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Security testing insights and trends</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Tests"
          value={analytics?.summary.totalTests || 0}
          icon={Target}
          iconColor="bg-blue-500"
        />
        <StatCard
          title="Total Findings"
          value={analytics?.summary.totalFindings || 0}
          icon={AlertTriangle}
          iconColor="bg-red-500"
        />
        <StatCard
          title="Avg Success Rate"
          value={`${Math.round((analytics?.summary.avgSuccessRate || 0) * 100)}%`}
          icon={CheckCircle}
          iconColor="bg-green-500"
          subtitle="Attack success rate"
        />
        <StatCard
          title="Most Vulnerable"
          value={CATEGORY_LABELS[analytics?.summary.mostVulnerableCategory as PayloadCategory] || 'N/A'}
          icon={TrendingUp}
          iconColor="bg-orange-500"
          subtitle="Category with most findings"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test Trends */}
        <Card>
          <CardHeader title="Test Trends" description="Tests over time" />
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={false}
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.danger}
                  strokeWidth={2}
                  dot={false}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </Card>

        {/* Findings by Severity */}
        <Card>
          <CardHeader title="Findings by Severity" description="Distribution of discovered vulnerabilities" />
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No findings data available
            </div>
          )}
        </Card>

        {/* Category Effectiveness */}
        <Card>
          <CardHeader title="Category Effectiveness" description="Success rate by attack category" />
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'successRate' ? `${value}%` : value,
                    name === 'successRate' ? 'Success Rate' : name,
                  ]}
                />
                <Bar dataKey="successRate" name="Success Rate %" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No category data available
            </div>
          )}
        </Card>

        {/* Project Comparison */}
        {!projectId && analytics?.projectComparison && analytics.projectComparison.length > 0 && (
          <Card>
            <CardHeader title="Project Comparison" description="Findings across projects" />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.projectComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="projectName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="findings" fill={COLORS.warning} name="Total Findings" radius={[4, 4, 0, 0]} />
                <Bar dataKey="criticalFindings" fill={COLORS.danger} name="Critical" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Top Effective Payloads */}
      <Card>
        <CardHeader
          title="Most Effective Payloads"
          description="Payloads with highest success rates"
        />
        {topPayloads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payload
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Times Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Successful
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPayloads.map((payload, index) => (
                  <tr key={payload.payloadId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{payload.payloadName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payload.timesUsed}</td>
                    <td className="px-4 py-3 text-sm text-green-600">{payload.successCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="h-2 rounded-full bg-green-500 transition-all"
                            style={{ width: `${Math.round(payload.successRate * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(payload.successRate * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No payload data available. Run tests to see payload effectiveness.
          </div>
        )}
      </Card>
    </div>
  );
}
