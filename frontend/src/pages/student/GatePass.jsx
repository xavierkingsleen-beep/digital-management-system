import { useEffect, useState } from 'react';
import { LogOut, Plus, X, CheckCircle, MapPin, Clock } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Pending:  { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400',              label: 'Pending Approval' },
  Approved: { color: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-500',                label: 'Approved — Ready to Exit' },
  Rejected: { color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500',                 label: 'Rejected' },
  Exited:   { color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500 animate-pulse', label: 'Currently Out' },
  Returned: { color: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500',               label: 'Returned' },
  Overdue:  { color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500 animate-pulse',   label: 'Overdue' },
};

export default function StudentGatePass() {
  const [passes, setPasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [form, setForm] = useState({ reason: '', fromTime: '', toTime: '' });

  const load = async () => {
    try { const { data } = await api.get('/gatepass/my'); setPasses(data); } catch {}
  };

  useEffect(() => { load(); }, []);

  const activePass = passes.find(p => ['Pending', 'Approved', 'Exited', 'Overdue'].includes(p.status));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(form.toTime) <= new Date(form.fromTime))
      return toast.error('Return time must be after exit time');
    setLoading(true);
    try {
      await api.post('/gatepass', form);
      toast.success('Gate pass requested successfully');
      setForm({ reason: '', fromTime: '', toTime: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Location access denied. Enable GPS and try again.'))
    );
  });

  const markExit = async (passId) => {
    setGpsLoading(true);
    try {
      const coords = await getLocation();
      await api.put(`/gatepass/${passId}/exit`, coords);
      toast.success('Exit marked successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed');
    } finally { setGpsLoading(false); }
  };

  const markReturn = async (passId) => {
    setGpsLoading(true);
    try {
      const coords = await getLocation();
      await api.put(`/gatepass/${passId}/return`, coords);
      toast.success('Return marked successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed');
    } finally { setGpsLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gate Pass</h1>
          <p className="text-sm text-gray-500">Request and track your hostel gate passes</p>
        </div>
        {!activePass && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Request Pass
          </button>
        )}
      </div>

      {/* Active pass action banners */}
      {activePass?.status === 'Approved' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2.5 rounded-xl"><CheckCircle size={22} className="text-blue-600" /></div>
            <div>
              <p className="font-bold text-gray-900">Gate pass approved</p>
              <p className="text-gray-500 text-sm">Planned: {fmt(activePass.fromTime)} → {fmt(activePass.toTime)}</p>
            </div>
          </div>
          <button onClick={() => markExit(activePass._id)} disabled={gpsLoading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <MapPin size={15} /> {gpsLoading ? 'Getting location...' : 'Mark Exit (GPS required)'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">You must be inside hostel campus to mark exit</p>
        </div>
      )}

      {(activePass?.status === 'Exited' || activePass?.status === 'Overdue') && (
        <div className={`rounded-2xl p-5 ${activePass.status === 'Overdue' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${activePass.status === 'Overdue' ? 'bg-red-100' : 'bg-orange-100'}`}>
              <LogOut size={22} className={activePass.status === 'Overdue' ? 'text-red-600' : 'text-orange-600'} />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {activePass.status === 'Overdue' ? 'You are OVERDUE — return immediately' : 'You are currently OUT of hostel'}
              </p>
              <p className="text-sm text-gray-600">Exited at {fmt(activePass.exitTime)}</p>
              <p className="text-sm text-gray-600">Expected back by {fmt(activePass.toTime)}</p>
            </div>
          </div>
          <button onClick={() => markReturn(activePass._id)} disabled={gpsLoading}
            className="btn-success w-full flex items-center justify-center gap-2">
            <MapPin size={15} /> {gpsLoading ? 'Getting location...' : 'Mark Return (GPS required)'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">You must be inside hostel campus to mark return</p>
        </div>
      )}

      {/* History */}
      {passes.length === 0 ? (
        <div className="card text-center py-14">
          <LogOut size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No gate passes yet</p>
          <p className="text-gray-400 text-sm mt-1">Request a gate pass to go out of hostel</p>
        </div>
      ) : (
        <div className="space-y-3">
          {passes.map(pass => {
            const cfg = STATUS_CONFIG[pass.status] || STATUS_CONFIG.Pending;
            return (
              <div key={pass._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      {pass.isLate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          Late Return
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-gray-900">{pass.reason}</p>

                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={10} /> Planned: {fmt(pass.fromTime)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> Expected back: {fmt(pass.toTime)}</span>
                      {pass.exitTime && <span className="text-orange-600 font-medium">Actual Exit: {fmt(pass.exitTime)}</span>}
                      {pass.returnTime && <span className="text-green-600 font-medium">Actual Return: {fmt(pass.returnTime)}</span>}
                    </div>

                    {pass.adminRemark && (
                      <div className={`mt-3 rounded-xl p-3 text-sm ${pass.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        <span className="font-medium">Admin: </span>{pass.adminRemark}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">{fmt(pass.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Request Gate Pass</h2>
                <p className="text-sm text-gray-500">Fill in your exit details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Reason for going out *</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="e.g. Medical appointment, family visit, shopping..."
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
              </div>
              <div>
                <label className="label">Planned Exit Time *</label>
                <input className="input" type="datetime-local"
                  value={form.fromTime} onChange={e => setForm({ ...form, fromTime: e.target.value })} required />
              </div>
              <div>
                <label className="label">Expected Return Time *</label>
                <input className="input" type="datetime-local"
                  value={form.toTime} onChange={e => setForm({ ...form, toTime: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
