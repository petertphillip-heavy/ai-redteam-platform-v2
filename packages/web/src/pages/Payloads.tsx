import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  usePayloads,
  usePayload,
  useCreatePayload,
  useUpdatePayload,
  useDeletePayload,
  useTogglePayloadActive,
} from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { SeverityBadge, CategoryBadge } from '../components/ui/Badge';
import type { Payload, PayloadCategory, Severity, CreatePayloadInput } from '../types';

const CATEGORIES: { value: PayloadCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'PROMPT_INJECTION', label: 'Prompt Injection' },
  { value: 'DATA_EXTRACTION', label: 'Data Extraction' },
  { value: 'GUARDRAIL_BYPASS', label: 'Guardrail Bypass' },
  { value: 'INTEGRATION_VULN', label: 'Integration Vuln' },
];

const SEVERITIES: { value: Severity | ''; label: string }[] = [
  { value: '', label: 'All Severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'INFO', label: 'Info' },
];

interface PayloadFormData {
  name: string;
  description: string;
  category: PayloadCategory;
  subcategory: string;
  content: string;
  severity: Severity;
  tags: string;
}

const defaultFormData: PayloadFormData = {
  name: '',
  description: '',
  category: 'PROMPT_INJECTION',
  subcategory: '',
  content: '',
  severity: 'MEDIUM',
  tags: '',
};

function PayloadForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: Payload;
  onSubmit: (data: CreatePayloadInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<PayloadFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          category: initialData.category,
          subcategory: initialData.subcategory || '',
          content: initialData.content,
          severity: initialData.severity,
          tags: initialData.tags.join(', '),
        }
      : defaultFormData
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory || undefined,
      content: form.content,
      severity: form.severity,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        placeholder="e.g., Direct System Prompt Override"
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        required
        rows={2}
        placeholder="Describe what this payload tests..."
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as PayloadCategory })}
          options={CATEGORIES.filter((c) => c.value !== '') as { value: string; label: string }[]}
        />
        <Select
          label="Severity"
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
          options={SEVERITIES.filter((s) => s.value !== '') as { value: string; label: string }[]}
        />
      </div>
      <Input
        label="Subcategory"
        value={form.subcategory}
        onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
        placeholder="Optional subcategory"
      />
      <Textarea
        label="Payload Content"
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        required
        rows={6}
        placeholder="Enter the attack payload content..."
        className="font-mono text-sm"
      />
      <Input
        label="Tags"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
        placeholder="jailbreak, roleplay, dan (comma-separated)"
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Update Payload' : 'Create Payload'}
        </Button>
      </div>
    </form>
  );
}

function PayloadDetail({
  payloadId,
  onClose,
  onEdit,
}: {
  payloadId: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: payload, isLoading } = usePayload(payloadId);

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (!payload) {
    return <div className="py-8 text-center text-gray-500">Payload not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{payload.name}</h3>
          <p className="text-gray-500 text-sm">{payload.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={payload.severity} />
          <CategoryBadge category={payload.category} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payload Content</label>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
          {payload.content}
        </pre>
      </div>

      {payload.tags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1">
            {payload.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
        <span>Created: {new Date(payload.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(payload.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} icon={<Edit className="w-4 h-4" />}>
          Edit
        </Button>
      </div>
    </div>
  );
}

export default function Payloads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PayloadCategory | ''>(
    (searchParams.get('category') as PayloadCategory) || ''
  );
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPayload, setEditPayload] = useState<Payload | null>(null);
  const [viewPayloadId, setViewPayloadId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Payload | null>(null);

  const { data, isLoading } = usePayloads({
    page,
    limit: 20,
    category: category || undefined,
    severity: severity || undefined,
    search: search || undefined,
  });

  const createMutation = useCreatePayload();
  const updateMutation = useUpdatePayload();
  const deleteMutation = useDeletePayload();
  const toggleMutation = useTogglePayloadActive();

  const handleCreate = async (input: CreatePayloadInput) => {
    await createMutation.mutateAsync(input);
    setShowCreateModal(false);
  };

  const handleUpdate = async (input: CreatePayloadInput) => {
    if (editPayload) {
      await updateMutation.mutateAsync({ id: editPayload.id, input });
      setEditPayload(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleToggle = async (payload: Payload) => {
    await toggleMutation.mutateAsync(payload.id);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (p: Payload) => (
        <div>
          <p className="font-medium text-gray-900">{p.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{p.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p: Payload) => <CategoryBadge category={p.category} />,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (p: Payload) => <SeverityBadge severity={p.severity} />,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (p: Payload) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(p);
          }}
          className="flex items-center gap-1 text-sm"
        >
          {p.isActive ? (
            <>
              <ToggleRight className="w-5 h-5 text-green-500" />
              <span className="text-green-700">Active</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Inactive</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Payload) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewPayloadId(p.id);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditPayload(p);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(p);
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
          <h1 className="text-3xl font-bold text-gray-900">Attack Payload Library</h1>
          <p className="text-gray-500 mt-1">
            Manage and organize security testing payloads
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          Add Payload
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payloads..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as PayloadCategory | '');
                setPage(1);
                if (e.target.value) {
                  setSearchParams({ category: e.target.value });
                } else {
                  setSearchParams({});
                }
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value as Severity | '');
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
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
          keyExtractor={(p) => p.id}
          onRowClick={(p) => setViewPayloadId(p.id)}
          loading={isLoading}
          emptyMessage="No payloads found. Create your first payload to get started."
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

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payload"
        size="lg"
      >
        <PayloadForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editPayload}
        onClose={() => setEditPayload(null)}
        title="Edit Payload"
        size="lg"
      >
        {editPayload && (
          <PayloadForm
            initialData={editPayload}
            onSubmit={handleUpdate}
            onCancel={() => setEditPayload(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewPayloadId}
        onClose={() => setViewPayloadId(null)}
        title="Payload Details"
        size="lg"
      >
        {viewPayloadId && (
          <PayloadDetail
            payloadId={viewPayloadId}
            onClose={() => setViewPayloadId(null)}
            onEdit={() => {
              const payload = data?.data.find((p) => p.id === viewPayloadId);
              if (payload) {
                setViewPayloadId(null);
                setEditPayload(payload);
              }
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Payload"
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
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot
          be undone.
        </p>
      </Modal>
    </div>
  );
}
