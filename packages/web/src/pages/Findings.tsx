import { useState } from 'react';
import { Search, Filter, AlertTriangle, Trash2, Eye, ChevronDown, Download } from 'lucide-react';
import { exportFindingsCSV } from '../utils/download';
import {
  useFindings,
  useFinding,
  useUpdateFindingStatus,
  useDeleteFinding,
  useProjects,
} from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { SeverityBadge, StatusBadge, CategoryBadge } from '../components/ui/Badge';
import type { Finding, FindingStatus, Severity, PayloadCategory } from '../types';

const STATUS_OPTIONS: { value: FindingStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'ACCEPTED_RISK', label: 'Accepted Risk' },
  { value: 'FALSE_POSITIVE', label: 'False Positive' },
];

const SEVERITY_OPTIONS: { value: Severity | ''; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'INFO', label: 'Info' },
];

const CATEGORY_OPTIONS: { value: PayloadCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'PROMPT_INJECTION', label: 'Prompt Injection' },
  { value: 'DATA_EXTRACTION', label: 'Data Extraction' },
  { value: 'GUARDRAIL_BYPASS', label: 'Guardrail Bypass' },
  { value: 'INTEGRATION_VULN', label: 'Integration Vuln' },
];

function StatusDropdown({
  currentStatus,
  onStatusChange,
  loading,
}: {
  currentStatus: FindingStatus;
  onStatusChange: (status: FindingStatus) => void;
  loading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 hover:bg-gray-50 rounded px-1"
        disabled={loading}
      >
        <StatusBadge status={currentStatus} />
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-20">
            {STATUS_OPTIONS.filter((s) => s.value !== '').map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(option.value as FindingStatus);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FindingDetail({
  findingId,
  onClose,
}: {
  findingId: string;
  onClose: () => void;
}) {
  const { data: finding, isLoading } = useFinding(findingId);
  const updateStatusMutation = useUpdateFindingStatus();

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (!finding) {
    return <div className="py-8 text-center text-gray-500">Finding not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{finding.title}</h3>
          <p className="text-sm text-gray-500">Project: {finding.project?.name || 'Unknown'}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <StatusDropdown
            currentStatus={finding.status}
            onStatusChange={(status) =>
              updateStatusMutation.mutate({ id: finding.id, status })
            }
            loading={updateStatusMutation.isPending}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <CategoryBadge category={finding.category} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <p className="text-gray-600 whitespace-pre-wrap">{finding.description}</p>
      </div>

      {finding.testResult?.payload && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Related Payload</label>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium">{finding.testResult.payload.name}</p>
          </div>
        </div>
      )}

      {finding.evidence && Object.keys(finding.evidence).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidence</label>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(finding.evidence, null, 2)}
          </pre>
        </div>
      )}

      {finding.remediation && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remediation</label>
          <p className="text-gray-600 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-200">
            {finding.remediation}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
        <span>Created: {new Date(finding.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(finding.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default function Findings() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FindingStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<PayloadCategory | ''>('');
  const [projectFilter, setProjectFilter] = useState('');
  const [viewFindingId, setViewFindingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Finding | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: projects } = useProjects({ limit: 100 });

  const { data, isLoading } = useFindings({
    page,
    limit: 20,
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    category: categoryFilter || undefined,
    projectId: projectFilter || undefined,
    search: search || undefined,
  });

  const updateStatusMutation = useUpdateFindingStatus();
  const deleteMutation = useDeleteFinding();

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportFindingsCSV(projectFilter || undefined);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Finding',
      render: (f: Finding) => (
        <div>
          <p className="font-medium text-gray-900">{f.title}</p>
          <p className="text-sm text-gray-500 truncate max-w-sm">{f.description}</p>
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (f: Finding) => (
        <span className="text-sm text-gray-600">{f.project?.name || 'Unknown'}</span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (f: Finding) => <SeverityBadge severity={f.severity} />,
    },
    {
      key: 'category',
      header: 'Category',
      render: (f: Finding) => <CategoryBadge category={f.category} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (f: Finding) => (
        <StatusDropdown
          currentStatus={f.status}
          onStatusChange={(status) => updateStatusMutation.mutate({ id: f.id, status })}
          loading={updateStatusMutation.isPending}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (f: Finding) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewFindingId(f.id);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(f);
            }}
            className="p-1.5 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  // Calculate summary stats
  const openFindings = data?.data.filter((f) => f.status === 'OPEN').length || 0;
  const criticalFindings = data?.data.filter((f) => f.severity === 'CRITICAL').length || 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Findings</h1>
          <p className="text-gray-500 mt-1">Track and manage security vulnerabilities</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="font-medium text-red-700">{openFindings} Open</span>
          </div>
          {criticalFindings > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 rounded-lg">
              <span className="font-bold text-red-800">{criticalFindings} Critical</span>
            </div>
          )}
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
            loading={isExporting}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search findings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FindingStatus | '');
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as Severity | '');
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as PayloadCategory | '');
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(f) => f.id}
          onRowClick={(f) => setViewFindingId(f.id)}
          loading={isLoading}
          emptyMessage="No findings found. Run tests to discover vulnerabilities."
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

      {/* View Modal */}
      <Modal
        isOpen={!!viewFindingId}
        onClose={() => setViewFindingId(null)}
        title="Finding Details"
        size="lg"
      >
        {viewFindingId && (
          <FindingDetail findingId={viewFindingId} onClose={() => setViewFindingId(null)} />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Finding"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete the finding <strong>{deleteConfirm?.title}</strong>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
