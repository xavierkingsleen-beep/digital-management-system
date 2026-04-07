import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Building2 className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">HostelMS</h1>
            <p className="text-blue-200 text-xs">Digital Management System</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Secure & Digital Hostel Management
          </div>
          <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
            Digital Hostel Issue,<br />
            <span className="text-blue-300">Leave & Management</span> System
          </h2>
          <p className="text-blue-200 text-lg mb-12 max-w-xl mx-auto">
            A complete platform for managing hostel operations — complaints, leaves, attendance, fees, and more.
          </p>

          {/* Login Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Student Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all group">
              <div className="bg-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={28} />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Student Portal</h3>
              <p className="text-blue-200 text-sm mb-6">Access complaints, leave requests, attendance, fees and hostel info</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/student/login')}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Student Login <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/student/register')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-4 rounded-xl transition-all border border-white/20">
                  Register Now
                </button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all group">
              <div className="bg-purple-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={28} />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Admin Portal</h3>
              <p className="text-blue-200 text-sm mb-6">Manage students, rooms, complaints, attendance and hostel operations</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/admin/login')}
                  className="w-full bg-purple-500 hover:bg-purple-400 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                  Admin Login <ArrowRight size={16} />
                </button>
                <div className="text-blue-300 text-xs py-2.5">Hostel Warden Access Only</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-blue-300 text-sm py-6">
        © 2024 Digital Hostel Management System. All rights reserved.
      </footer>
    </div>
  );
}
