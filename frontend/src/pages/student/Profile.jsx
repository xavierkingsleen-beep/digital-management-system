import { useEffect, useState } from 'react';
import { User, Mail, Phone, Hash, BookOpen, BedDouble, Droplets, Pencil, X, Check } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', parentPhone: '', bloodGroup: '', department: '', year: '' });

  const load = () => api.get('/auth/me').then(r => setProfile(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const openEdit = () => {
    setEditForm({
      phone: profile.phone || '',
      parentPhone: profile.parentPhone || '',
      bloodGroup: profile.bloodGroup || '',
      department: profile.department || '',
      year: profile.year || '',
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editForm.phone && !/^\d{10}$/.test(editForm.phone))
      return toast.error('Phone must be exactly 10 digits');
    if (editForm.parentPhone && !/^\d{10}$/.test(editForm.parentPhone))
      return toast.error('Parent phone must be exactly 10 digits');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', editForm);
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const fields = [
    { label: 'Full Name', value: profile.name, icon: User, color: 'bg-blue-50 text-blue-600' },
    { label: 'Email', value: profile.email, icon: Mail, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Phone', value: profile.phone || 'Not set', icon: Phone, color: 'bg-green-50 text-green-600' },
    { label: 'Parent Phone', value: profile.parentPhone || 'Not set', icon: Phone, color: 'bg-teal-50 text-teal-600' },
    { label: 'Blood Group', value: profile.bloodGroup || 'Not set', icon: Droplets, color: 'bg-red-50 text-red-500' },
    { label: 'Roll Number', value: profile.rollNumber || 'N/A', icon: Hash, color: 'bg-purple-50 text-purple-600' },
    { label: 'Register Number', value: profile.registerNumber || 'N/A', icon: Hash, color: 'bg-violet-50 text-violet-600' },
    { label: 'Department', value: profile.department || 'N/A', icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
    { label: 'Year', value: profile.year || 'N/A', icon: BookOpen, color: 'bg-orange-50 text-orange-600' },
    { label: 'Room', value: profile.roomId?.roomNumber || 'Not Assigned', icon: BedDouble, color: 'bg-cyan-50 text-cyan-600' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your hostel account details</p>
        </div>
        {!editing && (
          <button onClick={openEdit} className="btn-secondary flex items-center gap-2 text-sm">
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      {/* Avatar Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
            <span className="text-white font-bold text-2xl">{profile.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-blue-200 text-sm">{profile.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mt-1.5">Student</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Edit Profile</h3>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="10-digit number" maxLength={10}
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })} />
              {editForm.phone && editForm.phone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
              )}
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input className="input" placeholder="10-digit number" maxLength={10}
                value={editForm.parentPhone}
                onChange={e => setEditForm({ ...editForm, parentPhone: e.target.value.replace(/\D/g, '') })} />
              {editForm.parentPhone && editForm.parentPhone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1">Must be 10 digits</p>
              )}
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select className="input" value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" placeholder="e.g. CSE, ECE" value={editForm.department}
                onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}>
                <option value="">Select</option>
                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? 'Saving...' : <><Check size={15} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Grid */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee Status */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Fee Status</h3>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${profile.feeStatus === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          <div className={`w-2 h-2 rounded-full ${profile.feeStatus === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`} />
          {profile.feeStatus}
        </div>
      </div>
    </div>
  );
}
