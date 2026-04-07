import React, { useEffect, useState } from 'react';
import { AlertCircle, X, MapPin } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: '', adminResponse: '' });
  const [filter, setFilter] = useState('All');
  const [viewImg, setViewImg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/issues').then(r => setIssues(r.data)).catch(() => {});
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openEdit = (issue) => {
    setSelected(issue);
    setForm({ status: issue.status, adminResponse: issue.adminResponse || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/issues/${selected._id}`, form);
      toast.success('Complaint updated');
      setSelected(null);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filter === 'All' ? issues : issues.filter(i => i.status === filter);
  const badge = (s) => s === 'Pending' ? 'badge-pending' : s === 'In Progress' ? 'badge-progress' : 'badge-resolved';
  const priorityBadge = (p) => p === 'High'
    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
    : p === 'Medium'
    ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'
    : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Complaints Management</h1>
        <p className="text-sm text-gray-500">{issues.length} total complaints</p>
      </div>

      <div className="flex gap-2">
        {['All', 'Pending', 'In Progress', 'Resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(issue => (
            <div key={issue._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{issue.student?.name}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-xs text-gray-500">{issue.student?.rollNumber}</span>
                    <span className={badge(issue.status)}>{issue.status}</span>
                    {issue.priority && <span className={priorityBadge(issue.priority)}>{issue.priority}</span>}
                  </div>
                  <p className="text-sm font-medium text-blue-700">{issue.category}</p>
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                  {issue.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={11} /><span>{issue.location}</span>
                    </div>
                  )}
                  {issue.photo && (
                    <button onClick={() => setViewImg(issue.photo)} className="mt-2 block text-left">
                      <img src={issue.photo} alt="complaint"
                        className="h-24 w-36 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                      <p className="text-xs text-blue-500 mt-1">Click to enlarge</p>
                    </button>
                  )}
                  {issue.adminResponse && (
                    <div className="mt-2 bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-green-700">Response: {issue.adminResponse}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</p>
                  <button onClick={() => openEdit(issue)} className="text-purple-600 text-xs font-medium hover:underline">Update</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Update Complaint</h2>
              <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-900">{selected.category}</p>
                {selected.priority && <span className={priorityBadge(selected.priority)}>{selected.priority}</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">{selected.description}</p>
              {selected.photo && (
                <button onClick={() => setViewImg(selected.photo)} className="mt-2 block w-full">
                  <img src={selected.photo} alt="complaint"
                    className="h-28 w-full object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                  <p className="text-xs text-blue-500 mt-1">Click to enlarge</p>
                </button>
              )}
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>
              <div>
                <label className="label">Resolution Message</label>
                <textarea className="input resize-none" rows={3} placeholder="Add response or resolution..."
                  value={form.adminResponse} onChange={e => setForm({ ...form, adminResponse: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewImg(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all">
            <X size={22} />
          </button>
          <img src={viewImg} alt="full view"
            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
