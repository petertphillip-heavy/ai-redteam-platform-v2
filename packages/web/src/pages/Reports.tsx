import { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Eye,
  FileCode,
  Clock,
  FolderOpen,
} from 'lucide-react';
import {
  useReports,
  useReport,
  useGenerateReport,
  useDownloadReport,
  useDeleteReport,
  useProjects,
} from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import type { Report, ReportType } from '../types';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'EXECUTIVE_SUMMARY',
    label: 'Executive Summary',
    description: '1-2 page high-level overview for stakeholders',
  },
  {
    value: 'TECHNICAL_DETAIL',
    label: 'Technical Findings',
    description: 'Detailed per-vulnerability technical report',
  },
  {
    value: 'FULL_REPORT',
    label: 'Full Report',
    description: 'Complete pentest report with all details',
  },
];

function ReportTypeBadge({ type }: { type: ReportType }) {
  const labels: Record<ReportType, string> = {
    EXECUTIVE_SUMMARY: 'Executive',
    TECHNICAL_DETAIL: 'Technical',
    FULL_REPORT: 'Full Report',
  };
  const variants: Record<ReportType, 'info' | 'warning' | 'success'> = {
    EXECUTIVE_SUMMARY: 'info',
    TECHNICAL_DETAIL: 'warning',
    FULL_REPORT: 'success',
  };
  return <Badge variant={variants[type]}>{labels[type]}</Badge>;
}

function GenerateReportModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('FULL_REPORT');
  const [title, setTitle] = useState('');
  const [includeRemediation, setIncludeRemediation] = useState(true);

  const { data: projects } = useProjects({ limit: 100 });
  const generateMutation = useGenerateReport();

  const handleGenerate = async () => {
    if (!projectId) return;

    const selectedProject = projects?.data.find((p) => p.id === projectId);

    await generateMutation.mutateAsync({
      projectId,
      type: reportType,
      title: title || `${selectedProject?.name || 'Project'} - Security Report`,
      includeRemediation,
    });

    onClose();
    setProjectId('');
    setTitle('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Report" size="lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div className="space-y-2">
            {REPORT_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  reportType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={type.value}
                  checked={reportType === type.value}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Auto-generated if left empty"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeRemediation}
            onChange={(e) => setIncludeRemediation(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Include remediation guidance</span>
        </label>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            loading={generateMutation.isPending}
            disabled={!projectId}
            icon={<FileText className="w-4 h-4" />}
          >
            Generate Report
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ReportPreview({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const { data: report, isLoading } = useReport(reportId);
  const downloadMutation = useDownloadReport();

  if (isLoading) {
    return <div className="py-8 text-center">Loading report...</div>;
  }

  if (!report) {
    return <div className="py-8 text-center text-gray-500">Report not found</div>;
  }

  const handleDownload = (format: 'html' | 'pdf') => {
    downloadMutation.mutate({ id: reportId, format });
  };

  const content = report.content as {
    summary?: { title: string; overview: string };
    findings?: { severity: string; count: number }[];
    executiveSummary?: string;
    totalFindings?: number;
    criticalFindings?: number;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{report.title}</h3>
          <p className="text-sm text-gray-500">
            Project: {report.project?.name || 'Unknown'}
          </p>
        </div>
        <ReportTypeBadge type={report.type} />
      </div>

      {/* Report Preview */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {content.summary && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{content.summary.title}</h4>
            <p className="text-gray-600">{content.summary.overview}</p>
          </div>
        )}

        {content.executiveSummary && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Executive Summary</h4>
            <p className="text-gray-600 whitespace-pre-wrap">{content.executiveSummary}</p>
          </div>
        )}

        {content.totalFindings !== undefined && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-gray-900">{content.totalFindings}</p>
              <p className="text-sm text-gray-500">Total Findings</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-2xl font-bold text-red-600">{content.criticalFindings || 0}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </div>
        )}

        {content.findings && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Findings Summary</h4>
            <div className="space-y-1">
              {content.findings.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{f.severity}</span>
                  <span className="font-medium">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDownload('html')}
            loading={downloadMutation.isPending}
            icon={<FileCode className="w-4 h-4" />}
          >
            HTML
          </Button>
          <Button
            size="sm"
            onClick={() => handleDownload('pdf')}
            loading={downloadMutation.isPending}
            icon={<Download className="w-4 h-4" />}
          >
            PDF
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default function Reports() {
  const [page, setPage] = useState(1);
  const [projectFilter, setProjectFilter] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewReportId, setViewReportId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Report | null>(null);

  const { data: projects } = useProjects({ limit: 100 });

  const { data, isLoading } = useReports({
    page,
    limit: 20,
    projectId: projectFilter || undefined,
  });

  const downloadMutation = useDownloadReport();
  const deleteMutation = useDeleteReport();

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Report',
      render: (r: Report) => (
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{r.title}</p>
            <p className="text-sm text-gray-500">{r.project?.name || 'Unknown Project'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r: Report) => <ReportTypeBadge type={r.type} />,
    },
    {
      key: 'generatedAt',
      header: 'Generated',
      render: (r: Report) => (
        <span className="text-sm text-gray-500">
          {new Date(r.generatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: Report) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewReportId(r.id);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadMutation.mutate({ id: r.id, format: 'html' });
            }}
            className="p-1.5 hover:bg-blue-50 rounded"
            title="Download HTML"
          >
            <Download className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(r);
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

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download security reports</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerateModal(true)}>
          Generate Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gray-400" />
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
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => setViewReportId(r.id)}
          loading={isLoading}
          emptyMessage="No reports generated yet. Generate your first report to document your findings."
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

      {/* Generate Modal */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />

      {/* View Modal */}
      <Modal
        isOpen={!!viewReportId}
        onClose={() => setViewReportId(null)}
        title="Report Preview"
        size="lg"
      >
        {viewReportId && (
          <ReportPreview reportId={viewReportId} onClose={() => setViewReportId(null)} />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Report"
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
          Are you sure you want to delete the report <strong>{deleteConfirm?.title}</strong>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
