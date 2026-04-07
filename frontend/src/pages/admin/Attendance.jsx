import { useEffect, useState } from 'react';
import { TrendingUp, Home, LogOut } from 'lucide-react';
import api from '../../api/axios';

export default function AdminAttendance() {
  const [tab, setTab] = useState('live');
  const [loading, setLoading] = useState(true);

  // Live Status tab
  const [liveDate, setLiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveRecords, setLiveRecords] = useState([]);

  // History tab (movement-based)
  const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0]);
  const [histRecords, setHistRecords] = useState([]);

  // Weekend tab (kept for compat)
  const [weekend, setWeekend] = useState([]);

  const loadLive = (d) =>
    api.get(`/attendance/daily-unified?date=${d}`)
      .then(r => setLiveRecords(r.data.records || []))
      .catch(() => {});

  const loadHist = (d) =>
    api.get(`/attendance/daily-unified?date=${d}`)
      .then(r => setHistRecords(r.data.records || []))
      .catch(() => {});

  const loadWeekend = () =>
    api.get('/attendance/weekend')
      .then(r => setWeekend(r.data))
      .catch(() => {});

  useEffect(() => {
    Promise.all([loadLive(liveDate), loadHist(histDate), loadWeekend()])
      .finally(() => setLoading(false));
  }, []);

  const insideCount = liveRecords.filter(r => r.currentStatus === 'INSIDE').length;
  const outsideCount = liveRecords.filter(r => r.currentStatus === 'OUTSIDE').length;
  const insidePct = liveRecords.length > 0 ? Math.round((insideCount / liveRecords.length) * 100) : 0;

  const fmtDuration = (mins) => {
    if (!mins || mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Attendance Monitoring</h1>
        <p className="page-subtitle">Real-time movement-based attendance tracking</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'live', label: 'Live Status' },
          { id: 'history', label: 'Daily History' },
          { id: 'weekend', label: 'Weekend Records' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`filter-btn ${tab === t.id ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── LIVE STATUS TAB ── */}
      {tab === 'live' && (
        <>
          {/* Date picker */}
          <div className="card">
            <label className="label">Select Date</label>
            <input className="input max-w-xs" type="date" value={liveDate}
              onChange={e => { setLiveDate(e.target.value); loadLive(e.target.value); }} />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Inside Hostel', value: insideCount, from: 'from-green-400', to: 'to-emerald-500', icon: Home },
              { label: 'Outside Hostel', value: outsideCount, from: 'from-orange-400', to: 'to-red-500', icon: LogOut },
              { label: 'Total Students', value: liveRecords.length, from: 'from-blue-400', to: 'to-indigo-500', icon: TrendingUp },
            ].map(({ label, value, from, to, icon: Icon }) => (
              <div key={label} className="card text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Attendance rate */}
          {liveRecords.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Inside Rate</span>
                <span className={`text-sm font-bold ${insidePct >= 75 ? 'text-green-600' : 'text-red-500'}`}>{insidePct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-700 ${insidePct >= 75 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                  style={{ width: `${insidePct}%` }} />
              </div>
            </div>
          )}

          {/* Student table */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Student Movement Status</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Student', 'Roll No', 'Room', 'Status', 'Absent Duration', 'Confirmed'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {liveRecords.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No records for this date</td></tr>
                  ) : liveRecords.map(r => (
                    <tr key={r._id} className={`transition-colors ${r.currentStatus === 'OUTSIDE' ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-bold text-xs">{r.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.rollNumber || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.roomId?.roomNumber || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          r.currentStatus === 'ON_LEAVE'
                            ? 'bg-violet-100 text-violet-700 border-violet-200'
                            : r.currentStatus === 'INSIDE'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          {r.currentStatus === 'ON_LEAVE' ? '🏖' : r.currentStatus === 'INSIDE' ? <Home size={11} /> : <LogOut size={11} />}
                          {r.currentStatus === 'ON_LEAVE' ? 'ON LEAVE' : r.currentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{fmtDuration(r.totalAbsentMinutes)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.confirmedPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.confirmedPresent ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── DAILY HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          <div className="card">
            <label className="label">Select Date</label>
            <input className="input max-w-xs" type="date" value={histDate}
              onChange={e => { setHistDate(e.target.value); loadHist(e.target.value); }} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Inside', value: histRecords.filter(r => r.attendanceStatus === 'Present').length, from: 'from-green-400', to: 'to-emerald-500' },
              { label: 'Outside', value: histRecords.filter(r => r.attendanceStatus === 'Absent').length, from: 'from-red-400', to: 'to-rose-500' },
              { label: 'Total', value: histRecords.length, from: 'from-blue-400', to: 'to-indigo-500' },
            ].map(({ label, value, from, to }) => (
              <div key={label} className="card text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mx-auto mb-2`}>
                  <TrendingUp size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Daily Attendance Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Student', 'Roll No', 'Room', 'Status', 'Absent Duration'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {histRecords.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No records for this date</td></tr>
                  ) : histRecords.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-bold text-xs">{r.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.rollNumber || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{r.roomId?.roomNumber || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${r.attendanceStatus === 'Present' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.attendanceStatus === 'Present' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {r.attendanceStatus === 'Present' ? 'Inside' : 'Outside'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{fmtDuration(r.totalAbsentMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── WEEKEND TAB ── */}
      {tab === 'weekend' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Weekend Attendance Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Roll No', 'Date', 'Marked At'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {weekend.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400 text-sm">No weekend attendance records</td></tr>
                ) : weekend.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.student?.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{r.student?.rollNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{r.date}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
