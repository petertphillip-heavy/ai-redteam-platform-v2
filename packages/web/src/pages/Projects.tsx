import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit, Play, ExternalLink, Search } from 'lucide-react';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../hooks/useApi';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { useFormValidation } from '../hooks/useFormValidation';
import { createProjectSchema, type CreateProjectFormData } from '../lib/validations';
import type { Project, CreateProjectInput } from '../types';

interface ProjectFormData {
  name: string;
  description: string;
  targetUrl: string;
  apiKey: string;
}

const defaultFormData: ProjectFormData = {
  name: '',
  description: '',
  targetUrl: '',
  apiKey: '',
};

function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: {
  initialData?: Project;
  onSubmit: (data: CreateProjectInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ProjectFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description || '',
          targetUrl: initialData.targetUrl || '',
          apiKey: initialData.apiKey || '',
        }
      : defaultFormData
  );

  const { errors, validate, clearFieldError, clearErrors } = useFormValidation<CreateProjectFormData>(createProjectSchema);

  // Reset form and errors when initialData changes (e.g., opening edit modal)
  useEffect(() => {
    clearErrors();
    setForm(
      initialData
        ? {
            name: initialData.name,
            description: initialData.description || '',
            targetUrl: initialData.targetUrl || '',
            apiKey: initialData.apiKey || '',
          }
        : defaultFormData
    );
  }, [initialData, clearErrors]);

  const handleFieldChange = (field: keyof ProjectFormData, value: string) => {
    setForm({ ...form, [field]: value });
    // Clear the error for this field when the user starts typing
    if (errors[field]) {
      clearFieldError(field);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = validate(form);

    if (result.success && result.data) {
      // Transform validated data to API format (convert empty strings to undefined)
      onSubmit({
        name: result.data.name,
        description: result.data.description || undefined,
        targetUrl: result.data.targetUrl || undefined,
        apiKey: result.data.apiKey || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project Name"
        value={form.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        placeholder="e.g., Production ChatBot Testing"
        error={errors.name}
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) => handleFieldChange('description', e.target.value)}
        rows={2}
        placeholder="Describe the project purpose..."
        error={errors.description}
      />
      <Input
        label="Target URL"
        value={form.targetUrl}
        onChange={(e) => handleFieldChange('targetUrl', e.target.value)}
        placeholder="https://api.example.com/chat"
        helperText={!errors.targetUrl ? 'The API endpoint to test against' : undefined}
        error={errors.targetUrl}
      />
      <Input
        label="API Key"
        type="password"
        value={form.apiKey}
        onChange={(e) => handleFieldChange('apiKey', e.target.value)}
        placeholder="Enter API key for authentication"
        helperText={!errors.apiKey ? 'Optional: Authentication key for the target API' : undefined}
        error={errors.apiKey}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

export default function Projects() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  const { data, isLoading } = useProjects({
    page,
    limit: 20,
    search: search || undefined,
  });

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const handleCreate = async (input: CreateProjectInput) => {
    await createMutation.mutateAsync(input);
    setShowCreateModal(false);
  };

  const handleUpdate = async (input: CreateProjectInput) => {
    if (editProject) {
      await updateMutation.mutateAsync({ id: editProject.id, input });
      setEditProject(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (p: Project) => (
        <div>
          <Link
            to={`/projects/${p.id}`}
            className="font-medium text-gray-900 hover:text-blue-600"
          >
            {p.name}
          </Link>
          {p.description && (
            <p className="text-sm text-gray-500 truncate max-w-md">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'targetUrl',
      header: 'Target',
      render: (p: Project) =>
        p.targetUrl ? (
          <a
            href={p.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            {new URL(p.targetUrl).hostname}
          </a>
        ) : (
          <span className="text-gray-400 text-sm">Not configured</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (p: Project) => (
        <span className="text-sm text-gray-500">
          {new Date(p.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Project) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/tests/new?projectId=${p.id}`}
            className="p-1.5 hover:bg-green-50 rounded"
            title="Start Test"
            onClick={(e) => e.stopPropagation()}
          >
            <Play className="w-4 h-4 text-green-600" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditProject(p);
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
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your testing projects and targets</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
          New Project
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          loading={isLoading}
          emptyMessage="No projects found. Create your first project to get started."
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
        title="Create Project"
        size="lg"
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editProject}
        onClose={() => setEditProject(null)}
        title="Edit Project"
        size="lg"
      >
        {editProject && (
          <ProjectForm
            initialData={editProject}
            onSubmit={handleUpdate}
            onCancel={() => setEditProject(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Project"
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
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will also
          delete all associated tests, findings, and reports.
        </p>
      </Modal>
    </div>
  );
}
