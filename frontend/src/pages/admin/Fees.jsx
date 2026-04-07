import { useEffect, useState } from 'react';
import { CreditCard, Plus, X, CheckCircle, Clock, AlertTriangle, FileText, Zap, History } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  Paid:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Overdue: 'bg-red-100 text-red-700 border-red-200',
  Partial: 'bg-blue-100 text-blue-700 border-blue-200',
};

const EMPTY_FEE = { student: '', semester: '', roomFee: '', messFee: '', maintenanceFee: '', electricityFee: '', dueDate: '' };
const EMPTY_TMPL = { name: '', semester: '', roomFee: '', messFee: '', maintenanceFee: '', electricityFee: '', fineAmount: '', dueDate: '' };

export default function AdminFees() {
  const [tab, setTab] = useState('fees');
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showTmplForm, setShowTmplForm] = useState(false);
  const [fineModal, setFineModal] = useState(null);
  const [fineAmt, setFineAmt] = useState('');
  const [form, setForm] = useState(EMPTY_FEE);
  const [tmplForm, setTmplForm] = useState(EMPTY_TMPL);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const loadFees = () =>
    Promise.all([api.get('/fees'), api.get('/students')])
      .then(([f, s]) => { setFees(f.data); setStudents(s.data); })
      .catch(() => {});
  const loadTemplates = () => api.get('/fees/templates').then(r => setTemplates(r.data)).catch(() => {});
  const loadTransactions = () => api.get('/fees/transactions').then(r => setTransactions(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([loadFees(), loadTemplates(), loadTransactions()])
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', {
        ...form,
        roomFee: Number(form.roomFee),
        messFee: Number(form.messFee),
        maintenanceFee: Number(form.maintenanceFee),
        electricityFee: Number(form.electricityFee),
      });
      toast.success('Fee record added');
      setShowFeeForm(false);
      setForm(EMPTY_FEE);
      loadFees();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/fees/${id}`, { status }); toast.success(`Marked as ${status}`); loadFees(); }
    catch { toast.error('Failed'); }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/templates', {
        ...tmplForm,
        roomFee: Number(tmplForm.roomFee) || 0,
        messFee: Number(tmplForm.messFee) || 0,
        maintenanceFee: Number(tmplForm.maintenanceFee) || 0,
        electricityFee: Number(tmplForm.electricityFee) || 0,
        fineAmount: Number(tmplForm.fineAmount) || 0,
      });
      toast.success('Template created');
      setShowTmplForm(false);
      setTmplForm(EMPTY_TMPL);
      loadTemplates();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const applyTemplate = async (id) => {
    if (!window.confirm('Apply this template to ALL students? Existing records for the same semester will be skipped.')) return;
    setApplying(id);
    try {
      const { data } = await api.post(`/fees/templates/${id}/apply`);
      toast.success(data.message);
      loadFees();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApplying(null); }
  };

  const deleteTemplate = async (id) => {
    try { await api.delete(`/fees/templates/${id}`); toast.success('Template deleted'); loadTemplates(); }
    catch { toast.error('Failed'); }
  };

  const saveFine = async () => {
    try {
      await api.patch(`/fees/${fineModal._id}/fine`, { fineAmount: Number(fineAmt) || 0 });
      toast.success('Fine updated');
      setFineModal(null);
      loadFees();
    } catch { toast.error('Failed'); }
  };

  const syncOverdue = async () => {
    try {
      const { data } = await api.get('/fees/overdue/sync');
      toast.success(`Overdue sync: ${data.updated} records updated`);
      loadFees();
    } catch { toast.error('Sync failed'); }
  };

  const paid = fees.filter(f => f.status === 'Paid').length;
  const pending = fees.filter(f => f.status === 'Pending').length;
  const overdue = fees.filter(f => f.paymentStatus === 'Overdue').length;

  const summaryCards = [
    { label: 'Total Records', value: fees.length, from: 'from-blue-400', to: 'to-indigo-500', icon: CreditCard },
    { label: 'Paid', value: paid, from: 'from-green-400', to: 'to-emerald-500', icon: CheckCircle },
    { label: 'Pending', value: pending, from: 'from-amber-400', to: 'to-orange-500', icon: Clock },
    { label: 'Overdue', value: overdue, from: 'from-red-400', to: 'to-rose-500', icon: AlertTriangle },
  ];

  const tabs = [
    { id: 'fees', label: 'Fee Records', icon: CreditCard },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'transactions', label: 'Transactions', icon: History },
  ];

  const feeFields = [
    ['roomFee', 'Room Fee'],
    ['messFee', 'Mess Fee'],
    ['maintenanceFee', 'Maintenance Fee'],
    ['electricityFee', 'Electricity Fee'],
  ];

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Fees Management</h1>
          <p className="page-subtitle">{fees.length} fee records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={syncOverdue} className="btn-secondary flex items-center gap-2 text-sm">
            <Zap size={14} /> Sync Overdue
          </button>
          <button onClick={() => setShowFeeForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Fee
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, from, to, icon: Icon }) => (
          <div key={label} className="card text-center">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`filter-btn flex items-center gap-2 ${tab === t.id ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Fee Records Tab ── */}
      {tab === 'fees' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Fee Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Student', 'Semester', 'Base Total', 'Fine', 'Paid Amt', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fees.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No fee records</td></tr>
                ) : fees.map(f => {
                  const ps = f.paymentStatus || (f.status === 'Paid' ? 'Paid' : 'Pending');
                  return (
                    <tr key={f._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-700 font-bold text-xs">{f.student?.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.student?.name}</p>
                            <p className="text-xs text-gray-400">{f.student?.rollNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{f.semester}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">&#8377;{f.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">{f.fineAmount > 0 ? `\u20B9${f.fineAmount}` : '—'}</td>
                      <td className="px-4 py-3 text-sm text-green-700 font-medium">{f.paidAmount > 0 ? `\u20B9${f.paidAmount}` : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[ps] || STATUS_STYLE.Pending}`}>
                          {ps}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {f.status === 'Pending' ? (
                            <button onClick={() => updateStatus(f._id, 'Paid')}
                              className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-all">
                              Mark Paid
                            </button>
                          ) : (
                            <button onClick={() => updateStatus(f._id, 'Pending')}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all">
                              Revert
                            </button>
                          )}
                          <button onClick={() => { setFineModal(f); setFineAmt(String(f.fineAmount || 0)); }}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-all">
                            Fine
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Templates Tab ── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowTmplForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No templates yet</p>
              <p className="text-gray-400 text-sm mt-1">Create a template to bulk-apply fees to all students</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(t => {
                const base = t.roomFee + t.messFee + t.maintenanceFee + t.electricityFee;
                return (
                  <div key={t._id} className="card-hover">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{t.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t.semester}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">&#8377;{base.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[['Room', t.roomFee], ['Mess', t.messFee], ['Maintenance', t.maintenanceFee], ['Electricity', t.electricityFee]].map(([l, v]) => (
                        <div key={l} className="bg-gray-50 rounded-lg px-3 py-2 flex justify-between">
                          <span className="text-xs text-gray-500">{l}</span>
                          <span className="text-xs font-semibold text-gray-900">&#8377;{v}</span>
                        </div>
                      ))}
                    </div>
                    {t.fineAmount > 0 && <p className="text-xs text-red-600 mb-2">Fine: &#8377;{t.fineAmount}</p>}
                    {t.dueDate && <p className="text-xs text-gray-400 mb-3">Due: {new Date(t.dueDate).toLocaleDateString()}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => applyTemplate(t._id)}
                        disabled={applying === t._id}
                        className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <Zap size={13} /> {applying === t._id ? 'Applying...' : 'Apply to All Students'}
                      </button>
                      <button onClick={() => deleteTemplate(t._id)} className="btn-danger px-3 text-sm">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Student filter */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-3">
              <label className="label mb-0">Filter by Student</label>
              <select className="input max-w-xs"
                onChange={e => {
                  if (e.target.value) {
                    api.get(`/fees/transactions?studentId=${e.target.value}`).then(r => setTransactions(r.data)).catch(() => {});
                  } else {
                    loadTransactions();
                  }
                }}>
                <option value="">All Students</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Payment Transactions ({transactions.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Student', 'Semester', 'Amount', 'Method', 'Transaction ID', 'Status', 'Date & Time'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No transactions yet</td></tr>
                  ) : transactions.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{t.student?.name}</p>
                        <p className="text-xs text-gray-400">{t.student?.rollNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.fee?.semester || '—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">&#8377;{t.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.method}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{t.transactionId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          t.status === 'Success' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : t.status === 'Failed' ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(t.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Fee Modal ── */}
      {showFeeForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Add Fee Record</h2>
              <button onClick={() => setShowFeeForm(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Student *</label>
                  <select className="input" value={form.student} onChange={e => setForm({ ...form, student: e.target.value })} required>
                    <option value="">Select student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Semester *</label>
                  <input className="input" placeholder="Semester 1 - 2024" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required />
                </div>
                {feeFields.map(([k, l]) => (
                  <div key={k}>
                    <label className="label">{l} (&#8377;)</label>
                    <input className="input" type="number" min="0" placeholder="0" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="label">Due Date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFeeForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Template Modal ── */}
      {showTmplForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Create Fee Template</h2>
              <button onClick={() => setShowTmplForm(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Template Name *</label>
                  <input className="input" placeholder="e.g. Semester 1 - 2024" value={tmplForm.name} onChange={e => setTmplForm({ ...tmplForm, name: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="label">Semester *</label>
                  <input className="input" placeholder="Semester 1 - 2024" value={tmplForm.semester} onChange={e => setTmplForm({ ...tmplForm, semester: e.target.value })} required />
                </div>
                {[...feeFields, ['fineAmount', 'Fine Amount']].map(([k, l]) => (
                  <div key={k}>
                    <label className="label">{l} (&#8377;)</label>
                    <input className="input" type="number" min="0" placeholder="0" value={tmplForm[k]} onChange={e => setTmplForm({ ...tmplForm, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="label">Due Date</label>
                  <input className="input" type="date" value={tmplForm.dueDate} onChange={e => setTmplForm({ ...tmplForm, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowTmplForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Fine Modal ── */}
      {fineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Set Fine</h2>
              <button onClick={() => setFineModal(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Student: <span className="font-semibold">{fineModal.student?.name}</span><br />
              Semester: <span className="font-semibold">{fineModal.semester}</span>
            </p>
            <div className="mb-4">
              <label className="label">Fine Amount (&#8377;)</label>
              <input className="input" type="number" min="0" value={fineAmt} onChange={e => setFineAmt(e.target.value)} placeholder="0" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setFineModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveFine} className="btn-primary flex-1">Save Fine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
