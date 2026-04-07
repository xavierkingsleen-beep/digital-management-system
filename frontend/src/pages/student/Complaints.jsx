import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Plus, X, MapPin, Image, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Water Problem', 'Electricity Issue', 'Room Maintenance', 'Internet Issue',
  'Ragging', 'Play Equipment', 'Tables/Chairs Broke', 'Working Staff', 'Hostel Student', 'Other',
];

const PRIORITY_STYLES = {
  Low:    'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  High:   'bg-red-100 text-red-700 border-red-200',
};

const STATUS_BADGE = {
  Pending:     'badge-pending',
  'In Progress': 'badge-progress',
  Resolved:    'badge-resolved',
};

export default function StudentComplaints() {
  const [issues, setIssues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);   // image preview URL
  const [photoFile, setPhotoFile] = useState(null);
  const [viewImg, setViewImg] = useState(null);   // full-screen image view
  const fileRef = useRef();

  const [form, setForm] = useState({
    category: '', description: '', location: '', priority: 'Medium',
  });

  const load = async () => {
    try { const { data } = await api.get('/issues/my'); setIssues(data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resetForm = () => {
    setForm({ category: '', description: '', location: '', priority: 'Medium' });
    removePhoto();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.description) return toast.error('Category and description are required');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('location', form.location);
      fd.append('priority', form.priority);
      if (photoFile) fd.append('photo', photoFile);

      await api.post('/issues', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint raised successfully');
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-500">Raise and track hostel complaints</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Raise Complaint
        </button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">New Complaint</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="label">Category *</label>
                <div className="relative">
                  <select className="input appearance-none pr-8"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Location + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Location / Room No.</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input pl-8" placeholder="e.g. Room 204, Corridor B"
                      value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button key={p} type="button"
                        onClick={() => setForm({ ...form, priority: p })}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${form.priority === p ? PRIORITY_STYLES[p] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description *</label>
                <textarea className="input resize-none" rows={4}
                  placeholder="Describe the issue in detail..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="label">Attach Photo (optional)</label>
                {preview ? (
                  <div className="relative inline-block">
                    <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={removePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                    <Image size={24} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                    <p className="text-sm text-gray-400 group-hover:text-blue-500">Click to upload image</p>
                    <p className="text-xs text-gray-300">JPG, PNG, WEBP — max 5MB</p>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                  className="hidden" onChange={handlePhoto} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complaint List ── */}
      {issues.length === 0 ? (
        <div className="card text-center py-14">
          <AlertCircle size={44} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No complaints raised yet</p>
          <p className="text-gray-400 text-sm mt-1">Tap "Raise Complaint" to report an issue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div key={issue._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 text-sm">{issue.category}</span>
                    <span className={STATUS_BADGE[issue.status]}>{issue.status}</span>
                    {issue.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_STYLES[issue.priority]}`}>
                        {issue.priority}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {issue.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                      <MapPin size={11} />
                      <span>{issue.location}</span>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>

                  {/* Photo thumbnail */}
                  {issue.photo && (
                    <button onClick={() => setViewImg(issue.photo)}
                      className="mt-3 block">
                      <img src={issue.photo} alt="complaint"
                        className="h-24 w-36 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                      <p className="text-xs text-blue-500 mt-1">Click to enlarge</p>
                    </button>
                  )}

                  {/* Admin response */}
                  {issue.adminResponse && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Admin Response</p>
                      <p className="text-sm text-blue-800">{issue.adminResponse}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Full-screen image viewer ── */}
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
