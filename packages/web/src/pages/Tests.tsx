import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Play,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronRight,
  Download,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { exportTestResultsCSV } from '../utils/download';
import {
  useTests,
  useTest,
  useTestResults,
  useProjects,
  useStartTest,
  useCancelTest,
} from '../hooks/useApi';
import { useTestStream, type TestProgress } from '../hooks/useTestStream';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { TestStatusBadge, SeverityBadge } from '../components/ui/Badge';
import type { TestRun, TestStatus, PayloadCategory } from '../types';

const STATUS_OPTIONS: { value: TestStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const CATEGORY_OPTIONS: { value: PayloadCategory; label: string }[] = [
  { value: 'PROMPT_INJECTION', label: 'Prompt Injection' },
  { value: 'DATA_EXTRACTION', label: 'Data Extraction' },
  { value: 'GUARDRAIL_BYPASS', label: 'Guardrail Bypass' },
  { value: 'INTEGRATION_VULN', label: 'Integration Vuln' },
];

function StartTestModal({
  isOpen,
  onClose,
  preselectedProjectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjectId?: string;
}) {
  const [projectId, setProjectId] = useState(preselectedProjectId || '');
  const [selectedCategories, setSelectedCategories] = useState<PayloadCategory[]>([]);
  const [parallel, setParallel] = useState(false);
  const [rateLimit, setRateLimit] = useState(10);

  const { data: projects } = useProjects({ limit: 100 });
  const startMutation = useStartTest();
  const navigate = useNavigate();

  useEffect(() => {
    if (preselectedProjectId) {
      setProjectId(preselectedProjectId);
    }
  }, [preselectedProjectId]);

  const handleStart = async () => {
    if (!projectId) return;

    const result = await startMutation.mutateAsync({
      projectId,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      config: {
        parallel,
        rateLimit,
      },
    });

    onClose();
    navigate(`/tests/${result.id}`);
  };

  const toggleCategory = (cat: PayloadCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Test" size="lg">
      <div className="space-y-4">
        <Select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={[
            { value: '', label: 'Select a project...' },
            ...(projects?.data.map((p) => ({ value: p.id, label: p.name })) || []),
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payload Categories (leave empty for all)
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={parallel}
                onChange={(e) => setParallel(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Run in parallel</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">Execute multiple payloads simultaneously</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Limit (req/min)
            </label>
            <input
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(parseInt(e.target.value) || 10)}
              min={1}
              max={100}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            loading={startMutation.isPending}
            disabled={!projectId}
            icon={<Play className="w-4 h-4" />}
          >
            Start Test
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Progress bar component for test execution
 */
function TestProgressBar({
  completed,
  total,
  label,
}: {
  completed: number;
  total: number;
  label?: string;
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {completed} / {total} payloads
      </div>
    </div>
  );
}

function TestDetailModal({
  testId,
  onClose,
}: {
  testId: string;
  onClose: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();
  const { data: test, isLoading: testLoading, refetch: refetchTest } = useTest(testId);
  const { data: results, isLoading: resultsLoading, refetch: refetchResults } = useTestResults(testId);
  const cancelMutation = useCancelTest();

  // Determine if we should enable SSE streaming
  const isRunning = test?.status === 'RUNNING' || test?.status === 'PENDING';

  // Handle SSE completion - refetch data when test completes
  const handleStreamComplete = useCallback((_progress: TestProgress) => {
    // Refetch test data and results when stream indicates completion
    refetchTest();
    refetchResults();
    // Invalidate the tests list to update the table
    queryClient.invalidateQueries({ queryKey: ['tests'] });
  }, [refetchTest, refetchResults, queryClient]);

  // Use SSE stream for real-time updates when test is running
  const {
    progress: streamProgress,
    isConnected,
    error: streamError,
    reconnect,
  } = useTestStream(testId, {
    enabled: isRunning,
    onComplete: handleStreamComplete,
  });

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(testId);
  };

  const handleExportResults = async () => {
    setIsExporting(true);
    try {
      await exportTestResultsCSV(testId);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (testLoading) {
    return <div className="py-8 text-center">Loading test details...</div>;
  }

  if (!test) {
    return <div className="py-8 text-center text-gray-500">Test not found</div>;
  }

  // Use live progress from SSE if available, otherwise fall back to test data
  const completedPayloads = streamProgress?.completedPayloads ?? test.completedPayloads ?? 0;
  const totalPayloads = streamProgress?.totalPayloads ?? test.totalPayloads ?? 0;
  const successfulAttacks = streamProgress?.successfulAttacks ?? test.successfulAttacks ?? 0;
  const currentPayload = streamProgress?.currentPayload;
  const displayStatus = streamProgress?.status ?? test.status;

  const successCount = results?.filter((r) => r.success).length || successfulAttacks;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">{test.project?.name || 'Unknown Project'}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Started: {test.startedAt ? new Date(test.startedAt).toLocaleString() : 'Pending'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* SSE Connection Status */}
          {isRunning && (
            <div className="flex items-center gap-1 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Live</span>
                </>
              ) : streamError ? (
                <button
                  onClick={reconnect}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  title={streamError}
                >
                  <WifiOff className="w-3 h-3" />
                  <span>Reconnect</span>
                </button>
              ) : (
                <>
                  <Radio className="w-3 h-3 text-gray-400 animate-pulse" />
                  <span className="text-gray-500 dark:text-gray-400">Connecting...</span>
                </>
              )}
            </div>
          )}
          <TestStatusBadge status={displayStatus} />
          {displayStatus === 'RUNNING' && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
              icon={<Square className="w-3 h-3" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Live Progress Bar - shown when test is running */}
      {(displayStatus === 'RUNNING' || displayStatus === 'PENDING') && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Test in Progress</span>
          </div>
          <TestProgressBar
            completed={completedPayloads}
            total={totalPayloads}
            label="Progress"
          />
          {currentPayload && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Currently testing: <span className="font-medium">{currentPayload}</span>
            </p>
          )}
          {successfulAttacks > 0 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {successfulAttacks} successful attack{successfulAttacks !== 1 ? 's' : ''} detected
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPayloads}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Payloads</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Successful Attacks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{completedPayloads}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Test Results</h4>
          {isRunning && (
            <button
              onClick={() => refetchResults()}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          )}
        </div>
        {resultsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded dark:bg-gray-700" />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="max-h-64 overflow-y-auto divide-y border rounded-lg dark:divide-gray-700 dark:border-gray-700">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm dark:text-gray-200">{result.payload?.name || 'Unknown Payload'}</p>
                    {result.confidence !== undefined && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.duration && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{result.duration}ms</span>
                  )}
                  {result.payload && <SeverityBadge severity={result.payload.severity} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 dark:text-gray-400">
            {isRunning ? 'Results will appear as payloads are tested...' : 'No results yet'}
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="secondary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportResults}
          loading={isExporting}
          disabled={!results || results.length === 0}
        >
          Export Results
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default function Tests() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TestStatus | ''>('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const preselectedProjectId = searchParams.get('projectId') || undefined;

  const { data, isLoading, refetch } = useTests({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  // Open start modal if projectId is in URL
  useEffect(() => {
    if (preselectedProjectId && searchParams.get('new') === 'true') {
      setShowStartModal(true);
    }
  }, [preselectedProjectId, searchParams]);

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'RUNNING':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELLED':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const columns = [
    {
      key: 'project',
      header: 'Project',
      render: (t: TestRun) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(t.status)}
          <span className="font-medium">{t.project?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: TestRun) => <TestStatusBadge status={t.status} />,
    },
    {
      key: 'results',
      header: 'Results',
      render: (t: TestRun) => (
        <span className="text-sm text-gray-600">{t._count?.results || 0} payloads tested</span>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (t: TestRun) => (
        <span className="text-sm text-gray-500">
          {t.startedAt ? new Date(t.startedAt).toLocaleString() : 'Pending'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (t: TestRun) => {
        if (!t.startedAt) return <span className="text-gray-400">-</span>;
        const end = t.completedAt ? new Date(t.completedAt) : new Date();
        const start = new Date(t.startedAt);
        const durationMs = end.getTime() - start.getTime();
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        return (
          <span className="text-sm text-gray-500">
            {minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (t: TestRun) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTestId(t.id);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Runner</h1>
          <p className="text-gray-500 mt-1">Execute and monitor security tests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button icon={<Play className="w-4 h-4" />} onClick={() => setShowStartModal(true)}>
            Start Test
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TestStatus | '');
                setPage(1);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(t) => t.id}
          onRowClick={(t) => setSelectedTestId(t.id)}
          loading={isLoading}
          emptyMessage="No tests found. Start your first test to begin security testing."
        />
        {data && data.pagination.totalPages > 1 && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            limit={data.pagination.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Start Test Modal */}
      <StartTestModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        preselectedProjectId={preselectedProjectId}
      />

      {/* Test Detail Modal */}
      <Modal
        isOpen={!!selectedTestId}
        onClose={() => setSelectedTestId(null)}
        title="Test Details"
        size="lg"
      >
        {selectedTestId && (
          <TestDetailModal testId={selectedTestId} onClose={() => setSelectedTestId(null)} />
        )}
      </Modal>
    </div>
  );
}
