import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function getDeviceId() {
  let id = localStorage.getItem('hostelms_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
    localStorage.setItem('hostelms_device_id', id);
  }
  return id;
}

export default function DeviceReset() {
  const [form, setForm] = useState({ email: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.otp.length !== 6) return toast.error('OTP must be 6 digits');
    setLoading(true);
    try {
      // Clear old device id so a fresh one is generated for this device
      localStorage.removeItem('hostelms_device_id');
      const newDeviceId = getDeviceId();

      await api.post('/device/verify-otp', {
        email: form.email,
        otp: form.otp,
        newDeviceId,
      });
      toast.success('Device reset successful! You can now log in.');
      navigate('/student/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Device Reset</h2>
          <p className="text-gray-500 text-sm mt-1">Enter the OTP sent to your registered email</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
          <p className="text-amber-700 text-xs">Ask your admin to send a reset OTP to your email first.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Your Email Address</label>
            <input className="input" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">6-Digit OTP</label>
            <input className="input text-center text-2xl tracking-widest font-bold" type="text"
              placeholder="000000" maxLength={6}
              value={form.otp}
              onChange={e => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify & Reset Device'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/student/login" className="hover:text-gray-600">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
