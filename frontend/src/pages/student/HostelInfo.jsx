import React, { useEffect, useState } from 'react';
import { BookOpen, Utensils, Phone, Link as LinkIcon, Bell } from 'lucide-react';
import api from '../../api/axios';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function HostelInfo() {
  const [tab, setTab] = useState('rules');
  const [menu, setMenu] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [links, setLinks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/mess'),
      api.get('/contacts'),
      api.get('/links'),
      api.get('/announcements'),
    ]).then(([m, c, l, a]) => {
      setMenu(m.data);
      setContacts(c.data);
      setLinks(l.data);
      setAnnouncements(a.data);
    }).catch(() => {});
  }, []);

  const tabs = [
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'mess', label: 'Mess Menu', icon: Utensils },
    { id: 'contacts', label: 'Emergency', icon: Phone },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'notices', label: 'Notices', icon: Bell },
  ];

  const rules = [
    'Students must return to hostel by 10:00 PM.',
    'Maintain silence during study hours (9 PM – 6 AM).',
    'No guests allowed in rooms without prior permission.',
    'Keep your room and common areas clean at all times.',
    'Ragging in any form is strictly prohibited.',
    'Alcohol, tobacco, and drugs are strictly banned.',
    'Attendance is mandatory for all hostel residents.',
    'Report any maintenance issues to the warden immediately.',
    'Electricity and water must not be wasted.',
    'Respect fellow residents and hostel staff.',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hostel Information</h1>
        <p className="text-sm text-gray-500">Rules, mess menu, contacts and more</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Rules */}
      {tab === 'rules' && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-blue-600" /> Hostel Rules & Regulations</h2>
          <ol className="space-y-3">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-gray-700">{r}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Mess Menu */}
      {tab === 'mess' && (
        <div className="space-y-3">
          {DAYS.map(day => {
            const m = menu.find(x => x.day === day);
            return (
              <div key={day} className="card">
                <h3 className="font-semibold text-gray-900 mb-3">{day}</h3>
                {m ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[['Breakfast', m.breakfast], ['Lunch', m.lunch], ['Snacks', m.snacks], ['Dinner', m.dinner]].map(([meal, item]) => (
                      <div key={meal} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">{meal}</p>
                        <p className="text-sm font-medium text-gray-900">{item || '—'}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">Menu not set</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Emergency Contacts */}
      {tab === 'contacts' && (
        <div className="space-y-3">
          {contacts.length === 0 ? <div className="card text-center py-8 text-gray-400">No contacts added</div> :
            contacts.map(c => (
              <div key={c._id} className="card flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-xl">
                  <Phone size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.role}</p>
                  <p className="text-xs text-gray-400">{c.available}</p>
                </div>
                <a href={`tel:${c.phone}`} className="text-blue-600 font-semibold text-sm hover:underline">{c.phone}</a>
              </div>
            ))
          }
        </div>
      )}

      {/* Links */}
      {tab === 'links' && (
        <div className="space-y-3">
          {links.length === 0 ? <div className="card text-center py-8 text-gray-400">No links added</div> :
            links.map(l => (
              <a key={l._id} href={l.url} target="_blank" rel="noreferrer"
                className="card flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <LinkIcon size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{l.title}</p>
                  {l.description && <p className="text-sm text-gray-500">{l.description}</p>}
                  <p className="text-xs text-gray-400">{l.category}</p>
                </div>
              </a>
            ))
          }
        </div>
      )}

      {/* Notices */}
      {tab === 'notices' && (
        <div className="space-y-3">
          {announcements.length === 0 ? <div className="card text-center py-8 text-gray-400">No announcements</div> :
            announcements.map(a => (
              <div key={a._id} className={`card border-l-4 ${a.priority === 'High' ? 'border-red-500' : a.priority === 'Medium' ? 'border-yellow-500' : 'border-green-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.priority === 'High' ? 'bg-red-100 text-red-700' : a.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {a.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
