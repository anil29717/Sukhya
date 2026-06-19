import React, { useEffect, useState } from 'react';
import { UserCog, ShieldAlert, Key } from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import { FormModal } from '../components/ui/FormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { createUser, deactivateUser, listUsers, updateUser } from '../services/adminApi';

interface UserItem {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: { name: string } | string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

const CREATE_FIELDS = [
  { name: 'full_name', label: 'Full Name', required: true },
  { name: 'email', label: 'Email', type: 'email' as const, required: true },
  { name: 'password', label: 'Password', type: 'password' as const, required: true },
  { name: 'phone', label: 'Phone' },
  {
    name: 'role',
    label: 'Role',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'patient', label: 'Patient' },
      { value: 'doctor', label: 'Doctor' },
      { value: 'admin', label: 'Admin' },
    ],
  },
];

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string | boolean>>({ role: 'patient' });
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editApproved, setEditApproved] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await listUsers({ page: 1, page_size: 100, role: roleFilter || undefined });
      setUsers((res.data.items || []) as UserItem[]);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRowClick = (user: UserItem) => {
    setSelectedUser(user);
    setEditName(user.full_name);
    setEditPhone(user.phone || '');
    setEditActive(user.is_active);
    setEditApproved(user.is_approved);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      await updateUser(selectedUser.id, {
        full_name: editName,
        phone: editPhone,
        is_active: editActive,
        is_approved: editApproved,
      });
      setSelectedUser(null);
      fetchUsers();
    } catch {
      alert('Failed to update account setting.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createUser({
        email: String(createValues.email),
        password: String(createValues.password),
        full_name: String(createValues.full_name),
        phone: createValues.phone ? String(createValues.phone) : undefined,
        role: String(createValues.role || 'patient'),
      });
      setCreateOpen(false);
      setCreateValues({ role: 'patient' });
      fetchUsers();
    } catch {
      alert('Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deactivateUser(deleteTarget.id);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      alert('Failed to deactivate user.');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<UserItem>[] = [
    { key: 'id', label: 'ID', sortable: true, render: (r) => `#${r.id}` },
    { key: 'full_name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true, render: (r) => <span className="text-[#94a3b8]">{r.email}</span> },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (r) => {
        const roleName = typeof r.role === 'object' ? r.role?.name : r.role;
        const roleClass =
          roleName === 'admin'
            ? 'bg-red-500/10 text-red-500'
            : roleName === 'doctor'
              ? 'bg-sky-500/10 text-sky-400'
              : 'bg-teal-500/10 text-teal-400';
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleClass}`}>
            {roleName}
          </span>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}
        >
          {r.is_active ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'is_approved',
      label: 'Clearance',
      sortable: true,
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_approved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}
        >
          {r.is_approved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Registered',
      sortable: true,
      render: (r) => <span className="text-[#64748b]">{new Date(r.created_at).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <div className="flex gap-4 items-center">
          <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Role Filter:</label>
          <select
            className="bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500 cursor-pointer transition-colors hover:border-[#64748b]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Accounts</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        onRowClick={handleRowClick}
        onAdd={() => setCreateOpen(true)}
        addLabel="Add User"
        onEdit={handleRowClick}
        onDelete={setDeleteTarget}
        searchPlaceholder="Search users by name, email, or role..."
        emptyStateMessage="No users match the current filters."
        pageSize={12}
        exportFileName="users"
      />

      <FormModal
        open={createOpen}
        title="Create User"
        fields={CREATE_FIELDS}
        values={createValues}
        loading={saving}
        submitLabel="Create"
        onChange={(name, value) => setCreateValues((v) => ({ ...v, [name]: value }))}
        onSubmit={handleCreate}
        onClose={() => setCreateOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deactivate User"
        message={`Deactivate ${deleteTarget?.full_name}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <DetailDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.full_name || 'User Details'}
        subtitle={`ID: #${selectedUser?.id} • ${selectedUser?.email}`}
        width="max-w-md"
      >
        {selectedUser && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <ShieldAlert size={16} className="text-amber-500 mb-2" />
                <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">Clearance</p>
                <p className="text-sm font-bold text-[#f8fafc] mt-1">
                  {selectedUser.is_approved ? 'Approved' : 'Pending Review'}
                </p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <Key size={16} className="text-teal-500 mb-2" />
                <p className="text-xs text-[#64748b] font-semibold uppercase tracking-wider">Account Role</p>
                <p className="text-sm font-bold text-[#f8fafc] capitalize mt-1">
                  {typeof selectedUser.role === 'object' ? selectedUser.role?.name : selectedUser.role}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wider border-b border-[#1f2937] pb-2">
                Edit Settings
              </h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-2.5 px-3 text-[#f8fafc] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">Contact Phone</label>
                <input
                  type="text"
                  className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-2.5 px-3 text-[#f8fafc] text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Not provided"
                />
              </div>
              <div className="flex flex-col gap-4 pt-4 border-t border-[#1f2937]">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editActive ? 'bg-teal-500 border-teal-500' : 'bg-[#0b0f19] border-[#334155] group-hover:border-[#64748b]'}`}
                  >
                    {editActive && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                  />
                  <span className="text-sm text-[#f8fafc] font-medium">Account Active (Login Enabled)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editApproved ? 'bg-teal-500 border-teal-500' : 'bg-[#0b0f19] border-[#334155] group-hover:border-[#64748b]'}`}
                  >
                    {editApproved && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={editApproved}
                    onChange={(e) => setEditApproved(e.target.checked)}
                  />
                  <span className="text-sm text-[#f8fafc] font-medium">Clearance Approved (For Doctors)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#1f2937]">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 hover:opacity-95 text-[#fff] text-sm font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserCog size={16} />
                )}
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};
