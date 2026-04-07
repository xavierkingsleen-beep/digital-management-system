import { useEffect, useState } from 'react';
import { LogOut, X, Users, Clock, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Pending:  { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  Approved: { color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500' },
  Rejected: { color: 'bg-red-100 text-red-800',       dot: 'bg-red-500' },
  Exited:   { color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500 animate-pulse' },
  Returned: { color: 'bg-green-100 text-green-800',   dot: 'bg-green-500' },
  Overdue:  { color: 'bg-red-100 text-red-800',       dot: 'bg-red-500 animate-pulse' },
};

export default function AdminGatePass() {
  const [passes, setPasses] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'Approved', adminRemark: '' });
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [allRes, overdueRes] = await Promise.all([
        api.get('/gatepass'),
        api.get('/gatepass/overdue'),
      ]);
      setPasses(allRes.data);
      setOverdue(overdueRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (e) => {
    e.preventDefault();
    if (reviewForm.status === 'Rejected' && !reviewForm.adminRemark.trim())
      return toast.error('Rejection reason is required');
    try {
      await api.put(`/gatepass/${selected._id}/review`, reviewForm);
      toast.success(`Gate pass ${reviewForm.status.toLowerCase()}`);
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const filtered = filter === 'All' ? passes : passes.filter(p => p.status === filter);

  const counts = {
    Pending: passes.filter(p => p.status === 'Pending').length,
    Exited:  passes.filter(p => p.status === 'Exited').length,
    Overdue: passes.filter(p => p.status === 'Overdue').length,
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gate Pass Management</h1>
        <p className="text-sm text-gray-500">Review requests and monitor student movement</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: counts.Pending, from: 'from-amber-400', to: 'to-orange-500' },
          { label: 'Currently Out', value: counts.Exited, from: 'from-orange-400', to: 'to-red-400' },
          { label: 'Overdue', value: counts.Overdue, from: 'from-red-500', to: 'to-rose-600' },
        ].map(({ label, value, from, to }) => (
          <div key={label} className="card text-center">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mx-auto mb-2`}>
              <AlertTriangle size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Passes' },
          { id: 'overdue', label: `Overdue Students (${counts.Overdue})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`filter-btn ${tab === t.id ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overdue Tab ── */}
      {tab === 'overdue' && (
        <div className="space-y-3">
          {overdue.length === 0 ? (
            <div className="card text-center py-10">
              <Users size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No overdue students</p>
            </div>
          ) : overdue.map(pass => (
            <div key={pass._id} className={`card border ${pass.status === 'Overdue' ? 'border-red-200 bg-red-50/40' : 'border-orange-200 bg-orange-50/40'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pass.status === 'Overdue' ? 'bg-red-100' : 'bg-orange-100'}`}>
                    <span className={`font-bold ${pass.status === 'Overdue' ? 'text-red-700' : 'text-orange-700'}`}>
                      {pass.student?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pass.student?.name}</p>
                    <p className="text-xs text-gray-500">{pass.student?.rollNumber} • {pass.student?.phone || 'No phone'}</p>
                    <p className="text-xs text-orange-700 mt-0.5">Exit: {fmt(pass.exitTime)}</p>
                    <p className="text-xs text-red-700 font-medium">Expected back: {fmt(pass.toTime)}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[pass.status]?.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[pass.status]?.dot}`} />
                  {pass.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── All Passes Tab ── */}
      {tab === 'all' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Approved', 'Exited', 'Overdue', 'Returned', 'Rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`filter-btn text-xs ${filter === f ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card text-center py-10">
                <LogOut size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No gate passes found</p>
              </div>
            ) : filtered.map(pass => {
              const cfg = STATUS_CONFIG[pass.status] || STATUS_CONFIG.Pending;
              return (
                <div key={pass._id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{pass.student?.name}</span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-xs text-gray-500">{pass.student?.rollNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {pass.status}
                        </span>
                        {pass.isLate && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            Late Return
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700">{pass.reason}</p>

                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                        <span><Clock size={11} className="inline mr-1" />Planned: {fmt(pass.fromTime)} → {fmt(pass.toTime)}</span>
                        {pass.exitTime && <span className="text-orange-600">Exited: {fmt(pass.exitTime)}</span>}
                        {pass.returnTime && <span className="text-green-600">Returned: {fmt(pass.returnTime)}</span>}
                      </div>

                      {pass.adminRemark && (
                        <p className="text-xs text-gray-500 mt-1 italic">Remark: {pass.adminRemark}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <p className="text-xs text-gray-400">{fmt(pass.createdAt)}</p>
                      {pass.status === 'Pending' && (
                        <button onClick={() => { setSelected(pass); setReviewForm({ status: 'Approved', adminRemark: '' }); }}
                          className="text-purple-600 text-xs font-medium hover:underline whitespace-nowrap">
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Review Gate Pass</h2>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1">
              <p className="font-semibold text-gray-900">{selected.student?.name}</p>
              <p className="text-sm text-gray-600">{selected.reason}</p>
              <p className="text-xs text-gray-400">Exit: {fmt(selected.fromTime)} → Return: {fmt(selected.toTime)}</p>
            </div>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="label">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Approved', 'Rejected'].map(s => (
                    <label key={s} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${reviewForm.status === s ? (s === 'Approved' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="decision" value={s} checked={reviewForm.status === s}
                        onChange={() => setReviewForm({ ...reviewForm, status: s })} className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${reviewForm.status === s ? (s === 'Approved' ? 'border-green-500' : 'border-red-500') : 'border-gray-300'}`}>
                        {reviewForm.status === s && <div className={`w-2 h-2 rounded-full ${s === 'Approved' ? 'bg-green-500' : 'bg-red-500'}`} />}
                      </div>
                      <span className={`text-sm font-medium ${reviewForm.status === s ? (s === 'Approved' ? 'text-green-700' : 'text-red-700') : 'text-gray-600'}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Remark {reviewForm.status === 'Rejected' && <span className="text-red-500">*</span>}</label>
                <textarea className="input resize-none" rows={3}
                  placeholder={reviewForm.status === 'Rejected' ? 'Reason for rejection (required)...' : 'Optional approval note...'}
                  value={reviewForm.adminRemark} onChange={e => setReviewForm({ ...reviewForm, adminRemark: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className={`flex-1 ${reviewForm.status === 'Approved' ? 'btn-success' : 'btn-danger'}`}>
                  {reviewForm.status === 'Approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
