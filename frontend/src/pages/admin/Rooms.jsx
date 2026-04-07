import React, { useEffect, useState } from 'react';
import { BedDouble, Plus, X, UserPlus, UserMinus } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [assignRoom, setAssignRoom] = useState(null);
  const [form, setForm] = useState({ roomNumber: '', capacity: '', floor: '', type: 'Standard' });
  const [studentId, setStudentId] = useState('');

  const load = () => Promise.all([api.get('/rooms'), api.get('/students')]).then(([r, s]) => { setRooms(r.data); setStudents(s.data); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', { ...form, capacity: Number(form.capacity) });
      toast.success('Room created');
      setShowCreate(false);
      setForm({ roomNumber: '', capacity: '', floor: '', type: 'Standard' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAssign = async () => {
    if (!studentId) return toast.error('Select a student');
    try {
      await api.put(`/rooms/${assignRoom._id}/assign`, { studentId });
      toast.success('Student assigned');
      setAssignRoom(null);
      setStudentId('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRemove = async (roomId, sId) => {
    try {
      await api.put(`/rooms/${roomId}/remove`, { studentId: sId });
      toast.success('Student removed');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${id}`); toast.success('Room deleted'); load(); } catch { toast.error('Failed'); }
  };

  const unassigned = students.filter(s => !s.roomId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Room Management</h1>
          <p className="text-sm text-gray-500">{rooms.length} rooms</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => {
          const pct = Math.round((room.students.length / room.capacity) * 100);
          return (
            <div key={room._id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 p-2 rounded-xl"><BedDouble size={18} className="text-purple-600" /></div>
                  <div>
                    <p className="font-bold text-gray-900">Room {room.roomNumber}</p>
                    <p className="text-xs text-gray-400">{room.type} {room.floor && `• Floor ${room.floor}`}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(room._id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Occupancy</span>
                <span className="font-medium">{room.students.length}/{room.capacity}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
              </div>

              {room.students.length > 0 && (
                <div className="space-y-1 mb-3">
                  {room.students.map(s => (
                    <div key={s._id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
                      <span className="text-xs text-gray-700">{s.name} ({s.rollNumber})</span>
                      <button onClick={() => handleRemove(room._id, s._id)} className="text-red-400 hover:text-red-600">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {room.students.length < room.capacity && (
                <button onClick={() => setAssignRoom(room)} className="w-full flex items-center justify-center gap-1 text-xs text-purple-600 border border-purple-200 rounded-lg py-1.5 hover:bg-purple-50 transition-all">
                  <UserPlus size={14} /> Assign Student
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Create Room</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Room Number *</label>
                  <input className="input" placeholder="101" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Capacity *</label>
                  <input className="input" type="number" min="1" placeholder="4" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Floor</label>
                  <input className="input" placeholder="1st" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['Standard','AC','Non-AC','Suite'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {assignRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Assign to Room {assignRoom.roomNumber}</h2>
              <button onClick={() => setAssignRoom(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="label">Select Student</label>
              <select className="input mb-4" value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">Choose student...</option>
                {unassigned.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAssignRoom(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleAssign} className="btn-primary flex-1">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
