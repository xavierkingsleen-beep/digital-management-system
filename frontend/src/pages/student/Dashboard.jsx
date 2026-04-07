import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, CreditCard, BedDouble, Bell, ArrowRight, TrendingUp, CheckSquare, KeyRound } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ issues: 0, leaves: 0, fees: [], announcements: [], attendance: 0 });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [issuesRes, leavesRes, feesRes, annRes, meRes, attRes] = await Promise.all([
          api.get('/issues/my'),
          api.get('/leave/my'),
          api.get('/fees/my'),
          api.get('/announcements'),
          api.get('/auth/me'),
          api.get('/attendance/my'),
        ]);
        const att = attRes.data || [];
        const present = att.filter(r => r.status === 'Present').length;
        const pct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;
        setStats({
          issues: issuesRes.data.length,
          leaves: leavesRes.data.length,
          fees: feesRes.data,
          announcements: annRes.data.slice(0, 4),
          attendance: pct,
        });
        setProfile(meRes.data);
      } catch {}
    };
    load();
  }, []);

  const pendingFee = stats.fees.find(f => f.status === 'Pending');

  const cards = [
    { label: 'My Complaints', value: stats.issues, icon: AlertCircle, from: 'from-orange-400', to: 'to-red-500', path: '/student/complaints' },
    { label: 'Leave Requests', value: stats.leaves, icon: Calendar, from: 'from-blue-400', to: 'to-indigo-500', path: '/student/leave' },
    { label: 'Attendance', value: `${stats.attendance}%`, icon: CheckSquare, from: 'from-green-400', to: 'to-emerald-500', path: '/student/attendance' },
    { label: 'Fee Status', value: pendingFee ? 'Pending' : 'Paid', icon: CreditCard, from: pendingFee ? 'from-red-400' : 'from-green-400', to: pendingFee ? 'to-rose-500' : 'to-teal-500', path: '/student/fees' },
    { label: 'My Room', value: profile?.roomId?.roomNumber || 'N/A', icon: BedDouble, from: 'from-purple-400', to: 'to-violet-500', path: '/student/room' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Good day 👋</p>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-blue-200 text-sm mt-1.5 flex flex-wrap gap-3">
            {profile?.rollNumber && <span className="bg-white/10 px-2 py-0.5 rounded-lg">{profile.rollNumber}</span>}
            {profile?.department && <span className="bg-white/10 px-2 py-0.5 rounded-lg">{profile.department}</span>}
            {profile?.year && <span className="bg-white/10 px-2 py-0.5 rounded-lg">{profile.year}</span>}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, from, to, path }) => (
          <button key={label} onClick={() => navigate(path)}
            className="group relative overflow-hidden rounded-2xl p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white border border-gray-100">
            <div className={`absolute inset-0 bg-gradient-to-br ${from} ${to} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              View <ArrowRight size={11} />
            </div>
          </button>
        ))}
      </div>

      {/* Attendance Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Attendance Overview</h2>
          </div>
          <span className={`text-sm font-bold ${stats.attendance >= 75 ? 'text-green-600' : 'text-red-500'}`}>{stats.attendance}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${stats.attendance >= 75 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
            style={{ width: `${stats.attendance}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{stats.attendance >= 75 ? 'Good standing — keep it up!' : 'Below 75% — attendance needs improvement'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Bell size={16} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Announcements</h2>
          </div>
          {stats.announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {stats.announcements.map(a => (
                <div key={a._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.priority === 'High' ? 'bg-red-500' : a.priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <KeyRound size={16} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Raise Complaint', path: '/student/complaints', from: 'from-orange-500', to: 'to-red-500', icon: AlertCircle },
              { label: 'Apply Leave', path: '/student/leave', from: 'from-blue-500', to: 'to-indigo-500', icon: Calendar },
              { label: 'Attendance', path: '/student/attendance', from: 'from-green-500', to: 'to-emerald-500', icon: CheckSquare },
              { label: 'Pay Fees', path: '/student/fees', from: 'from-purple-500', to: 'to-violet-500', icon: CreditCard },
            ].map(({ label, path, from, to, icon: Icon }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`bg-gradient-to-br ${from} ${to} text-white text-sm font-medium py-4 px-4 rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-sm flex items-center gap-2`}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
