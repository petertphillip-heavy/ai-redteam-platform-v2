import { Link } from 'react-router-dom';
import {
  Database,
  Play,
  AlertTriangle,
  FileText,
  FolderOpen,
  TrendingUp,
  Shield,
  Clock,
} from 'lucide-react';
import { useDashboardStats, useTests } from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { SeverityBadge, TestStatusBadge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { SkeletonStats } from '../components/ui/SkeletonStats';
import type { TestRun } from '../types';

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  link,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  link: string;
  loading?: boolean;
}) {
  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <Link to={link}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      </Card>
    </Link>
  );
}

function RecentTestsTableSkeleton() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-slate-700">
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton height={20} width="40%" className="mb-2" />
              <Skeleton height={14} width="30%" className="mb-3" />
              <div className="flex items-center gap-4">
                <Skeleton height={12} width={100} rounded="sm" />
                <Skeleton height={12} width={80} rounded="sm" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton height={22} width={80} rounded="full" />
              <Skeleton height={12} width={50} rounded="sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentTestsTable({ tests, loading }: { tests: TestRun[]; loading: boolean }) {
  if (loading) {
    return <RecentTestsTableSkeleton />;
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No tests run yet</p>
        <Link to="/tests" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
          Start your first test
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-slate-700">
      {tests.map((test) => (
        <Link
          key={test.id}
          to={`/tests/${test.id}`}
          className="block py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 -mx-4 px-4 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {test.name || 'Unnamed Test'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Project: {test.project?.name || 'Unknown Project'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(test.createdAt).toLocaleString()}
                </span>
                <span>
                  {test.completedPayloads}/{test.totalPayloads} payloads
                </span>
                {test.successfulAttacks > 0 && (
                  <span className="text-red-500 dark:text-red-400 font-medium">
                    {test.successfulAttacks} successful attacks
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <TestStatusBadge status={test.status} />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {test._count?.results || 0} results
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FindingsSummarySkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton width={80} height={22} rounded="full" />
          <div className="flex-1">
            <Skeleton height={8} width="100%" rounded="full" />
          </div>
          <Skeleton width={32} height={16} rounded="sm" />
        </div>
      ))}
    </div>
  );
}

function FindingsSummary({
  findings,
  loading,
}: {
  findings?: { total: number; bySeverity: Record<string, number> };
  loading: boolean;
}) {
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;

  if (loading) {
    return <FindingsSummarySkeleton />;
  }

  return (
    <div className="space-y-2">
      {severities.map((severity) => {
        const count = findings?.bySeverity?.[severity] || 0;
        const total = findings?.total || 1;
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
          <div key={severity} className="flex items-center gap-3">
            <div className="w-20">
              <SeverityBadge severity={severity} />
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  severity === 'CRITICAL' || severity === 'HIGH'
                    ? 'bg-red-500'
                    : severity === 'MEDIUM'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium w-8 text-right text-gray-700 dark:text-gray-300">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: testsData, isLoading: testsLoading } = useTests({ limit: 5 });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">AI Security Red Team Platform Overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Payloads"
          value={stats?.payloads?.total ?? 0}
          icon={Database}
          iconColor="text-blue-500"
          link="/payloads"
          loading={statsLoading}
        />
        <StatCard
          title="Projects"
          value={stats?.projects?.total ?? 0}
          icon={FolderOpen}
          iconColor="text-purple-500"
          link="/projects"
          loading={statsLoading}
        />
        <StatCard
          title="Tests Run"
          value={stats?.tests?.total ?? 0}
          icon={Play}
          iconColor="text-green-500"
          link="/tests"
          loading={statsLoading}
        />
        <StatCard
          title="Findings"
          value={stats?.findings?.total ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-500"
          link="/findings"
          loading={statsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tests */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tests</h2>
            </div>
            <Link to="/tests" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <RecentTestsTable tests={testsData?.data ?? []} loading={testsLoading} />
        </Card>

        {/* Findings Summary */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Findings by Severity</h2>
            </div>
            <Link to="/findings" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              View all
            </Link>
          </div>
          <FindingsSummary findings={stats?.findings} loading={statsLoading} />
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <Link
              to="/tests/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Play className="w-5 h-5 text-green-500" />
              <span>Start New Test</span>
            </Link>
            <Link
              to="/payloads/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Database className="w-5 h-5 text-blue-500" />
              <span>Add Payload</span>
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-700 dark:text-gray-300"
            >
              <FileText className="w-5 h-5 text-orange-500" />
              <span>Generate Report</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-gray-700 dark:text-gray-300"
            >
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>View Analytics</span>
            </Link>
          </div>
        </Card>

        {/* Payload Categories */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payloads by Category</h2>
          </div>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                  <Skeleton height={32} width={48} className="mb-2" />
                  <Skeleton height={16} width="70%" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats?.payloads?.byCategory ?? {}).map(([category, count]) => {
                const labels: Record<string, string> = {
                  PROMPT_INJECTION: 'Prompt Injection',
                  DATA_EXTRACTION: 'Data Extraction',
                  GUARDRAIL_BYPASS: 'Guardrail Bypass',
                  INTEGRATION_VULN: 'Integration Vuln',
                };
                const colors: Record<string, string> = {
                  PROMPT_INJECTION: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
                  DATA_EXTRACTION: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300',
                  GUARDRAIL_BYPASS: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
                  INTEGRATION_VULN: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300',
                };
                return (
                  <Link
                    key={category}
                    to={`/payloads?category=${category}`}
                    className={`p-4 rounded-lg border ${colors[category] || 'bg-gray-50 dark:bg-slate-700'} hover:shadow transition-shadow`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm font-medium">{labels[category] || category}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
