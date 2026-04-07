import React, { useEffect, useState } from 'react';
import { BedDouble, Users, Hash } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function StudentRoom() {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rooms/my')
      .then(r => setRoom(r.data))
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Room</h1>
      <div className="card text-center py-16">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (!room) return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Room</h1>
      <div className="card text-center py-16">
        <BedDouble size={48} className="text-gray-500 mx-auto mb-3" />
        <p className="font-medium">No room assigned yet</p>
        <p className="text-gray-400 text-sm mt-1">Contact the hostel warden for room assignment</p>
      </div>
    </div>
  );

  const occupancy = room.students?.length || 0;
  const pct = Math.round((occupancy / room.capacity) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Room</h1>

      {/* Room number hero card */}
      <div className="card text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: '1px solid rgba(167,139,250,0.3)' }}>
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <BedDouble size={32} />
          </div>
          <div>
            <p className="text-purple-200 text-sm">Room Number</p>
            <p className="text-4xl font-bold">{room.roomNumber}</p>
            {room.floor && <p className="text-purple-200 text-sm mt-1">Floor: {room.floor}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Room Type', value: room.type || 'Standard', icon: BedDouble },
          { label: 'Capacity',  value: room.capacity,           icon: Users },
          { label: 'Occupants', value: occupancy,               icon: Hash },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card text-center">
            <Icon size={20} className="text-purple-400 mx-auto mb-2" />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Room Occupancy</span>
          <span className="text-sm text-gray-500">{occupancy}/{room.capacity}</span>
        </div>
        <div className="w-full rounded-full h-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-3 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981',
            }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{pct}% occupied</p>
      </div>

      {/* Roommates */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          Room Members ({occupancy})
        </h2>
        {room.students && room.students.length > 0 ? (
          <div className="space-y-2">
            {room.students.map(s => {
              const isMe = s._id === user?._id || s._id?.toString() === user?._id?.toString();
              return (
                <div key={s._id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
                  style={{
                    background: isMe ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                    border: isMe ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isMe ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(167,139,250,0.25)' }}>
                    <span className="font-bold text-sm" style={{ color: isMe ? '#c084fc' : '#9ca3af' }}>
                      {s.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {s.name}
                      {isMe && <span className="ml-2 text-xs text-purple-400 font-normal">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{s.rollNumber}{s.department ? ` · ${s.department}` : ''}</p>
                  </div>
                  {s.year && <span className="text-xs text-gray-600 flex-shrink-0">{s.year}</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No roommates found</p>
        )}
      </div>
    </div>
  );
}
