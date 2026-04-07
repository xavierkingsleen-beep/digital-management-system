import { useEffect, useState } from 'react';
import { Users, AlertCircle, Calendar, BedDouble, CreditCard, CheckSquare, KeyRound, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const safe = (p) => p.catch(() => ({ data: [] }));
    Promise.all([
      safe(api.get('/students')),
      safe(api.get('/issues')),
      safe(api.get('/leave')),
      safe(api.get('/rooms')),
      safe(api.get('/fees')),
      safe(api.get(`/attendance/daily?date=${today}`)),
      safe(api.get('/gatepass/out')),
    ]).then(([s, i, l, r, f, a, gp]) => {
      setStats({
        students: s.data.length,
        issues: i.data.filter(x => x.status === 'Pending').length,
        leaves: l.data.filter(x => x.status === 'Pending').length,
        rooms: r.data.length,
        fees: f.data.filter(x => x.status === 'Pending').length,
        present: (a.data.records || []).filter(x => x.attendanceStatus === 'Present').length,
        gatepassOut: gp.data.length,
      });
      setRecentIssues(i.data.slice(0, 5));
      setRecentLeaves(l.data.slice(0, 5));
    });
  }, []);

  if (!stats) return <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>;

  const cards = [
    { label: 'Total Students', value: stats.students, icon: Users, from: 'from-blue-500', to: 'to-indigo-500' },
    { label: 'Pending Complaints', value: stats.issues, icon: AlertCircle, from: 'from-orange-400', to: 'to-red-500' },
    { label: 'Pending Leaves', value: stats.leaves, icon: Calendar, from: 'from-amber-400', to: 'to-orange-500' },
    { label: 'Total Rooms', value: stats.rooms, icon: BedDouble, from: 'from-purple-500', to: 'to-violet-500' },
    { label: 'Pending Fees', value: stats.fees, icon: CreditCard, from: 'from-red-400', to: 'to-rose-500' },
    { label: 'Present Today', value: stats.present, icon: CheckSquare, from: 'from-green-400', to: 'to-emerald-500' },
    { label: 'Students Out', value: stats.gatepassOut, icon: KeyRound, from: 'from-cyan-400', to: 'to-blue-500' },
  ];

  const issueBadge = (s) => s === 'Pending' ? 'badge-pending' : s === 'In Progress' ? 'badge-progress' : 'badge-resolved';
  const leaveBadge = (s) => s === 'Pending' ? 'badge-pending' : s === 'Approved' ? 'badge-approved' : 'badge-rejected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-purple-200 text-sm font-medium mb-1">Admin Overview</p>
          <h1 className="text-2xl font-bold">Hostel Dashboard</h1>
          <p className="text-purple-200 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, from, to }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertCircle size={16} className="text-orange-500" />
            </div>
            <h2 className="font-semibold text-gray-900">Recent Complaints</h2>
          </div>
          {recentIssues.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No complaints</p>
          ) : (
            <div className="space-y-2">
              {recentIssues.map(i => (
                <div key={i._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-orange-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-700 font-bold text-xs">{i.student?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{i.student?.name}</p>
                      <p className="text-xs text-gray-500">{i.category}</p>
                    </div>
                  </div>
                  <span className={issueBadge(i.status)}>{i.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={16} className="text-blue-500" />
            </div>
            <h2 className="font-semibold text-gray-900">Recent Leave Requests</h2>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No leave requests</p>
          ) : (
            <div className="space-y-2">
              {recentLeaves.map(l => (
                <div key={l._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-xs">{l.student?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{l.student?.name}</p>
                      <p className="text-xs text-gray-500">{l.leaveType} • {new Date(l.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={leaveBadge(l.status)}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
