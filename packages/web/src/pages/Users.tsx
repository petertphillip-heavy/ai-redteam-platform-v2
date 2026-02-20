import { useState } from 'react';
import { Search, Filter, Trash2, Edit, ToggleLeft, ToggleRight, Shield, UserCheck } from 'lucide-react';
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
  useChangeUserRole,
  useToggleUserStatus,
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, Pagination } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import type { User, UserRole } from '../types';

const ROLES: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'USER', label: 'User' },
  { value: 'VIEWER', label: 'Viewer' },
];

function RoleBadge({ role }: { role: UserRole }) {
  const variants: Record<UserRole, 'info' | 'success' | 'neutral'> = {
    ADMIN: 'info',
    USER: 'success',
    VIEWER: 'neutral',
  };
  const labels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    USER: 'User',
    VIEWER: 'Viewer',
  };
  return <Badge variant={variants[role]}>{labels[role]}</Badge>;
}

function StatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: { name?: string; email?: string }) => void;
  loading: boolean;
}

function EditUserModal({ user, onClose, onSave, loading }: EditUserModalProps) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name !== user.name ? name : undefined,
      email: email !== user.email ? email : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="User name"
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');

  const { data, isLoading } = useUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
    search: search || undefined,
  });

  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const changeRoleMutation = useChangeUserRole();
  const toggleStatusMutation = useToggleUserStatus();

  const handleUpdate = async (input: { name?: string; email?: string }) => {
    if (editUser) {
      await updateMutation.mutateAsync({ id: editUser.id, input });
      setEditUser(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleRoleChange = async () => {
    if (roleChangeUser) {
      await changeRoleMutation.mutateAsync({ id: roleChangeUser.id, role: selectedRole });
      setRoleChangeUser(null);
    }
  };

  const handleToggleStatus = async (user: User) => {
    await toggleStatusMutation.mutateAsync(user.id);
  };

  const openRoleChangeModal = (user: User) => {
    setRoleChangeUser(user);
    setSelectedRole(user.role);
  };

  const isCurrentUser = (user: User) => user.id === currentUser?.id;

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u: User) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {u.name || 'No name'}
            {isCurrentUser(u) && (
              <span className="ml-2 text-xs text-indigo-500">(you)</span>
            )}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => <RoleBadge role={u.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => <StatusIndicator isActive={u.isActive ?? true} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (u: User) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(u);
            }}
            disabled={isCurrentUser(u) || toggleStatusMutation.isPending}
            className={`p-1.5 rounded ${
              isCurrentUser(u)
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={isCurrentUser(u) ? 'Cannot toggle your own status' : (u.isActive ? 'Deactivate user' : 'Activate user')}
          >
            {u.isActive ? (
              <ToggleRight className={`w-4 h-4 ${isCurrentUser(u) ? 'text-gray-300' : 'text-green-500'}`} />
            ) : (
              <ToggleLeft className={`w-4 h-4 ${isCurrentUser(u) ? 'text-gray-300' : 'text-gray-400'}`} />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openRoleChangeModal(u);
            }}
            disabled={isCurrentUser(u)}
            className={`p-1.5 rounded ${
              isCurrentUser(u)
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={isCurrentUser(u) ? 'Cannot change your own role' : 'Change role'}
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditUser(u);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm(u);
            }}
            disabled={isCurrentUser(u)}
            className={`p-1.5 rounded ${
              isCurrentUser(u)
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600'
            }`}
            title={isCurrentUser(u) ? 'Cannot delete your own account' : 'Delete user'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <UserCheck className="w-4 h-4" />
          <span>{data?.pagination.total ?? 0} users</span>
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-100"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
          keyExtractor={(u) => u.id}
          loading={isLoading}
          emptyMessage="No users found."
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

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
        size="md"
      >
        {editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleUpdate}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={!!roleChangeUser}
        onClose={() => setRoleChangeUser(null)}
        title="Change User Role"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleChangeUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              loading={changeRoleMutation.isPending}
              disabled={selectedRole === roleChangeUser?.role}
            >
              Change Role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Change role for <strong>{roleChangeUser?.name || roleChangeUser?.email}</strong>
          </p>
          <div className="space-y-2">
            {(['ADMIN', 'USER', 'VIEWER'] as UserRole[]).map((role) => (
              <label
                key={role}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                  className="text-indigo-600"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{role}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {role === 'ADMIN' && 'Full access to all features and user management'}
                    {role === 'USER' && 'Can create and manage projects, tests, and findings'}
                    {role === 'VIEWER' && 'Read-only access to view projects and reports'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete User"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete User
            </Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{deleteConfirm?.name || deleteConfirm?.email}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
