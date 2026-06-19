import React, { useEffect, useRef, useState } from 'react';
import { api, getApiUrl } from '../services/api';
import {
  createFollowUp,
  createMedication,
  createPatient,
  createUser,
  deactivateMedication,
  deactivatePatient,
  downloadRecordBlob,
  listFollowUps,
  listMedications,
  listPatients,
  listRecords,
  listVitals,
  cancelAppointment,
  rescheduleAppointment,
  updateDoctor,
  updateFollowUp,
  updateMedication,
  updatePatient,
  updateRecord,
  uploadRecord,
  deleteRecord,
  listNotifications,
} from '../services/adminApi';
import { 
  Trash2, Download, Check, X, 
  Send, Key, Video, Settings,
  Pill, CalendarClock, User, Stethoscope,
  FileText, HeartHandshake, Bell, ClipboardList,
  Users
} from 'lucide-react';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import { StatCard } from '../components/ui/StatCard';
import { FormModal } from '../components/ui/FormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDoctorName } from '../utils/formatDoctorName';

// ==========================================
// 1. PATIENTS VIEW
// ==========================================
export const PatientsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await listPatients({ page: 1, page_size: 100 });
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditRow(null);
    setFormValues({});
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditRow(row);
    setFormValues({
      full_name: row.full_name || row.display_name || '',
      phone: row.phone || '',
      gender: row.gender || '',
      blood_group: row.blood_group || '',
      date_of_birth: row.date_of_birth || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editRow) {
        await updatePatient(editRow.id, formValues);
      } else {
        await createPatient(formValues);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await deactivatePatient(deleteRow.id);
      setDeleteRow(null);
      fetchData();
    } catch {
      alert('Deactivate failed');
    } finally {
      setSaving(false);
    }
  };

  const patientFields = editRow
    ? [
        { name: 'full_name', label: 'Full Name', required: true },
        { name: 'phone', label: 'Phone' },
        { name: 'gender', label: 'Gender', type: 'select' as const, options: [
          { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
        ]},
        { name: 'blood_group', label: 'Blood Group' },
        { name: 'date_of_birth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
      ]
    : [
        { name: 'full_name', label: 'Full Name', required: true },
        { name: 'email', label: 'Email', type: 'email' as const, required: true },
        { name: 'password', label: 'Password', type: 'password' as const, required: true },
        { name: 'phone', label: 'Phone' },
        { name: 'gender', label: 'Gender', type: 'select' as const, options: [
          { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
        ]},
        { name: 'blood_group', label: 'Blood Group' },
        { name: 'date_of_birth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
      ];

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'display_name', label: 'Name', sortable: true, render: r => r.display_name || r.user?.full_name || 'Patient' },
    { key: 'gender', label: 'Gender', sortable: true, render: r => <span className="uppercase text-[#94a3b8]">{r.gender || 'N/A'}</span> },
    { key: 'date_of_birth', label: 'Date of Birth', sortable: true, render: r => r.date_of_birth || 'N/A' },
    { key: 'blood_group', label: 'Blood Group', sortable: true, render: r => (
      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-bold text-xs">{r.blood_group || 'N/A'}</span>
    )},
    { key: 'emergency_contact_name', label: 'Emergency Contact', render: r => r.emergency_contact_name || 'Not set' },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onAdd={openCreate}
        addLabel="Add Patient"
        onEdit={openEdit}
        onDelete={setDeleteRow}
        searchPlaceholder="Search patients by name, gender, blood group..."
        emptyStateMessage="No patient records found."
        pageSize={12}
        exportFileName="patients"
      />
      <FormModal
        open={modalOpen}
        title={editRow ? 'Edit Patient' : 'Create Patient'}
        fields={patientFields}
        values={formValues}
        loading={saving}
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Deactivate Patient"
        message={`Deactivate patient #${deleteRow?.id}?`}
        confirmLabel="Deactivate"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.display_name || selected?.user?.full_name || 'Patient'}
        subtitle={`Patient ID: #${selected?.id}`}
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-1">Blood Group</p>
                <p className="text-xl font-bold text-red-400">{selected.blood_group || 'Unknown'}</p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-1">Gender</p>
                <p className="text-sm font-bold text-[#f8fafc] uppercase">{selected.gender || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-2">⚠ Allergies</p>
                <p className="text-red-400">{selected.allergies || 'None declared'}</p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-2">Existing Conditions</p>
                <p className="text-[#f8fafc]">{selected.existing_conditions || 'None'}</p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-2">Medical History</p>
                <p className="text-[#f8fafc]">{selected.medical_history || 'No history recorded'}</p>
              </div>
              {selected.emergency_contact_name && (
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-2">Emergency Contact</p>
                  <p className="text-[#f8fafc] font-semibold">{selected.emergency_contact_name}</p>
                  <p className="text-[#94a3b8] text-xs">{selected.emergency_contact_phone || 'No phone'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 2. DOCTORS VIEW
// ==========================================
export const DoctorsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors?page=1&page_size=100');
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditRow(null);
    setFormValues({ role: 'doctor' });
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditRow(row);
    setFormValues({
      qualification: row.qualification || '',
      specialization: row.specialization || '',
      experience_years: String(row.experience_years ?? ''),
      consultation_fee: String(row.consultation_fee ?? ''),
      bio: row.bio || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editRow) {
        await updateDoctor(editRow.id, {
          qualification: formValues.qualification || undefined,
          specialization: formValues.specialization || undefined,
          experience_years: formValues.experience_years ? Number(formValues.experience_years) : undefined,
          consultation_fee: formValues.consultation_fee ? Number(formValues.consultation_fee) : undefined,
          bio: formValues.bio || undefined,
        });
      } else {
        await createUser({
          email: String(formValues.email),
          password: String(formValues.password),
          full_name: String(formValues.full_name),
          phone: formValues.phone ? String(formValues.phone) : undefined,
          role: 'doctor',
        });
      }
      setModalOpen(false);
      fetchData();
    } catch {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await updateDoctor(deleteRow.id, { is_active: false });
      setDeleteRow(null);
      fetchData();
    } catch {
      alert('Deactivate failed');
    } finally {
      setSaving(false);
    }
  };

  const doctorFields = editRow
    ? [
        { name: 'qualification', label: 'Qualification' },
        { name: 'specialization', label: 'Specialization' },
        { name: 'experience_years', label: 'Experience (years)', type: 'number' as const },
        { name: 'consultation_fee', label: 'Consultation Fee', type: 'number' as const },
        { name: 'bio', label: 'Bio', type: 'textarea' as const },
      ]
    : [
        { name: 'full_name', label: 'Full Name', required: true },
        { name: 'email', label: 'Email', type: 'email' as const, required: true },
        { name: 'password', label: 'Password', type: 'password' as const, required: true },
        { name: 'phone', label: 'Phone' },
      ];

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'full_name', label: 'Doctor', sortable: true, render: r => (
      <span className="font-semibold text-[#f8fafc]">{formatDoctorName(r.full_name ?? r.user?.full_name)}</span>
    )},
    { key: 'specialization', label: 'Specialization', sortable: true, render: r => (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 uppercase tracking-wider">{r.specialization}</span>
    )},
    { key: 'qualification', label: 'Qualification', render: r => r.qualification || 'N/A' },
    { key: 'consultation_fee', label: 'Fee', sortable: true, render: r => (
      <span className="font-semibold text-emerald-400">${r.consultation_fee}</span>
    )},
    { key: 'experience_years', label: 'Experience', sortable: true, render: r => `${r.experience_years} yrs` },
    { key: 'is_available', label: 'Status', render: r => (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.is_available ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
        {r.is_available ? 'Available' : 'Unavailable'}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onAdd={openCreate}
        addLabel="Add Doctor"
        onEdit={openEdit}
        onDelete={setDeleteRow}
        searchPlaceholder="Search by name, specialization, qualification..."
        emptyStateMessage="No doctors found."
        pageSize={12}
        exportFileName="doctors"
      />
      <FormModal
        open={modalOpen}
        title={editRow ? 'Edit Doctor' : 'Create Doctor'}
        fields={doctorFields}
        values={formValues}
        loading={saving}
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Deactivate Doctor"
        message={`Deactivate ${formatDoctorName(deleteRow?.full_name ?? deleteRow?.user?.full_name)}?`}
        confirmLabel="Deactivate"
        danger
        loading={saving}
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={formatDoctorName(selected?.full_name ?? selected?.user?.full_name, '')}
        subtitle={`${selected?.specialization || ''} • ${selected?.experience_years} yrs experience`}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] text-center">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Fee</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">${selected.consultation_fee}</p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] text-center">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Experience</p>
                <p className="text-xl font-bold text-[#f8fafc] mt-1">{selected.experience_years}y</p>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] text-center">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Rating</p>
                <p className="text-xl font-bold text-amber-400 mt-1">{selected.average_rating?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div><span className="text-[#64748b] text-xs font-bold uppercase">Qualification:</span> <span className="text-[#f8fafc] ml-2">{selected.qualification || 'N/A'}</span></div>
              <div><span className="text-[#64748b] text-xs font-bold uppercase">License Number:</span> <span className="font-mono text-[#f8fafc] ml-2">{selected.license_number || 'N/A'}</span></div>
              <div><span className="text-[#64748b] text-xs font-bold uppercase">Hospital:</span> <span className="text-[#f8fafc] ml-2">{selected.hospital_affiliation || 'Independent'}</span></div>
            </div>
            {selected.bio && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-2">Professional Bio</p>
                <p className="text-sm text-[#94a3b8]">{selected.bio}</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 3. DOCTOR APPROVALS VIEW
// ==========================================
export const ApprovalsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/doctors/pending');
      setItems(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this doctor registration?')) return;
    try {
      await api.post(`/admin/doctors/${id}/approve`);
      setSelected(null);
      fetchApprovals();
    } catch (err) { alert('Approval failed'); }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Reject and remove this doctor registration?')) return;
    try {
      await api.post(`/admin/doctors/${id}/reject`);
      setSelected(null);
      fetchApprovals();
    } catch (err) { alert('Rejection failed'); }
  };

  const columns: Column<any>[] = [
    { key: 'user_id', label: 'ID', sortable: true, render: r => `#${r.user_id}` },
    { key: 'full_name', label: 'Doctor Name', sortable: true, render: r => (
      <span className="font-semibold text-[#f8fafc]">{formatDoctorName(r.full_name)}</span>
    )},
    { key: 'email', label: 'Email', render: r => <span className="text-[#94a3b8]">{r.email}</span> },
    { key: 'phone', label: 'Phone', render: r => r.phone || 'N/A' },
    { key: '_status', label: 'Status', render: () => (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-wider">Pending Clearance</span>
    )},
  ];

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">{items.length}</div>
          <p className="text-amber-400 font-semibold">Doctor registration(s) pending admin review. Click any row to approve or reject.</p>
        </div>
      )}
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search pending registrations..."
        emptyStateMessage="✓ No pending doctor approvals. All registrations are cleared."
        pageSize={12}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={formatDoctorName(selected?.full_name, '')}
        subtitle="Pending Clearance Review"
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2">Action Required</p>
              <p className="text-sm text-[#94a3b8]">Review this doctor's registration details and approve or reject their access to the platform.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Email</span><span className="text-[#f8fafc]">{selected.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Phone</span><span className="text-[#f8fafc]">{selected.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Registered</span><span className="text-[#f8fafc]">{new Date(selected.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleApprove(selected.user_id)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Check size={16} /> Approve
              </button>
              <button
                onClick={() => handleReject(selected.user_id)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <X size={16} /> Reject
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 4. APPOINTMENTS VIEW
// ==========================================
export const AppointmentsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [rescheduleRow, setRescheduleRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchAppts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/appointments?page_size=100${status ? `&status=${status}` : ''}`);
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAppts(); }, [status]);

  const handleCancel = async (id: number) => {
    const reason = prompt('Cancellation reason:');
    if (reason === null) return;
    try {
      await cancelAppointment(id, reason || 'Cancelled by admin');
      setSelected(null);
      fetchAppts();
    } catch (err) { alert('Cancel failed'); }
  };

  const openReschedule = (row: any) => {
    setRescheduleRow(row);
    setFormValues({
      appointment_date: row.appointment_date || '',
      start_time: row.start_time?.substring(0, 5) || '',
      reason: '',
    });
  };

  const handleReschedule = async () => {
    if (!rescheduleRow) return;
    setSaving(true);
    try {
      await rescheduleAppointment(rescheduleRow.id, {
        appointment_date: formValues.appointment_date,
        start_time: `${formValues.start_time}:00`,
        reason: formValues.reason || undefined,
      });
      setRescheduleRow(null);
      fetchAppts();
    } catch {
      alert('Reschedule failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await cancelAppointment(deleteRow.id, 'Cancelled by admin');
      setDeleteRow(null);
      fetchAppts();
    } catch {
      alert('Cancel failed');
    } finally {
      setSaving(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    confirmed: 'bg-blue-500/10 text-blue-400',
    completed: 'bg-emerald-500/10 text-emerald-500',
    cancelled: 'bg-rose-500/10 text-rose-500',
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient', label: 'Patient', sortable: true, render: r => r.patient?.full_name || 'N/A' },
    { key: 'doctor', label: 'Doctor', sortable: true, render: r => formatDoctorName(r.doctor?.full_name) },
    { key: 'appointment_date', label: 'Date', sortable: true },
    { key: 'start_time', label: 'Time', render: r => `${r.start_time?.substring(0, 5)} — ${r.end_time?.substring(0, 5)}` },
    { key: 'status', label: 'Status', sortable: true, render: r => (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[r.status] || 'bg-slate-500/10 text-slate-400'}`}>
        {r.status}
      </span>
    )},
    { key: 'appointment_type', label: 'Type', render: r => <span className="text-[#64748b] capitalize">{r.appointment_type || 'in-person'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          className="bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500 transition-colors hover:border-[#64748b] cursor-pointer"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onEdit={openReschedule}
        onDelete={setDeleteRow}
        searchPlaceholder="Search appointments by patient, doctor, date..."
        emptyStateMessage="No appointments match the current filter."
        pageSize={12}
        exportFileName="appointments"
      />
      <FormModal
        open={!!rescheduleRow}
        title={`Reschedule #${rescheduleRow?.id}`}
        fields={[
          { name: 'appointment_date', label: 'Date', required: true, placeholder: 'YYYY-MM-DD' },
          { name: 'start_time', label: 'Start Time', required: true, placeholder: 'HH:MM' },
          { name: 'reason', label: 'Reason', type: 'textarea' as const },
        ]}
        values={formValues}
        loading={saving}
        submitLabel="Reschedule"
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleReschedule}
        onClose={() => setRescheduleRow(null)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Cancel Appointment"
        message={`Cancel appointment #${deleteRow?.id}?`}
        confirmLabel="Cancel Appointment"
        danger
        loading={saving}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Appointment #${selected?.id}`}
        subtitle={`${selected?.appointment_date} • ${selected?.start_time?.substring(0, 5)} — ${selected?.end_time?.substring(0, 5)}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-1">Status</p>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[selected.status] || 'bg-slate-500/10 text-slate-400'}`}>
                  {selected.status}
                </span>
              </div>
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-1">Type</p>
                <p className="text-sm font-bold text-[#f8fafc] capitalize">{selected.appointment_type || 'in-person'}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
              <div className="flex justify-between py-1.5 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Patient</span><span className="text-[#f8fafc] font-semibold">{selected.patient?.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Doctor</span><span className="text-[#f8fafc] font-semibold">{formatDoctorName(selected.doctor?.full_name)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1f2937]">
                <span className="text-[#64748b]">Date</span><span className="text-[#f8fafc]">{selected.appointment_date}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748b]">Time Slot</span><span className="text-[#f8fafc]">{selected.start_time?.substring(0, 5)} — {selected.end_time?.substring(0, 5)}</span>
              </div>
            </div>
            {selected.notes && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Notes</p>
                <p className="text-sm text-[#94a3b8]">{selected.notes}</p>
              </div>
            )}
            {selected.status !== 'cancelled' && selected.status !== 'completed' && (
              <button
                onClick={() => handleCancel(selected.id)}
                className="w-full py-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <X size={16} /> Cancel Appointment
              </button>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 5. MEDICAL RECORDS VIEW
// ==========================================
export const RecordsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await listRecords({ page_size: 100, record_type: type || undefined });
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [type]);

  const handleDelete = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await deleteRecord(deleteRow.id);
      setDeleteRow(null);
      setSelected(null);
      fetchRecords();
    } catch (err) { alert('Delete failed'); }
    finally { setSaving(false); }
  };

  const openEdit = (row: any) => {
    setEditRow(row);
    setFormValues({ title: row.title || '', description: row.description || '' });
  };

  const handleEditSave = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updateRecord(editRow.id, {
        title: String(formValues.title),
        description: String(formValues.description),
      });
      setEditRow(null);
      fetchRecords();
    } catch {
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('patient_id', String(formValues.patient_id));
      fd.append('title', String(formValues.title || uploadFile.name));
      fd.append('record_type', String(formValues.record_type || 'lab_report'));
      if (formValues.description) fd.append('description', String(formValues.description));
      await uploadRecord(fd);
      setUploadOpen(false);
      setUploadFile(null);
      fetchRecords();
    } catch {
      alert('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient_id', label: 'Patient', render: r => `Patient #${r.patient_id}` },
    { key: 'title', label: 'Title', sortable: true, render: r => <span className="font-semibold text-[#f8fafc]">{r.title}</span> },
    { key: 'record_type', label: 'Category', sortable: true, render: r => (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">{r.record_type?.replace('_', ' ')}</span>
    )},
    { key: 'file_name', label: 'Filename', render: r => <span className="font-mono text-xs text-[#64748b]">{r.file_name}</span> },
    { key: 'created_at', label: 'Uploaded', sortable: true, render: r => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          className="bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc] focus:outline-none focus:border-blue-500 transition-colors hover:border-[#64748b] cursor-pointer"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="prescription">Prescription</option>
          <option value="lab_report">Lab Report</option>
          <option value="diagnostic_report">Diagnostic</option>
        </select>
      </div>
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onAdd={() => { setFormValues({ record_type: 'lab_report' }); setUploadOpen(true); }}
        addLabel="Upload Record"
        onEdit={openEdit}
        onDelete={setDeleteRow}
        searchPlaceholder="Search EHR records by title, category, patient..."
        emptyStateMessage="No medical records match the current filter."
        pageSize={12}
        exportFileName="medical-records"
      />
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Upload Medical Record</h3>
            <div className="space-y-4">
              <input type="number" placeholder="Patient ID" className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc]"
                value={String(formValues.patient_id || '')} onChange={(e) => setFormValues((f) => ({ ...f, patient_id: e.target.value }))} />
              <input type="text" placeholder="Title" className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc]"
                value={String(formValues.title || '')} onChange={(e) => setFormValues((f) => ({ ...f, title: e.target.value }))} />
              <select className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg px-4 py-2 text-sm text-[#f8fafc]"
                value={String(formValues.record_type || 'lab_report')} onChange={(e) => setFormValues((f) => ({ ...f, record_type: e.target.value }))}>
                <option value="lab_report">Lab Report</option>
                <option value="prescription">Prescription</option>
                <option value="diagnostic_report">Diagnostic</option>
              </select>
              <input ref={fileInputRef} type="file" className="text-sm text-[#94a3b8]" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setUploadOpen(false)} className="px-4 py-2 rounded-lg border border-[#334155] text-sm text-[#f8fafc]">Cancel</button>
              <button onClick={handleUpload} disabled={saving || !uploadFile} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
      <FormModal
        open={!!editRow}
        title="Edit Record Metadata"
        fields={[
          { name: 'title', label: 'Title', required: true },
          { name: 'description', label: 'Description', type: 'textarea' as const },
        ]}
        values={formValues}
        loading={saving}
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleEditSave}
        onClose={() => setEditRow(null)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Delete Record"
        message="Permanently delete this medical record?"
        confirmLabel="Delete"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Medical Record'}
        subtitle={`Patient #${selected?.patient_id} • ${selected?.record_type}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">Category</span><span className="text-[#f8fafc] uppercase font-semibold">{selected.record_type?.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">File</span><span className="font-mono text-xs text-[#94a3b8]">{selected.file_name}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Uploaded</span><span className="text-[#f8fafc]">{new Date(selected.created_at).toLocaleString()}</span></div>
            </div>
            {selected.description && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Description</p>
                <p className="text-sm text-[#94a3b8]">{selected.description}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => selected && downloadRecordBlob(selected.id, selected.file_name)}
                className="flex-1 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={16} /> Download File
              </button>
              <button
                onClick={() => setDeleteRow(selected)}
                className="py-3 px-5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 6. PRESCRIPTIONS VIEW
// ==========================================
export const PrescriptionsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPres = async () => {
      setLoading(true);
      try {
        const res = await api.get('/prescriptions?page_size=100');
        setItems(res.data.items || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchPres();
  }, []);

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient_id', label: 'Patient', render: r => `Patient #${r.patient_id}` },
    { key: 'doctor_id', label: 'Doctor', render: r => `Doctor #${r.doctor_id}` },
    { key: 'diagnosis', label: 'Diagnosis', sortable: true, render: r => r.diagnosis || 'General checkup' },
    { key: 'medications', label: 'Medications', render: r => (
      <span className="text-xs text-[#94a3b8] truncate block max-w-[200px]">
        {(r.medications || []).map((m: any) => m.name).join(', ') || 'N/A'}
      </span>
    )},
    { key: 'status', label: 'Status', sortable: true, render: r => (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
        {r.status}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search prescriptions by diagnosis, patient..."
        emptyStateMessage="No prescription records found."
        pageSize={12}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Prescription #${selected?.id}`}
        subtitle={selected?.diagnosis || 'General consultation'}
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">Patient ID</span><span className="text-[#f8fafc]">#{selected.patient_id}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Doctor ID</span><span className="text-[#f8fafc]">#{selected.doctor_id}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selected.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                  {selected.status}
                </span>
              </div>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider mb-3">Medications</p>
              <div className="space-y-2">
                {(selected.medications || []).map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#1e293b] p-3 rounded-lg">
                    <span className="text-sm font-semibold text-[#f8fafc]">{m.name}</span>
                    <span className="text-xs text-[#94a3b8]">{m.dosage} • {m.frequency}</span>
                  </div>
                ))}
              </div>
            </div>
            {selected.instructions && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Instructions</p>
                <p className="text-sm text-[#94a3b8]">{selected.instructions}</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 7. FAMILY VIEW
// ==========================================
export const FamilyView: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-[#1f2937] p-12 rounded-2xl text-center text-[#64748b]">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-6">
        <Users size={32} />
      </div>
      <h3 className="font-semibold text-[#f8fafc] text-xl mb-3">Family Profiles Portal</h3>
      <p className="text-sm max-w-md mx-auto text-[#94a3b8] leading-relaxed">
        Patients can map family relations and manage dependent medical information inside their personal dashboards. 
        Admins audit access permissions in user directories. Family group data is scoped to the patient's account.
      </p>
    </div>
  );
};

// ==========================================
// 8. MEDICATIONS VIEW
// ==========================================
export const MedicationsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchMeds = async () => {
    setLoading(true);
    try {
      const res = await listMedications({ page_size: 100 });
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeds(); }, []);

  const medFields = [
    { name: 'patient_id', label: 'Patient ID', type: 'number' as const, required: true },
    { name: 'name', label: 'Medication Name', required: true },
    { name: 'dosage', label: 'Dosage' },
    { name: 'frequency', label: 'Frequency' },
    { name: 'start_date', label: 'Start Date', placeholder: 'YYYY-MM-DD' },
    { name: 'end_date', label: 'End Date', placeholder: 'YYYY-MM-DD' },
    { name: 'instructions', label: 'Instructions', type: 'textarea' as const },
  ];

  const openCreate = () => { setEditRow(null); setFormValues({}); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditRow(row);
    setFormValues({
      patient_id: String(row.patient_id),
      name: row.name,
      dosage: row.dosage || '',
      frequency: row.frequency || '',
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      instructions: row.instructions || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        patient_id: Number(formValues.patient_id),
        name: String(formValues.name),
        dosage: formValues.dosage || undefined,
        frequency: formValues.frequency || undefined,
        start_date: formValues.start_date || undefined,
        end_date: formValues.end_date || undefined,
        instructions: formValues.instructions || undefined,
      };
      if (editRow) await updateMedication(editRow.id, payload);
      else await createMedication(payload);
      setModalOpen(false);
      fetchMeds();
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await deactivateMedication(deleteRow.id);
      setDeleteRow(null);
      fetchMeds();
    } catch { alert('Deactivate failed'); }
    finally { setSaving(false); }
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient_id', label: 'Patient', render: r => `Patient #${r.patient_id}` },
    { key: 'name', label: 'Medication', sortable: true, render: r => <span className="font-semibold text-[#f8fafc]">{r.name}</span> },
    { key: 'dosage', label: 'Dosage', render: r => r.dosage || 'N/A' },
    { key: 'frequency', label: 'Frequency', sortable: true, render: r => r.frequency || 'N/A' },
    { key: 'start_date', label: 'Start', sortable: true, render: r => r.start_date },
    { key: 'end_date', label: 'End', render: r => r.end_date || 'Ongoing' },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onAdd={openCreate}
        addLabel="Add Medication"
        onEdit={openEdit}
        onDelete={setDeleteRow}
        searchPlaceholder="Search medications by name, dosage, patient..."
        emptyStateMessage="No medication schedules found."
        pageSize={12}
        exportFileName="medications"
      />
      <FormModal
        open={modalOpen}
        title={editRow ? 'Edit Medication' : 'Add Medication'}
        fields={medFields}
        values={formValues}
        loading={saving}
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Deactivate Medication"
        message={`Deactivate ${deleteRow?.name}?`}
        confirmLabel="Deactivate"
        danger
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Medication'}
        subtitle={`Patient #${selected?.patient_id} • ${selected?.dosage}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">Dosage</span><span className="text-[#f8fafc] font-semibold">{selected.dosage || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Frequency</span><span className="text-[#f8fafc]">{selected.frequency || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Start Date</span><span className="text-[#f8fafc]">{selected.start_date}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">End Date</span><span className="text-[#f8fafc]">{selected.end_date || 'Ongoing'}</span></div>
            </div>
            {selected.instructions && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Instructions</p>
                <p className="text-sm text-[#94a3b8]">{selected.instructions}</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 9. FOLLOW-UPS VIEW
// ==========================================
export const FollowupsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await listFollowUps({ page_size: 100 });
      setItems(Array.isArray(res.data) ? res.data : (res.data as any)?.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFollowups(); }, []);

  const followUpFields = editRow
    ? [
        { name: 'scheduled_date', label: 'Scheduled Date', placeholder: 'YYYY-MM-DD' },
        { name: 'reason', label: 'Reason', type: 'textarea' as const },
        { name: 'status', label: 'Status', type: 'select' as const, options: [
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: 'missed', label: 'Missed' },
        ]},
      ]
    : [
        { name: 'patient_id', label: 'Patient ID', type: 'number' as const, required: true },
        { name: 'scheduled_date', label: 'Scheduled Date', required: true, placeholder: 'YYYY-MM-DD' },
        { name: 'reason', label: 'Reason', type: 'textarea' as const },
        { name: 'source_appointment_id', label: 'Source Appointment ID', type: 'number' as const },
      ];

  const openCreate = () => { setEditRow(null); setFormValues({}); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditRow(row);
    setFormValues({
      scheduled_date: row.scheduled_date || '',
      reason: row.reason || '',
      status: row.status || 'scheduled',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editRow) {
        await updateFollowUp(editRow.id, formValues);
      } else {
        await createFollowUp({
          patient_id: Number(formValues.patient_id),
          scheduled_date: formValues.scheduled_date,
          reason: formValues.reason || undefined,
          source_appointment_id: formValues.source_appointment_id ? Number(formValues.source_appointment_id) : undefined,
        });
      }
      setModalOpen(false);
      fetchFollowups();
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const handleCancel = async () => {
    if (!deleteRow) return;
    setSaving(true);
    try {
      await updateFollowUp(deleteRow.id, { status: 'cancelled' });
      setDeleteRow(null);
      fetchFollowups();
    } catch { alert('Cancel failed'); }
    finally { setSaving(false); }
  };

  const handleReminder = async () => {
    setSending(true);
    try {
      await api.post('/follow-ups/reminders/send');
      alert('SMS and email reminders dispatched successfully!');
    } catch (err) { alert('Dispatch failed'); }
    finally { setSending(false); }
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-sky-500/10 text-sky-400',
    completed: 'bg-emerald-500/10 text-emerald-500',
    missed: 'bg-rose-500/10 text-rose-500',
    cancelled: 'bg-slate-500/10 text-slate-400',
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient_id', label: 'Patient', render: r => `Patient #${r.patient_id}` },
    { key: 'source_appointment_id', label: 'Source Appointment', render: r => r.source_appointment_id ? `Booking #${r.source_appointment_id}` : 'Direct' },
    { key: 'scheduled_date', label: 'Scheduled Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: r => (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[r.status] || 'bg-slate-500/10 text-slate-400'}`}>
        {r.status}
      </span>
    )},
    { key: 'reason', label: 'Reason', render: r => r.reason || 'Routine Checkup' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleReminder}
          disabled={sending}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Send size={14} /> {sending ? 'Dispatching...' : 'Run Reminder Scheduler'}
        </button>
      </div>
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        onAdd={openCreate}
        addLabel="Schedule Follow-Up"
        onEdit={openEdit}
        onDelete={setDeleteRow}
        searchPlaceholder="Search follow-ups by patient, status, date..."
        emptyStateMessage="No follow-up appointments found."
        pageSize={12}
        exportFileName="follow-ups"
      />
      <FormModal
        open={modalOpen}
        title={editRow ? 'Edit Follow-Up' : 'Schedule Follow-Up'}
        fields={followUpFields}
        values={formValues}
        loading={saving}
        onChange={(n, v) => setFormValues((f) => ({ ...f, [n]: v }))}
        onSubmit={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteRow}
        title="Cancel Follow-Up"
        message={`Cancel follow-up #${deleteRow?.id}?`}
        confirmLabel="Cancel"
        danger
        loading={saving}
        onConfirm={handleCancel}
        onCancel={() => setDeleteRow(null)}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Follow-Up #${selected?.id}`}
        subtitle={`Scheduled: ${selected?.scheduled_date}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">Patient</span><span className="text-[#f8fafc]">#{selected.patient_id}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Source Booking</span><span className="text-[#f8fafc]">{selected.source_appointment_id ? `#${selected.source_appointment_id}` : 'Direct'}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Scheduled</span><span className="text-[#f8fafc]">{selected.scheduled_date}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[selected.status] || 'bg-slate-500/10 text-slate-400'}`}>
                  {selected.status}
                </span>
              </div>
            </div>
            {selected.reason && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Reason</p>
                <p className="text-sm text-[#94a3b8]">{selected.reason}</p>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 10. VIDEO CONSULTATIONS VIEW
// ==========================================
export const VideoView: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-[#1f2937] p-12 rounded-2xl text-center text-[#64748b]">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-6">
        <Video size={32} />
      </div>
      <h3 className="font-semibold text-[#f8fafc] text-xl mb-3">Telehealth Integration</h3>
      <p className="text-sm max-w-md mx-auto text-[#94a3b8] leading-relaxed">
        Video consulting portals run inside patient-doctor mobile clients. Video links are generated dynamically 
        on appointment confirmation via your configured video provider (Agora/Jitsi/Twilio).
      </p>
    </div>
  );
};

// ==========================================
// 11. NOTIFICATIONS VIEW
// ==========================================
export const NotificationsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await listNotifications({ page_size: 100 });
        setItems(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
      finally { setLoading(false); }
    };
    fetchNotifs();
  }, []);

  const channelColors: Record<string, string> = {
    email: 'bg-blue-500/10 text-blue-400',
    sms: 'bg-purple-500/10 text-purple-400',
    push: 'bg-teal-500/10 text-teal-400',
    in_app: 'bg-amber-500/10 text-amber-400',
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'user_id', label: 'User', render: r => `User #${r.user_id}` },
    { key: 'channel', label: 'Channel', sortable: true, render: r => (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${channelColors[r.channel] || 'bg-slate-500/10 text-slate-400'}`}>
        {r.channel}
      </span>
    )},
    { key: 'event_type', label: 'Event Type', sortable: true, render: r => <span className="text-xs font-semibold text-[#94a3b8]">{r.event_type}</span> },
    { key: 'message', label: 'Message', render: r => <span className="truncate block max-w-[220px] text-xs">{r.message}</span> },
    { key: 'status', label: 'Status', sortable: true, render: r => (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' : r.status === 'failed' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
        {r.status}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search notifications by user, channel, event..."
        emptyStateMessage="No notification records found."
        pageSize={12}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Notification Details"
        subtitle={`Event: ${selected?.event_type}`}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">User ID</span><span className="text-[#f8fafc]">#{selected.user_id}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Channel</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${channelColors[selected.channel] || 'bg-slate-500/10 text-slate-400'}`}>{selected.channel}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Status</span><span className="text-[#f8fafc] uppercase font-semibold">{selected.status}</span></div>
            </div>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
              <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Message Body</p>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{selected.message}</p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 12. HEALTH METRICS VIEW
// ==========================================
export const HealthMetricsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVitals = async () => {
      setLoading(true);
      try {
        const res = await listVitals({ page_size: 100 });
        setItems(res.data.items || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchVitals();
  }, []);

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'patient_id', label: 'Patient', render: r => `Patient #${r.patient_id}` },
    { key: 'vital_type', label: 'Metric Type', sortable: true, render: r => (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider">{r.vital_type}</span>
    )},
    { key: 'value', label: 'Value', sortable: true, render: r => <span className="font-semibold text-[#f8fafc]">{r.value}</span> },
    { key: 'unit', label: 'Unit', render: r => <span className="text-[#64748b]">{r.unit || 'N/A'}</span> },
    { key: 'recorded_at', label: 'Recorded At', sortable: true, render: r => new Date(r.recorded_at).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search vitals by type, patient, value..."
        emptyStateMessage="No health metrics recorded."
        pageSize={12}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.vital_type || 'Health Metric'}
        subtitle={`Patient #${selected?.patient_id} • Recorded ${selected ? new Date(selected.recorded_at).toLocaleDateString() : ''}`}
        width="max-w-sm"
      >
        {selected && (
          <div className="space-y-5">
            <div className="text-center bg-[#0b0f19] p-8 rounded-2xl border border-[#1f2937]">
              <p className="text-6xl font-bold text-[#f8fafc]">{selected.value}</p>
              <p className="text-lg text-[#64748b] mt-2">{selected.unit || ''}</p>
              <p className="text-xs text-[#64748b] uppercase tracking-wider mt-4 font-bold">{selected.vital_type}</p>
            </div>
            <div className="text-sm text-center text-[#64748b]">
              Recorded at {new Date(selected.recorded_at).toLocaleString()}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 13. ANALYTICS & REPORTS VIEW
// ==========================================
export const AnalyticsReportsView: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/usage-reports?days=${days}`);
        setReport(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchUsage();
  }, [days]);

  const analyticsCards = report ? [
    { label: 'New Patients', value: report.new_patients, color: 'teal' as const, icon: User },
    { label: 'New Doctors', value: report.new_doctors, color: 'blue' as const, icon: Stethoscope },
    { label: 'Appointments Booked', value: report.appointments_booked, color: 'sky' as const, icon: CalendarClock },
    { label: 'Appointments Completed', value: report.appointments_completed, color: 'emerald' as const, icon: ClipboardList },
    { label: 'EHR Files Uploaded', value: report.records_uploaded, color: 'purple' as const, icon: FileText },
    { label: 'Prescriptions Issued', value: report.prescriptions_created, color: 'indigo' as const, icon: Pill },
    { label: 'Alerts Sent', value: report.notifications_sent, color: 'amber' as const, icon: Bell },
    { label: 'Follow-Ups Scheduled', value: report.followups_created || 0, color: 'teal' as const, icon: HeartHandshake },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-[#f8fafc]">Platform Analytics</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${days === d ? 'bg-teal-500 text-white' : 'bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:border-[#64748b]'}`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analyticsCards.map((card, i) => (
            <StatCard key={i} label={card.label} value={card.value} icon={card.icon} color={card.color} />
          ))}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 14. AUDIT LOGS VIEW
// ==========================================
export const AuditLogsView: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/audit-logs?page_size=100');
        setItems(res.data.items || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAudit();
  }, []);

  const actionColors = (action: string) => {
    if (action.includes('delete') || action.includes('reject')) return 'bg-rose-500/10 text-rose-500';
    if (action.includes('approve') || action.includes('create')) return 'bg-emerald-500/10 text-emerald-500';
    if (action.includes('update')) return 'bg-amber-500/10 text-amber-500';
    return 'bg-slate-500/10 text-slate-400';
  };

  const columns: Column<any>[] = [
    { key: 'id', label: 'ID', sortable: true, render: r => `#${r.id}` },
    { key: 'created_at', label: 'Timestamp', sortable: true, render: r => (
      <span className="text-xs text-[#64748b]">{new Date(r.created_at).toLocaleString()}</span>
    )},
    { key: 'action', label: 'Action', sortable: true, render: r => (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${actionColors(r.action)}`}>
        {r.action}
      </span>
    )},
    { key: 'resource', label: 'Resource', sortable: true, render: r => <span className="font-semibold text-[#f8fafc]">{r.resource || 'SYSTEM'}</span> },
    { key: 'ip_address', label: 'Client IP', render: r => <span className="font-mono text-xs text-[#64748b]">{r.ip_address || 'N/A'}</span> },
    { key: 'details', label: 'Details', render: r => <span className="text-xs text-[#64748b] truncate max-w-[180px] block">{r.details || 'N/A'}</span> },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={items}
        isLoading={loading}
        onRowClick={setSelected}
        searchPlaceholder="Search audit logs by action, resource, IP..."
        emptyStateMessage="No audit log entries found."
        pageSize={15}
      />
      <DetailDrawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Audit Event"
        subtitle={new Date(selected?.created_at || '').toLocaleString()}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937] space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">Action</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${actionColors(selected.action)}`}>{selected.action}</span>
              </div>
              <div className="flex justify-between"><span className="text-[#64748b]">Resource</span><span className="text-[#f8fafc] font-semibold">{selected.resource || 'SYSTEM'}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Client IP</span><span className="font-mono text-[#f8fafc]">{selected.ip_address || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-[#64748b]">Admin ID</span><span className="text-[#f8fafc]">{selected.admin_id ? `#${selected.admin_id}` : 'System'}</span></div>
            </div>
            {selected.details && (
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1f2937]">
                <p className="text-[10px] text-[#64748b] font-bold uppercase mb-2">Event Details</p>
                <pre className="text-xs text-[#94a3b8] whitespace-pre-wrap break-all">{selected.details}</pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

// ==========================================
// 15. ROLES & PERMISSIONS VIEW
// ==========================================
export const RolesPermissionsView: React.FC = () => {
  const roles = [
    { name: 'ADMIN', color: 'bg-red-500', permissions: ['READ_ALL', 'WRITE_ALL', 'DELETE_ALL', 'MANAGE_USERS', 'MANAGE_SETTINGS', 'VIEW_AUDIT_LOGS'] },
    { name: 'DOCTOR', color: 'bg-blue-500', permissions: ['READ_CLINICAL', 'WRITE_CLINICAL', 'MANAGE_APPOINTMENTS', 'VIEW_PATIENTS', 'WRITE_PRESCRIPTIONS'] },
    { name: 'PATIENT', color: 'bg-teal-500', permissions: ['READ_SELF', 'WRITE_SCHEDULING', 'VIEW_OWN_RECORDS', 'MANAGE_FAMILY'] },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.name} className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-3 h-3 rounded-full ${role.color}`} />
              <h3 className="font-bold text-[#f8fafc] text-sm uppercase tracking-wider">{role.name}</h3>
            </div>
            <div className="space-y-2">
              {role.permissions.map(perm => (
                <div key={perm} className="flex items-center gap-2 bg-[#0b0f19] px-3 py-2 rounded-lg border border-[#1f2937]">
                  <Check size={12} className="text-teal-500 shrink-0" />
                  <span className="font-mono text-xs text-[#94a3b8]">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key size={18} className="text-teal-400" />
          <h3 className="font-semibold text-[#f8fafc]">RBAC Authorization Architecture</h3>
        </div>
        <p className="text-sm text-[#94a3b8] leading-relaxed">
          Roles are immutable key-scoped boundaries enforced inside server route guards. 
          Role assignment is done via the <code className="bg-[#0b0f19] px-1 py-0.5 rounded text-teal-400 text-xs">User Management</code> panel. 
          Permission boundaries cannot be customized per-user — they are tied to the role definition at the API layer.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 16. SYSTEM SETTINGS VIEW
// ==========================================
export const SettingsView: React.FC = () => {
  const [apiVal, setApiVal] = useState(getApiUrl());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('admin_api_url', apiVal);
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-[#111827] border border-[#1f2937] p-6 rounded-2xl">
        <div className="flex items-center gap-3 border-b border-[#1f2937] pb-4 mb-6">
          <Settings size={18} className="text-teal-400" />
          <h3 className="font-semibold text-[#f8fafc]">System Configuration</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider block">API Gateway URL</label>
            <input
              type="text"
              className="w-full bg-[#0b0f19] border border-[#334155] rounded-lg py-3 px-4 text-[#f8fafc] text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
              value={apiVal}
              onChange={e => setApiVal(e.target.value)}
              placeholder="http://localhost:8000/api/v1"
            />
            <p className="text-xs text-[#64748b]">The base URL of your FastAPI backend. Changes will reload the portal.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saved}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg hover:opacity-95 transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {saved ? <><Check size={16} /> Saved! Reloading...</> : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
        <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mb-2">⚠ Admin Portal Info</p>
        <div className="space-y-1 text-sm text-[#94a3b8]">
          <p>Portal Version: <span className="text-[#f8fafc] font-mono">1.0.0-enterprise</span></p>
          <p>Current API URL: <span className="text-teal-400 font-mono text-xs">{getApiUrl()}</span></p>
        </div>
      </div>
    </div>
  );
};
