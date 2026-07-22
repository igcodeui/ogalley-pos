'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Users, Clock, X, Shield, Star, Crown, UserCircle, Plus, Trash2, Edit3, Save, Download, Calendar, FileSpreadsheet } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';

const ROLE_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  OWNER: { bg: 'bg-[#C48A3A]/10', text: 'text-[#C48A3A]', icon: Crown },
  ADMIN: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: Shield },
  MANAGER: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Star },
  CASHIER: { bg: 'bg-green-500/10', text: 'text-green-400', icon: UserCircle },
  INVENTORY: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: UserCog },
};

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY'] as const;

interface AttendanceRecord {
  employeeId: string;
  status: string;
  clockIn: string;
  hoursWorked: number | null;
}

interface SalesEntry {
  employeeId: string;
  totalSales: number;
}

interface AttHistoryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  dailyRate: number;
  commissionRate: number;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  status: string;
}
export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [salesMap, setSalesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [clockLoading, setClockLoading] = useState<string | null>(null);

  // Attendance history state
  const [showAttendance, setShowAttendance] = useState(false);
  const [attRecords, setAttRecords] = useState<AttHistoryRecord[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attFrom, setAttFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [attTo, setAttTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Form state
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'CASHIER', pin: '', hireDate: '', hourlyRate: '0', commissionRate: '0' });

  const fetchData = useCallback(async () => {
    try {
      const [empRes, attRes, dashRes] = await Promise.all([
        fetch('/api/employees').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()).catch(() => []),
        fetch('/api/dashboard').then(r => r.json()).catch(() => ({ employeeRanking: [] })),
      ]);
      setEmployees(empRes || []);
      const map: Record<string, AttendanceRecord> = {};
      for (const a of (attRes || [])) {
        if (a.status === 'ACTIVE') {
          map[a.employeeId] = a;
        }
      }
      setAttendance(map);
      const sm: Record<string, number> = {};
      for (const e of (dashRes?.employeeRanking || []) as SalesEntry[]) {
        sm[e.employeeId] = e.totalSales;
      }
      setSalesMap(sm);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAttHistory = async () => {
    setAttLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('from', attFrom);
      params.set('to', attTo);
      const res = await fetch(`/api/attendance?${params.toString()}`);
      const data = await res.json();
      setAttRecords(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setAttLoading(false); }
  };

  useEffect(() => {
    if (showAttendance) fetchAttHistory();
  }, [showAttendance, attFrom, attTo]);

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.set('from', attFrom);
    params.set('to', attTo);
    params.set('export', 'csv');
    window.open(`/api/attendance?${params.toString()}`, '_blank');
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', role: 'CASHIER', pin: '', hireDate: '', hourlyRate: '0', commissionRate: '0' });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };
  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role,
      pin: '',
      hireDate: emp.hireDate ? emp.hireDate.slice(0, 10) : '',
      hourlyRate: String(emp.hourlyRate),
      commissionRate: String(emp.commissionRate),
    });
    setEditId(emp.id);
    setShowForm(true);
  };
    const handleSave = async () => {
    if (!form.name.trim()) return;
    if (!editId && !form.pin.trim()) return;
    setSaving(true);
    try {
      const isEdit = editId !== null;
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role,
        hireDate: form.hireDate || undefined,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        commissionRate: parseFloat(form.commissionRate) || 0,
      };
      if (form.pin.trim()) payload.pin = form.pin.trim();
      if (isEdit) payload.id = editId;
      const res = await fetch('/api/employees', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editId, ...payload } : payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save employee');
        return;
      }
      setShowForm(false);
      resetForm();
      await fetchData();
    } catch (e) { alert('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('Failed to delete'); return; }
      setDeleteConfirm(null);
      await fetchData();
    } catch (e) { alert('Network error'); }
    finally { setSaving(false); }
  };

  const handleClock = async (empId: string, action: 'IN' | 'OUT') => {
    setClockLoading(empId);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Clock action failed');
        return;
      }
      await fetchData();
    } catch (e) { alert('Network error'); }
    finally { setClockLoading(null); }
  };

  if (loading) return <div className="p-4 lg:p-6 space-y-6">{[1,2,3].map(i=><div key={i} className="h-28 rounded-2xl animate-shimmer bg-white/[0.03]" />)}</div>;

  const activeCount = employees.filter(e => e.isActive).length;
  const onShiftCount = Object.keys(attendance).length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Employees</h3>
          <p className="text-xs text-[#888] mt-0.5">Manage staff, roles, and attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAttendance(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${showAttendance ? 'bg-white/[0.1] text-white border border-white/[0.1]' : 'bg-white/[0.05] text-[#888] hover:text-white border border-white/[0.06]'}`}>
            <Calendar size={16} /> Attendance History
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all active:scale-[0.98]">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff', value: employees.length, icon: <Users size={18} className="text-[#C48A3A]" /> },
          { label: 'Active', value: activeCount, icon: <UserCog size={18} className="text-green-400" /> },
          { label: 'On Shift', value: onShiftCount, icon: <Clock size={18} className="text-blue-400" /> },
          { label: 'Roles', value: [...new Set(employees.map(e => e.role))].length, icon: <Shield size={18} className="text-purple-400" /> },
        ].map(s => (
          <div key={s.label} className="premium-card p-4">
            <div className="flex items-center gap-2 mb-1"><span className="text-[#888] text-xs">{s.icon}</span><span className="text-xs text-[#888]">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map((emp, i) => {
          const style = ROLE_STYLES[emp.role] || ROLE_STYLES.CASHIER;
          const RoleIcon = style.icon;
          const isClockedIn = !!attendance[emp.id];
          const attRecord = attendance[emp.id];
          return (
            <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="premium-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C48A3A]/20 to-[#3B2A20]/50 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#C48A3A]">{emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{emp.name}</p>
                    <p className="text-xs text-[#888]">{emp.email}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                  <RoleIcon size={10} />{emp.role}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#888]">
                  <span>Phone</span><span className="text-white">{emp.phone || '\u2014'}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>Hire Date</span><span className="text-white">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '\u2014'}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>Daily Rate</span><span className="text-white">{emp.hourlyRate > 0 ? formatCurrency(emp.hourlyRate) + '/day' : '\u2014'}</span>
                </div>
                <div className="flex justify-between text-[#888]">
                  <span>Commission</span><span className="text-[#C48A3A]">{(emp.commissionRate * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-400 animate-pulse' : 'bg-[#555]'}`} />
                <span className="text-xs text-[#888]">
                  {isClockedIn ? `On Shift since ${new Date(attRecord.clockIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : 'Off Shift'}
                </span>
                <div className="flex-1" />
                <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg text-[#888] hover:text-white hover:bg-white/[0.06] transition-colors" title="Edit">
                  <Edit3 size={14} />
                </button>
                <button
                  disabled={clockLoading === emp.id}
                  onClick={() => handleClock(emp.id, isClockedIn ? 'OUT' : 'IN')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium disabled:opacity-50
                    ${isClockedIn
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                  {clockLoading === emp.id ? '...' : isClockedIn ? 'Clock Out' : 'Clock In'}
                </button>
                <button onClick={() => setDeleteConfirm(emp.id)} className="p-1.5 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Attendance History Section */}
      <AnimatePresence>
        {showAttendance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="premium-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[#C48A3A]" />
                  Attendance History
                </h4>
                <button onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C48A3A]/10 text-[#C48A3A] text-xs font-medium hover:bg-[#C48A3A]/20 transition-colors">
                  <Download size={13} /> Export CSV
                </button>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#888]">From:</label>
                  <input type="date" value={attFrom} onChange={e => setAttFrom(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C48A3A]/50" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#888]">To:</label>
                  <input type="date" value={attTo} onChange={e => setAttTo(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C48A3A]/50" />
                </div>
                <span className="text-xs text-[#555]">{attRecords.length} records</span>
              </div>

              {/* Table */}
              {attLoading ? (
                <div className="text-center py-8 text-xs text-[#555]">Loading...</div>
              ) : attRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#555]">No attendance records found for this date range.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#888] border-b border-white/[0.06]">
                        <th className="text-left py-2 pr-3 font-medium">Employee</th>
                        <th className="text-left py-2 pr-3 font-medium">Role</th>
                        <th className="text-left py-2 pr-3 font-medium">Date</th>
                        <th className="text-left py-2 pr-3 font-medium">Clock In</th>
                        <th className="text-left py-2 pr-3 font-medium">Clock Out</th>
                        <th className="text-left py-2 pr-3 font-medium">Hours</th>
                        <th className="text-right py-2 pr-3 font-medium">Daily Rate</th>
                        <th className="text-center py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attRecords.map((r, i) => {
                        const clockInTime = new Date(r.clockIn);
                        const clockOutTime = r.clockOut ? new Date(r.clockOut) : null;
                        return (
                          <tr key={r.id} className={`border-b border-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                            <td className="py-2.5 pr-3 text-white font-medium">{r.employeeName}</td>
                            <td className="py-2.5 pr-3 text-[#888]">{r.employeeRole}</td>
                            <td className="py-2.5 pr-3 text-[#888]">{clockInTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td className="py-2.5 pr-3 text-[#888]">{clockInTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</td>
                            <td className="py-2.5 pr-3 text-[#888]">{clockOutTime ? clockOutTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '\u2014'}</td>
                            <td className="py-2.5 pr-3 text-white">{r.hoursWorked != null ? r.hoursWorked.toFixed(1) + 'h' : '\u2014'}</td>
                            <td className="py-2.5 pr-3 text-right text-[#C48A3A] font-medium">{r.dailyRate > 0 ? formatCurrency(r.dailyRate) : '\u2014'}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.06] text-[#888]'}`}>
                                {r.status === 'ACTIVE' ? 'On Shift' : 'Completed'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Sales Performance Bars */}
      <div className="premium-card p-5">
        <h4 className="text-sm font-bold text-white mb-4">Today's Sales Performance</h4>
        <div className="space-y-3">
          {employees.filter(e => e.role === 'CASHIER' || e.role === 'MANAGER').map((emp, i) => {
            const realSales = salesMap[emp.id] || 0;
            const allSales = employees.filter(e => e.role === 'CASHIER' || e.role === 'MANAGER').map(e => salesMap[e.id] || 0);
            const maxSales = Math.max(...allSales, 1);
            const pct = Math.min(100, (realSales / maxSales) * 100);
            return (
              <div key={emp.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#888]">{emp.name}</span>
                  <span className="text-[#C48A3A] font-medium">{formatCurrency(realSales)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#C48A3A] to-[#D4A050]" />
                </div>
              </div>
            );
          })}
          {Object.keys(salesMap).length === 0 && (
            <p className="text-xs text-[#555] text-center py-4">No sales recorded today yet. Start processing orders on the POS to see performance here.</p>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => { setShowForm(false); resetForm(); }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">{editId ? 'Edit Employee' : 'Add New Employee'}</h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg text-[#888] hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@ogalley.ph"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+63 917 xxx xxxx"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Role *</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50">
                      {ROLES.map(r => <option key={r} value={r} className="bg-[#1E1E1E]">{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">PIN {editId ? '(leave blank to keep current)' : '*'}</label>
                    <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                      type="password" maxLength={6} placeholder={editId ? 'Enter new PIN' : '4-6 digit PIN'}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-[#C48A3A]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Hire Date</label>
                    <input value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))}
                      type="date"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" />
                  </div>
                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Daily Rate (₱)</label>
                    <input value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                      type="number" min="0" step="0.01"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Commission Rate (%)</label>
                  <input value={form.commissionRate} onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                    type="number" min="0" max="100" step="0.1"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[#C48A3A]/50" />
                </div>
                <button onClick={handleSave} disabled={saving || !form.name.trim() || (!editId && !form.pin.trim())}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C48A3A] to-[#A06E28] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#C48A3A]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : editId ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold text-white mb-2">Remove Employee</h3>
              <p className="text-sm text-[#888] mb-5">Are you sure? This will permanently delete this employee and all their attendance records. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-white text-sm font-medium hover:bg-white/[0.1] transition-all">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}