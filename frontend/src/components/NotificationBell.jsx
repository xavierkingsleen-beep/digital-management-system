import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io as socketIO } from 'socket.io-client';
import api from '../api/axios';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';

const TYPE_CONFIG = {
  info:    { icon: Info,          color: 'text-blue-500',  bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  success: { icon: CheckCircle,   color: 'text-green-500', bg: 'bg-green-50' },
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ userId, accentColor = 'bg-blue-500' }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { permission, requestPermission } = usePushNotifications(userId);

  const load = () => {
    if (!userId) return;
    api.get(`/notifications/${userId}`)
      .then(r => setNotifications(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    load();

    // ── Socket.io real-time listener ──────────────────────────────
    let socket = null;
    let pollInterval = null;

    try {
      socket = socketIO('http://localhost:5000', { transports: ['websocket'], reconnectionAttempts: 3 });

      socket.on('connect', () => {
        socket.emit('register', userId);
      });

      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      socket.on('connect_error', () => {
        // Socket failed — fall back to polling every 30s
        if (!pollInterval) pollInterval = setInterval(load, 30000);
      });
    } catch {
      // Socket.io not available — fall back to polling
      pollInterval = setInterval(load, 30000);
    }

    // Always keep a 60s poll as safety net even when socket is connected
    const safetyPoll = setInterval(load, 60000);

    return () => {
      if (socket) socket.disconnect();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(safetyPoll);
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markOne = async (n) => {
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n._id}/read`);
        setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
      } catch {}
    }
    setOpen(false);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  const markAll = async () => {
    try {
      await api.patch(`/notifications/read-all/${userId}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full text-white text-[9px] font-bold ${accentColor}`}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className={`text-xs font-bold text-white px-1.5 py-0.5 rounded-full ${accentColor}`}>{unread}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAll}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Permission prompt */}
          {permission === 'default' && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
              <p className="text-xs text-amber-700">Enable push notifications to get alerts when app is closed.</p>
              <button onClick={requestPermission}
                className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg whitespace-nowrap transition-all">
                Enable
              </button>
            </div>
          )}

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell size={28} className="text-gray-200 mb-2" />
                <p className="text-sm font-medium text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">You are all caught up</p>
              </div>
            ) : notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <button key={n._id} onClick={() => markOne(n)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${n.read ? 'hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${n.read ? 'text-gray-700 font-normal' : 'text-gray-900 font-semibold'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
