import { useEffect, useState } from 'react';
import { Calendar, Plus, X, Clock, Phone } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentLeave() {
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveType: 'Regular', startDate: '', endDate: '', reason: '', parentContact: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/leave/my'); setLeaves(data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.endDate && form.startDate && new Date(form.endDate) < new Date(form.startDate))
      return toast.error('End date cannot be before start date');
    if (!/^\d{10}$/.test(form.parentContact))
      return toast.error('Parent contact must be exactly 10 digits');
    setLoading(true);
    try {
      await api.post('/leave', form);
      toast.success('Leave request submitted');
      setForm({ leaveType: 'Regular', startDate: '', endDate: '', reason: '', parentContact: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const statusConfig = {
    Pending:  { cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    Approved: { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    Rejected: { cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">Apply and track your leave requests</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Apply for Leave</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in your leave details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Leave Type</label>
                <select className="input" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
                  <option value="Regular">Regular Leave</option>
                  <option value="Weekend">Weekend Leave (Sat/Sun)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input className="input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Reason *</label>
                <textarea className="input resize-none" rows={3} placeholder="Reason for leave..."
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
              </div>
              <div>
                <label className="label">Parent Contact Number *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input pl-8" type="tel" placeholder="10-digit number" maxLength={10}
                    value={form.parentContact}
                    onChange={e => setForm({ ...form, parentContact: e.target.value.replace(/\D/g, '') })}
                    required />
                </div>
                {form.parentContact && form.parentContact.length !== 10 && (
                  <p className="text-xs text-red-500 mt-1">Must be exactly 10 digits</p>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave List */}
      {leaves.length === 0 ? (
        <div className="card text-center py-14">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-blue-400" />
          </div>
          <p className="text-gray-600 font-semibold">No leave requests yet</p>
          <p className="text-gray-400 text-sm mt-1">Tap "Apply Leave" to submit a request</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => {
            const cfg = statusConfig[leave.status] || statusConfig.Pending;
            return (
              <div key={leave._id} className="card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">{leave.leaveType} Leave</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{leave.reason}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Clock size={11} />
                        {new Date(leave.startDate).toLocaleDateString()} → {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Phone size={11} />
                        {leave.parentContact}
                      </span>
                    </div>
                    {leave.adminReason && (
                      <div className={`mt-3 rounded-xl p-3 border ${leave.status === 'Rejected' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-xs font-semibold mb-1 ${leave.status === 'Rejected' ? 'text-red-700' : 'text-green-700'}`}>
                          Admin {leave.status === 'Rejected' ? 'Rejection' : 'Approval'} Reason:
                        </p>
                        <p className={`text-sm ${leave.status === 'Rejected' ? 'text-red-800' : 'text-green-800'}`}>{leave.adminReason}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{new Date(leave.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
