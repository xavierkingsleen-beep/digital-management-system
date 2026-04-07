import { useEffect, useState } from 'react';
import { CreditCard, X, CheckCircle, History, AlertTriangle, Download } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  Paid:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Overdue: 'bg-red-100 text-red-700 border-red-200',
  Partial: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function StudentFees() {
  const [tab, setTab] = useState('fees');
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [payStep, setPayStep] = useState(0); // 0=details, 1=method, 3=success, 4=failed
  const [payMethod, setPayMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showTick, setShowTick] = useState(false);
  const [lastTxnId, setLastTxnId] = useState('');

  const loadFees = () => api.get('/fees/my').then(r => setFees(r.data))
    .catch(() => toast.error('Failed to load fee records'));
  const loadTxns = () => api.get('/fees/transactions/my').then(r => setTransactions(r.data))
    .catch(() => toast.error('Failed to load payment history'));

  useEffect(() => { loadFees(); loadTxns(); }, []);

  const openPay = (fee) => {
    setSelected({ ...fee, _remainingAmount: (fee.totalAmount || 0) + (fee.fineAmount || 0) - (fee.paidAmount || 0) });
    setPayStep(0);
    setPayMethod('');
    setShowTick(false);
    setLastTxnId('');
  };

  const closePay = () => {
    setSelected(null);
    setPayStep(0);
    setProcessing(false);
    setShowTick(false);
    setLastTxnId('');
  };

  const getStatus = (fee) => fee.paymentStatus || (fee.status === 'Paid' ? 'Paid' : 'Pending');

  // ── Razorpay payment flow ──
  const handleProceedPayment = async () => {
    if (!payMethod) return toast.error('Select a payment method');
    if (!selected) return;

    setProcessing(true);
    try {
      // 1. Create Razorpay order on backend
      const { data: order } = await api.post('/payment/create-order', { feeId: selected._id });

      // 2. Open Razorpay checkout
      if (!window.Razorpay) {
        setProcessing(false);
        return toast.error('Payment service unavailable. Please refresh the page and try again.');
      }
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'HostelMS',
        description: `Fee Payment — ${selected.semester}`,
        order_id: order.orderId,
        handler: async (response) => {
          // 3. Verify on backend
          try {
            const { data: result } = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              feeId: selected._id,
            });

            if (result.success) {
              // Update local state
              setFees(prev => prev.map(f =>
                f._id === selected._id
                  ? { ...f, status: 'Paid', paymentStatus: 'Paid', paidAt: new Date().toISOString(), paidAmount: result.amount }
                  : f
              ));
              setLastTxnId(result.paymentId);
              loadTxns();
              setPayStep(3);
              setProcessing(false);
              setTimeout(() => setShowTick(true), 100);
            }
          } catch (err) {
            setProcessing(false);
            setPayStep(4);
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.error('Payment cancelled');
          },
        },
        prefill: {},
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setProcessing(false);
        setPayStep(4);
      });
      rzp.open();
    } catch (err) {
      setProcessing(false);
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  // Receipt download (simple text receipt)
  const downloadReceipt = () => {
    if (!selected) return;
    const total = (selected.totalAmount || 0) + (selected.fineAmount || 0);
    const lines = [
      'HostelMS — Payment Receipt',
      '─────────────────────────────',
      `Semester   : ${selected.semester}`,
      `Amount     : Rs.${total.toLocaleString()}`,
      `Payment ID : ${lastTxnId || selected.paymentId || 'N/A'}`,
      `Date       : ${new Date().toLocaleString()}`,
      '─────────────────────────────',
      'Thank you for your payment.',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${selected.semester.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Hostel Fees</h1>
        <p className="page-subtitle">View and pay your hostel fees</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'fees', label: 'My Fees', icon: CreditCard }, { id: 'history', label: 'Payment History', icon: History }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`filter-btn flex items-center gap-2 ${tab === t.id ? 'filter-btn-active' : 'filter-btn-inactive'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Fees Tab ── */}
      {tab === 'fees' && (
        fees.length === 0 ? (
          <div className="card text-center py-12">
            <CreditCard size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No fee records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fees.map(fee => {
              const ps = getStatus(fee);
              const totalWithFine = (fee.totalAmount || 0) + (fee.fineAmount || 0);
              const remainingAmount = totalWithFine - (fee.paidAmount || 0);
              return (
                <div key={fee._id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{fee.semester}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">&#8377;{totalWithFine.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border mt-1 ${STATUS_STYLE[ps] || STATUS_STYLE.Pending}`}>{ps}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: 'Room Fee', val: fee.roomFee },
                      { label: 'Mess Fee', val: fee.messFee },
                      { label: 'Maintenance', val: fee.maintenanceFee },
                      { label: 'Electricity', val: fee.electricityFee },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm font-semibold text-gray-900">&#8377;{(val || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  {fee.fineAmount > 0 && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-sm text-red-700 font-medium">Fine applied: &#8377;{fee.fineAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {ps === 'Paid' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                      <CheckCircle size={16} /> Paid on {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : 'N/A'}
                      {fee.paymentId && <span className="text-xs text-gray-400 font-normal ml-2">ID: {fee.paymentId}</span>}
                    </div>
                  )}
                  {ps === 'Partial' && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2">
                      Paid: &#8377;{fee.paidAmount?.toLocaleString()} / &#8377;{totalWithFine.toLocaleString()}
                    </div>
                  )}
                  {remainingAmount > 0 && (
                    <button onClick={() => openPay(fee)} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                      <CreditCard size={16} />
                      {ps === 'Overdue'
                        ? 'Pay Now (Overdue)'
                        : fee.fineAmount > 0 && fee.paidAmount > 0
                        ? `Pay Fine — ₹${remainingAmount.toLocaleString()}`
                        : 'Pay Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        transactions.length === 0 ? (
          <div className="card text-center py-12">
            <History size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(t => (
              <div key={t._id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.fee?.semester || 'Fee Payment'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.method} &bull; {t.transactionId}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900">&#8377;{t.amount?.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${t.status === 'Success' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Payment Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">

            {/* Success screen */}
            {payStep === 3 && (
              <div className="text-center py-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-700 ${showTick ? 'bg-green-500 scale-100 opacity-100' : 'bg-green-200 scale-75 opacity-0'}`}>
                  <svg viewBox="0 0 52 52" className={`w-12 h-12 transition-all duration-500 delay-300 ${showTick ? 'opacity-100' : 'opacity-0'}`}>
                    <circle cx="26" cy="26" r="25" fill="none" stroke="white" strokeWidth="2"
                      strokeDasharray="157" strokeDashoffset={showTick ? 0 : 157}
                      style={{ transition: 'stroke-dashoffset 0.6s ease 0.2s' }} />
                    <path fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      d="M14 27 l8 8 l16-16" strokeDasharray="30" strokeDashoffset={showTick ? 0 : 30}
                      style={{ transition: 'stroke-dashoffset 0.4s ease 0.6s' }} />
                  </svg>
                </div>
                <div className={`transition-all duration-500 delay-700 ${showTick ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                  <p className="text-gray-500 text-sm mb-1">
                    Your payment of <span className="font-semibold text-gray-900">&#8377;{((selected.totalAmount || 0) + (selected.fineAmount || 0)).toLocaleString()}</span> has been verified.
                  </p>
                  {lastTxnId && <p className="text-xs text-gray-400 mb-6">Payment ID: {lastTxnId}</p>}
                  <div className="flex gap-3">
                    <button onClick={downloadReceipt}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <Download size={15} /> Receipt
                    </button>
                    <button onClick={closePay} className="btn-primary flex-1">Done</button>
                  </div>
                </div>
              </div>
            )}

            {/* Failed screen */}
            {payStep === 4 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={36} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                <p className="text-gray-500 text-sm mb-6">Your payment could not be processed. No amount was deducted.</p>
                <div className="flex gap-3">
                  <button onClick={closePay} className="btn-secondary flex-1">Close</button>
                  <button onClick={() => setPayStep(1)} className="btn-primary flex-1">Try Again</button>
                </div>
              </div>
            )}

            {/* Method selection */}
            {payStep === 1 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Select Payment Method</h2>
                  <button onClick={closePay} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Amount: <span className="font-bold text-gray-900">&#8377;{(selected._remainingAmount || (selected.totalAmount || 0) + (selected.fineAmount || 0)).toLocaleString()}</span>
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    { id: 'upi', label: 'UPI / Google Pay / PhonePe', icon: '&#128241;', desc: 'Pay via any UPI app' },
                    { id: 'card', label: 'Credit / Debit Card', icon: '&#128179;', desc: 'Visa, Mastercard, RuPay' },
                    { id: 'netbanking', label: 'Net Banking', icon: '&#127981;', desc: 'All major banks supported' },
                  ].map(m => (
                    <label key={m.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${payMethod === m.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="method" value={m.id} checked={payMethod === m.id}
                        onChange={() => setPayMethod(m.id)} className="hidden" />
                      <span className="text-2xl" dangerouslySetInnerHTML={{ __html: m.icon }} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payMethod === m.id ? 'border-blue-500' : 'border-gray-300'}`}>
                        {payMethod === m.id && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                    </label>
                  ))}
                </div>
                <button onClick={handleProceedPayment} disabled={processing}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {processing ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Opening Razorpay...</>
                  ) : 'Proceed to Pay'}
                </button>
              </>
            )}

            {/* Fee details */}
            {payStep === 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Fee Details</h2>
                  <button onClick={closePay} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="space-y-2 mb-4">
                  {[
                    ['Room Fee', selected.roomFee],
                    ['Mess Fee', selected.messFee],
                    ['Maintenance Fee', selected.maintenanceFee],
                    ['Electricity Fee', selected.electricityFee],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{label}</span>
                      <span className="text-sm font-medium text-gray-900">&#8377;{(val || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {selected.fineAmount > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-red-600 font-medium">Fine</span>
                      <span className="text-sm font-semibold text-red-600">&#8377;{selected.fineAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">&#8377;{((selected.totalAmount || 0) + (selected.fineAmount || 0)).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setPayStep(1)} className="btn-primary w-full py-3">
                  Proceed to Pay
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
