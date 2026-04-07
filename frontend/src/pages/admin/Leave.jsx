import { useEffect, useState } from 'react';
import { Calendar, X, Clock, Phone } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminLeave() {
  const [leaves, setLeaves] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', adminReason: '' });
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/leave').then(r => setLeaves(r.data)).catch(() => {});
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openEdit = (l) => { setSelected(l); setForm({ status: l.status, adminReason: l.adminReason || '' }); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (form.status === 'Rejected' && !form.adminReason.trim())
      return toast.error('Rejection reason is required');
    try {
      await api.put(`/leave/${selected._id}`, form);
      toast.success('Leave request updated');
      setSelected(null);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);

  const statusConfig = {
    Pending:  { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    Approved: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    Rejected: { cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  };

  const counts = { All: leaves.length, Pending: leaves.filter(l => l.status === 'Pending').length, Approved: leaves.filter(l => l.status === 'Approved').length, Rejected: leaves.filter(l => l.status === 'Rejected').length };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Leave Requests</h1>
        <p className="page-subtitle">{leaves.length} total requests</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            {f} <span className="ml-1 text-xs opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-blue-400" />
          </div>
          <p className="text-gray-600 font-semibold">No leave requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => {
            const cfg = statusConfig[l.status] || statusConfig.Pending;
            return (
              <div key={l._id} className="card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-bold text-xs">{l.student?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{l.student?.name}</span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-xs text-gray-500">{l.student?.rollNumber}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {l.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">{l.leaveType} Leave</p>
                    <p className="text-sm text-gray-600 mb-2">{l.reason}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Clock size={11} />
                        {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Phone size={11} /> {l.parentContact}
                      </span>
                    </div>
                    {l.adminReason && (
                      <div className={`mt-2 rounded-xl p-2.5 border text-xs ${l.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        Admin: {l.adminReason}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString()}</p>
                    {l.status === 'Pending' && (
                      <button onClick={() => openEdit(l)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all">
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Review Leave Request</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"><X size={20} /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-gray-900">{selected.student?.name} — {selected.leaveType} Leave</p>
                <p className="text-sm text-gray-600 mt-1">{selected.reason}</p>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(selected.startDate).toLocaleDateString()} → {new Date(selected.endDate).toLocaleDateString()}
                </p>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="label">Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Pending', 'Approved', 'Rejected'].map(s => (
                      <label key={s} className={`flex items-center justify-center gap-2 p-2.5 border-2 rounded-xl cursor-pointer transition-all text-sm font-medium ${
                        form.status === s
                          ? s === 'Approved' ? 'border-green-500 bg-green-50 text-green-700'
                          : s === 'Rejected' ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                        <input type="radio" name="decision" value={s} checked={form.status === s}
                          onChange={() => setForm({ ...form, status: s })} className="hidden" />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Message {form.status === 'Rejected' && <span className="text-red-500 normal-case">*required</span>}</label>
                  <textarea className="input resize-none" rows={3}
                    placeholder={form.status === 'Rejected' ? 'Rejection reason (required)...' : 'Optional message...'}
                    value={form.adminReason} onChange={e => setForm({ ...form, adminReason: e.target.value })} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className={`flex-1 ${form.status === 'Approved' ? 'btn-success' : form.status === 'Rejected' ? 'btn-danger' : 'btn-primary'}`}>
                    {form.status === 'Approved' ? 'Approve' : form.status === 'Rejected' ? 'Reject' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
