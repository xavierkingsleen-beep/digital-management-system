import React, { useEffect, useState } from 'react';
import { Bell, Utensils, Phone, Link as LinkIcon, Plus, X, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function AdminHostelInfo() {
  const [tab, setTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [menu, setMenu] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [links, setLinks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});

  const load = () => {
    Promise.all([api.get('/announcements'), api.get('/mess'), api.get('/contacts'), api.get('/links')])
      .then(([a, m, c, l]) => { setAnnouncements(a.data); setMenu(m.data); setContacts(c.data); setLinks(l.data); })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openForm = (defaults = {}) => { setForm(defaults); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (tab === 'announcements') await api.post('/announcements', form);
      else if (tab === 'mess') await api.post('/mess', form);
      else if (tab === 'contacts') await api.post('/contacts', form);
      else if (tab === 'links') await api.post('/links', form);
      toast.success('Saved');
      setShowForm(false);
      setForm({});
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (endpoint, id) => {
    try { await api.delete(`/${endpoint}/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const tabs = [
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'mess', label: 'Mess Menu', icon: Utensils },
    { id: 'contacts', label: 'Emergency Contacts', icon: Phone },
    { id: 'links', label: 'Important Links', icon: LinkIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hostel Information</h1>
          <p className="text-sm text-gray-500">Manage hostel info visible to students</p>
        </div>
        <button onClick={() => openForm(tab === 'mess' ? { day: 'Monday' } : {})} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Announcements */}
      {tab === 'announcements' && (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className={`card border-l-4 ${a.priority === 'High' ? 'border-red-500' : a.priority === 'Medium' ? 'border-yellow-500' : 'border-green-500'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${a.priority === 'High' ? 'bg-red-100 text-red-700' : a.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{a.priority}</span>
                </div>
                <button onClick={() => handleDelete('announcements', a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mess Menu */}
      {tab === 'mess' && (
        <div className="space-y-3">
          {DAYS.map(day => {
            const m = menu.find(x => x.day === day);
            return (
              <div key={day} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{day}</h3>
                  <button onClick={() => openForm({ day, breakfast: m?.breakfast || '', lunch: m?.lunch || '', snacks: m?.snacks || '', dinner: m?.dinner || '' })}
                    className="text-purple-600 text-xs font-medium hover:underline">{m ? 'Edit' : 'Add'}</button>
                </div>
                {m ? (
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[['Breakfast', m.breakfast], ['Lunch', m.lunch], ['Snacks', m.snacks], ['Dinner', m.dinner]].map(([meal, item]) => (
                      <div key={meal} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">{meal}</p>
                        <p className="font-medium text-gray-700">{item || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">Not set</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Contacts */}
      {tab === 'contacts' && (
        <div className="space-y-3">
          {contacts.map(c => (
            <div key={c._id} className="card flex items-center gap-4">
              <div className="bg-red-100 p-3 rounded-xl"><Phone size={18} className="text-red-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500">{c.role} • {c.available}</p>
                <p className="text-sm font-semibold text-blue-600">{c.phone}</p>
              </div>
              <button onClick={() => handleDelete('contacts', c._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      {tab === 'links' && (
        <div className="space-y-3">
          {links.map(l => (
            <div key={l._id} className="card flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-xl"><LinkIcon size={18} className="text-blue-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{l.title}</p>
                <p className="text-sm text-gray-500">{l.description}</p>
                <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{l.url}</a>
              </div>
              <button onClick={() => handleDelete('links', l._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 capitalize">Add {tab === 'mess' ? 'Mess Menu' : tab.slice(0, -1)}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'announcements' && <>
                <div><label className="label">Title *</label><input className="input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><label className="label">Content *</label><textarea className="input resize-none" rows={3} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} required /></div>
                <div><label className="label">Priority</label>
                  <select className="input" value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </>}
              {tab === 'mess' && <>
                <div><label className="label">Day</label>
                  <select className="input" value={form.day || 'Monday'} onChange={e => setForm({ ...form, day: e.target.value })}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                {['breakfast','lunch','snacks','dinner'].map(meal => (
                  <div key={meal}><label className="label capitalize">{meal}</label>
                    <input className="input" value={form[meal] || ''} onChange={e => setForm({ ...form, [meal]: e.target.value })} />
                  </div>
                ))}
              </>}
              {tab === 'contacts' && <>
                <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="label">Role *</label><input className="input" placeholder="Warden, Doctor..." value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} required /></div>
                <div><label className="label">Phone *</label><input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
                <div><label className="label">Available</label><input className="input" placeholder="24/7" value={form.available || ''} onChange={e => setForm({ ...form, available: e.target.value })} /></div>
              </>}
              {tab === 'links' && <>
                <div><label className="label">Title *</label><input className="input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                <div><label className="label">URL *</label><input className="input" type="url" placeholder="https://..." value={form.url || ''} onChange={e => setForm({ ...form, url: e.target.value })} required /></div>
                <div><label className="label">Description</label><input className="input" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><label className="label">Category</label><input className="input" placeholder="General" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
