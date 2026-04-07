import { useEffect, useState } from 'react';
import { Users, Search, X, CheckCircle, XCircle, Clock, Smartphone, History } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [tab, setTab] = useState('approved');
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadApproved = () =>
    api.get('/students?status=APPROVED').then(r => setStudents(r.data))
      .catch(() => toast.error('Failed to load students'));

  const loadPending = () =>
    api.get('/students?status=PENDING').then(r => setPending(r.data))
      .catch(() => toast.error('Failed to load pending approvals'));

  const loadAuditLog = () =>
    api.get('/device/audit-log').then(r => setAuditLog(r.data))
      .catch(() => toast.error('Failed to load audit log'));

  useEffect(() => {
    Promise.all([loadApproved(), loadPending(), loadAuditLog()])
      .finally(() => setLoading(false));
  }, []);

  const resetDevice = async (id, name) => {
    if (!window.confirm(`Send device reset OTP to ${name}?`)) return;
    setResetting(id);
    try {
      const { data } = await api.post(`/device/reset-request/${id}`);
      toast.success(data.message);
      loadAuditLog();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setResetting(null);
    }
  };

  const approve = async (id) => {
    try {
      await api.patch(`/students/${id}/approve`);
      toast.success('Student approved');
      loadApproved(); loadPending();
    } catch { toast.error('Failed'); }
  };

  const reject = async (id) => {
    try {
      await api.patch(`/students/${id}/reject`);
      toast.success('Student rejected');
      loadPending();
    } catch { toast.error('Failed'); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">{students.length} approved students</p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-sm font-semibold">
            <Clock size={14} /> {pending.length} pending approval
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('approved')}
          className={`filter-btn ${tab === 'approved' ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
          Approved ({students.length})
        </button>
        <button onClick={() => setTab('pending')}
          className={`filter-btn flex items-center gap-2 ${tab === 'pending' ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
          {pending.length > 0 && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
          Pending Approval ({pending.length})
        </button>
        <button onClick={() => { setTab('audit'); loadAuditLog(); }}
          className={`filter-btn flex items-center gap-2 ${tab === 'audit' ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
          <History size={13} /> Device Audit Log
        </button>
      </div>

      {/* ── Pending Tab ── */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle size={40} className="text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pending approvals</p>
            <p className="text-gray-400 text-sm mt-1">All registrations have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(s => (
              <div key={s._id} className="card border border-amber-100 bg-amber-50/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-700 font-bold">{s.name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                        {s.rollNumber && <span>Roll: {s.rollNumber}</span>}
                        {s.department && <span>{s.department}</span>}
                        {s.year && <span>{s.year}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => approve(s._id)}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button onClick={() => reject(s._id)}
                      className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Approved Tab ── */}
      {tab === 'approved' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name, roll number or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Roll No', 'Dept', 'Year', 'Room', 'Fee Status', 'Action', 'Device'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-bold text-xs">{s.name[0]?.toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.rollNumber || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.department || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.year || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.roomId?.roomNumber || 'Not Assigned'}</td>
                        <td className="px-4 py-3">
                          <span className={s.feeStatus === 'Paid' ? 'badge-approved' : 'badge-pending'}>{s.feeStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(s)} className="text-blue-600 text-xs font-medium hover:underline">View</button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => resetDevice(s._id, s.name)}
                            disabled={resetting === s._id}
                            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50">
                            <Smartphone size={11} /> {resetting === s._id ? 'Sending...' : 'Reset Device'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === 'audit' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Device Reset Audit Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Action', 'By', 'Note', 'Date & Time'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLog.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No device reset actions yet</td></tr>
                ) : auditLog.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{log.student?.name}</p>
                      <p className="text-xs text-gray-400">{log.student?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        log.action === 'RESET_COMPLETE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : log.action === 'OTP_SENT' ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.resetBy?.name} <span className="text-xs text-gray-400">({log.resetBy?.role})</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.note}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Student Details</h2>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{selected.name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                ['Roll Number', selected.rollNumber],
                ['Register Number', selected.registerNumber],
                ['Phone', selected.phone],
                ['Parent Phone', selected.parentPhone],
                ['Blood Group', selected.bloodGroup],
                ['Department', selected.department],
                ['Year', selected.year],
                ['Room', selected.roomId?.roomNumber || 'Not Assigned'],
                ['Fee Status', selected.feeStatus],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{k}</span>
                  <span className="text-sm font-medium text-gray-900">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
