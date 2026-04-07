import { useEffect, useState } from 'react';
import { CheckSquare, MapPin, Clock, TrendingUp, LogOut, Home } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentAttendance() {
  const [status, setStatus] = useState(null);   // today-status response
  const [history, setHistory] = useState([]);   // absence logs
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadStatus = () => api.get('/attendance/today-status').then(r => setStatus(r.data)).catch(() => {});
  const loadHistory = () => api.get('/attendance/absence-logs').then(r => setHistory(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([loadStatus(), loadHistory()]).finally(() => setPageLoading(false));
  }, []);

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Location access denied. Enable GPS and try again.'))
    );
  });

  const markPresent = async () => {
    setLoading(true);
    try {
      const coords = await getLocation();
      await api.post('/attendance/mark', coords);
      toast.success('Attendance confirmed!');
      loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed');
    } finally { setLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '—';

  if (pageLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const isOutside = status?.currentStatus === 'OUTSIDE';
  const isOnLeave = status?.currentStatus === 'ON_LEAVE';
  const totalAbsent = status?.totalAbsentMinutes || 0;
  const absHours = Math.floor(totalAbsent / 60);
  const absMins = totalAbsent % 60;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Your presence is tracked automatically via gate pass movement</p>
      </div>

      {/* ON LEAVE banner — shown instead of normal status */}
      {isOnLeave ? (
        <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r from-violet-500 to-purple-600">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80 mb-1">Current Status</p>
            <h2 className="text-2xl font-bold mb-1">ON LEAVE</h2>
            <p className="text-purple-100 text-sm">
              {status.leaveType} Leave — ends {fmtTime(status.leaveEnd)}
            </p>
            <p className="text-purple-200 text-xs mt-2">Attendance marking is not available during approved leave.</p>
          </div>
        </div>
      ) : (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${isOutside ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-600'}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-80 mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                {isOutside ? <LogOut size={22} /> : <Home size={22} />}
                <h2 className="text-2xl font-bold">{isOutside ? 'OUTSIDE Hostel' : 'INSIDE Hostel'}</h2>
              </div>
              <p className="text-sm opacity-80 mt-1">{new Date().toDateString()}</p>
              {isOutside && status?.openAbsence && (
                <p className="text-sm opacity-90 mt-1">Out since: {fmtTime(status.openAbsence.fromTime)}</p>
              )}
            </div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20">
              {isOutside ? <LogOut size={32} className="text-white" /> : <Home size={32} className="text-white" />}
            </div>
          </div>
        </div>
      )}
      {/* Today Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mx-auto mb-2">
            <Clock size={18} className="text-white" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {absHours > 0 ? `${absHours}h ${absMins}m` : `${absMins}m`}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Absent Today</p>
        </div>
        <div className="card text-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${status?.confirmedPresent ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-gray-300 to-gray-400'}`}>
            <CheckSquare size={18} className="text-white" />
          </div>
          <p className="text-xl font-bold text-gray-900">{status?.confirmedPresent ? 'Yes' : 'No'}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Confirmed</p>
        </div>
        <div className="card text-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${status?.windowOpen ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-gray-300 to-gray-400'}`}>
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-xl font-bold text-gray-900">{status?.windowOpen ? 'Open' : 'Closed'}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Window</p>
        </div>
      </div>

      {/* Manual Confirmation — hidden when on leave */}
      {!isOnLeave && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-1">Confirm Presence</h3>
          <p className="text-xs text-gray-500 mb-4">
            Optional — tap to confirm you are inside hostel. Requires GPS. Window: 6:00 AM – 10:00 PM.
          </p>
          {status?.confirmedPresent ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
              <CheckSquare size={16} /> Confirmed at {fmtTime(status.confirmedAt)}
            </div>
          ) : (
            <button onClick={markPresent} disabled={loading || !status?.windowOpen || isOutside}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <MapPin size={15} /> {loading ? 'Getting location...' : 'Mark Present (GPS)'}
            </button>
          )}
          {isOutside && <p className="text-xs text-orange-600 mt-2">You are currently outside — return first to confirm presence.</p>}
          {!status?.windowOpen && !isOutside && <p className="text-xs text-gray-400 mt-2">Window opens at 6:00 AM.</p>}
        </div>
      )}

      {/* Today's Absence Periods */}
      {status?.absenceLogs?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Absence Periods</h3>
          <div className="space-y-2">
            {status.absenceLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                  <LogOut size={14} className="text-red-500" />
                  <span className="text-sm text-red-700 font-medium">
                    {fmtTime(log.fromTime)} → {log.toTime ? fmtTime(log.toTime) : 'Still outside'}
                  </span>
                </div>
                {!log.toTime && (
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Absence History */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Absence History</h3>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No absence records — you have been inside all the time!</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map(log => (
              <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.date}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtTime(log.fromTime)} → {log.toTime ? fmtTime(log.toTime) : 'Still outside'}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${log.toTime ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                  {log.toTime ? 'Returned' : 'Outside'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
