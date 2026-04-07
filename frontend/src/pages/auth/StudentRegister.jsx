import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', registerNumber: '', phone: '', parentPhone: '', bloodGroup: '', department: '', year: '' });
  const [show, setShow] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.phone && !/^\d{10}$/.test(form.phone)) return toast.error('Phone number must be exactly 10 digits');
    if (form.parentPhone && !/^\d{10}$/.test(form.parentPhone)) return toast.error('Parent phone number must be exactly 10 digits');
    setLoading(true);
    try {
      await register(form);
      setRegistered(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 52 52" className="w-10 h-10">
              <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2" />
              <path fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27 l8 8 l16-16" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 text-sm mb-4">Your account has been created.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-medium">⏳ Waiting for Admin Approval</p>
            <p className="text-amber-700 text-xs mt-1">You can log in once the admin approves your account.</p>
          </div>
          <Link to="/student/login" className="btn-primary inline-block px-8 py-3">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Student Registration</h2>
          <p className="text-gray-500 text-sm mt-1">Create your hostel account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Enter your name" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Roll Number *</label>
              <input className="input" placeholder="21CS001" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} required />
            </div>
            <div>
              <label className="label">Register Number *</label>
              <input className="input" placeholder="711521104001" value={form.registerNumber} onChange={e => set('registerNumber', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label">Email Address *</label>
              <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="e.g. CSE, ECE, MECH" value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={form.year} onChange={e => set('year', e.target.value)}>
                <option value="">Select</option>
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Phone Number</label>
              <input className="input" placeholder="10-digit number" maxLength={10} value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
              {form.phone && form.phone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Must be exactly 10 digits</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Parent Phone Number</label>
              <input className="input" placeholder="10-digit number" maxLength={10} value={form.parentPhone}
                onChange={e => set('parentPhone', e.target.value.replace(/\D/g, ''))} />
              {form.parentPhone && form.parentPhone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Must be exactly 10 digits</p>
              )}
            </div>
            <div className="col-span-2">
              <label className="label">Blood Group</label>
              <select className="input" value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}>
                <option value="">Select blood group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Password *</label>
              <div className="relative">
                <input className="input pr-10" type={show ? 'text' : 'password'} placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/student/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-sm text-gray-400 mt-2">
          <Link to="/" className="hover:text-gray-600">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
