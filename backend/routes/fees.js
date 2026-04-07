const router = require('express').Router();
const HostelFee = require('../models/HostelFee');
const FeeTemplate = require('../models/FeeTemplate');
const PaymentTransaction = require('../models/PaymentTransaction');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendNotification } = require('../utils/sendNotification');


// ─── helper: derive paymentStatus from a fee doc ───────────────────────────
function derivePaymentStatus(fee) {
  const total = (fee.totalAmount || 0) + (fee.fineAmount || 0);
  const paid = fee.paidAmount || 0;
  if (paid >= total && total > 0) return 'Paid';
  if (paid > 0 && paid < total) return 'Partial';
  if (fee.dueDate && new Date() > new Date(fee.dueDate) && paid === 0) return 'Overdue';
  return 'Pending';
}

// Student: get own fees
router.get('/my', protect, async (req, res) => {
  try {
    const fees = await HostelFee.find({ student: req.user._id }).sort('-createdAt');
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: get single fee by ID (ownership enforced)
router.get('/my/:id', protect, async (req, res) => {
  try {
    const fee = await HostelFee.findOne({ _id: req.params.id, student: req.user._id });
    if (!fee) return res.status(403).json({ message: 'Access denied or fee not found' });
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all fees
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const fees = await HostelFee.find().populate('student', 'name rollNumber').sort('-createdAt');
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: add fee record
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { student, semester, roomFee, messFee, maintenanceFee, electricityFee, dueDate } = req.body;
    const fields = { roomFee, messFee, maintenanceFee, electricityFee };
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined && val !== '' && Number(val) < 0)
        return res.status(400).json({ message: `${key} cannot be negative` });
    }
    const total = (roomFee || 0) + (messFee || 0) + (maintenanceFee || 0) + (electricityFee || 0);
    const fee = await HostelFee.create({ student, semester, roomFee, messFee, maintenanceFee, electricityFee, totalAmount: total, dueDate });
    await sendNotification(req.app.get('io'), {
      userId: student,
      title: "New Fee Assigned",
      message: "A new fee has been added",
      actionUrl: "/student/fees"
    });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update payment status
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    // Map old status values to paymentStatus — keep both in sync for backward compat
    const paymentStatus = status; // 'Paid' or 'Pending'
    const fee = await HostelFee.findByIdAndUpdate(
      req.params.id,
      {
        status,
        paymentStatus,
        paidAt: status === 'Paid' ? new Date() : null,
        paidAmount: status === 'Paid' ? undefined : 0,
      },
      { new: true }
    );
    if (fee) {
      const hasPaid = await HostelFee.exists({ student: fee.student, paymentStatus: 'Paid' });
      await User.findByIdAndUpdate(fee.student, { feeStatus: hasPaid ? 'Paid' : 'Pending' });
    }
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: mark own fee as paid after payment
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const fee = await HostelFee.findOne({ _id: req.params.id, student: req.user._id });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });

    const total = (fee.totalAmount || 0) + (fee.fineAmount || 0);
    const remaining = total - (fee.paidAmount || 0);
    if (remaining <= 0) return res.json(fee); // nothing left to pay
    const { method = 'UPI', transactionId = '' } = req.body;

    fee.status = 'Paid';
    fee.paymentStatus = 'Paid';
    fee.paidAt = new Date();
    fee.paidAmount = total;
    await fee.save();
    await sendNotification(req.app.get('io'), {
      userId: fee.student,
      title: "Payment Successful",
      message: "Your fee payment is completed",
      type: "success",
      actionUrl: "/student/fees"
    });
    // Record transaction
    await PaymentTransaction.create({
      fee: fee._id,
      student: req.user._id,
      amount: total,
      method,
      transactionId: transactionId || `TXN${Date.now()}`,
      status: 'Success',
    });

    // Sync feeStatus on User
    await User.findByIdAndUpdate(req.user._id, { feeStatus: 'Paid' });
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════════
// NEW ROUTES — Fee Templates
// ═══════════════════════════════════════════════════════════════

// Admin: list all templates
router.get('/templates', protect, adminOnly, async (req, res) => {
  try {
    const templates = await FeeTemplate.find().sort('-createdAt');
    res.json(templates);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: create template
router.post('/templates', protect, adminOnly, async (req, res) => {
  try {
    const { name, semester, roomFee, messFee, maintenanceFee, electricityFee, fineAmount, dueDate } = req.body;
    const amountFields = { roomFee, messFee, maintenanceFee, electricityFee, fineAmount };
    for (const [key, val] of Object.entries(amountFields)) {
      if (val !== undefined && val !== '' && Number(val) < 0)
        return res.status(400).json({ message: `${key} cannot be negative` });
    }
    const tmpl = await FeeTemplate.create({
      name, semester,
      roomFee: Number(roomFee) || 0,
      messFee: Number(messFee) || 0,
      maintenanceFee: Number(maintenanceFee) || 0,
      electricityFee: Number(electricityFee) || 0,
      fineAmount: Number(fineAmount) || 0,
      dueDate,
      createdBy: req.user._id,
    });
    res.status(201).json(tmpl);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: delete template
router.delete('/templates/:id', protect, adminOnly, async (req, res) => {
  try {
    await FeeTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: apply template to ALL students (bulk create fee records)
router.post('/templates/:id/apply', protect, adminOnly, async (req, res) => {
  try {
    const tmpl = await FeeTemplate.findById(req.params.id);
    if (!tmpl) return res.status(404).json({ message: 'Template not found' });

    const students = await User.find({ role: 'student', status: 'APPROVED' }, '_id');
    const baseTotal = tmpl.roomFee + tmpl.messFee + tmpl.maintenanceFee + tmpl.electricityFee;

    // Find which students already have a fee record for this semester (skip them)
    const existing = await HostelFee.find(
      { semester: tmpl.semester, student: { $in: students.map(s => s._id) } },
      'student'
    );
    const existingIds = new Set(existing.map(f => f.student.toString()));

    const toCreate = students
      .filter(s => !existingIds.has(s._id.toString()))
      .map(s => ({
        student: s._id,
        semester: tmpl.semester,
        roomFee: tmpl.roomFee,
        messFee: tmpl.messFee,
        maintenanceFee: tmpl.maintenanceFee,
        electricityFee: tmpl.electricityFee,
        fineAmount: tmpl.fineAmount,
        totalAmount: baseTotal,
        dueDate: tmpl.dueDate,
        templateId: tmpl._id,
        status: 'Pending',
        paymentStatus: 'Pending',
      }));

    if (toCreate.length === 0) {
      return res.json({ message: `0 created — all ${students.length} students already have a record for this semester` });
    }

    // insertMany with ordered:true (default) — stops on first error, no partial saves
    await HostelFee.insertMany(toCreate, { ordered: true });

    res.json({ message: `Applied to ${toCreate.length} students (${existingIds.size} skipped — already exist)` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// NEW ROUTES — Payment History
// ═══════════════════════════════════════════════════════════════

// Student: own payment history
router.get('/transactions/my', protect, async (req, res) => {
  try {
    const txns = await PaymentTransaction.find({ student: req.user._id })
      .populate('fee', 'semester totalAmount')
      .sort('-createdAt');
    res.json(txns);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: all transactions (optionally filtered by studentId)
router.get('/transactions', protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.student = req.query.studentId;
    const txns = await PaymentTransaction.find(filter)
      .populate('student', 'name rollNumber')
      .populate('fee', 'semester totalAmount fineAmount')
      .sort('-createdAt');
    res.json(txns);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ═══════════════════════════════════════════════════════════════
// NEW ROUTES — Fine management
// ═══════════════════════════════════════════════════════════════

// Admin: add/update fine on a fee record
router.patch('/:id/fine', protect, adminOnly, async (req, res) => {
  try {
    const { fineAmount } = req.body;
    const fee = await HostelFee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    fee.fineAmount = Number(fineAmount) || 0;
    // Recalculate paymentStatus based on amounts — not status field
    const total = (fee.totalAmount || 0) + fee.fineAmount;
    const paid = fee.paidAmount || 0;
    if (paid >= total && total > 0) {
      fee.paymentStatus = 'Paid';
    } else if (paid > 0 && paid < total) {
      fee.paymentStatus = 'Partial';
      fee.status = 'Pending'; // keep status in sync
    } else {
      fee.paymentStatus = derivePaymentStatus(fee);
    }
    await fee.save();
    await sendNotification(req.app.get('io'), {
      userId: fee.student,
      title: "Fine Added",
      message: `₹${fee.fineAmount} fine added`,
      type: "warning",
      actionUrl: "/student/fees"
    });
    res.json(fee);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Auto-detect overdue: run on GET /fees (admin) — update paymentStatus in background
router.get('/overdue/sync', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const result = await HostelFee.updateMany(
      {
        $or: [{ status: 'Pending' }, { paymentStatus: 'Pending' }],
        dueDate: { $lt: now },
        paymentStatus: { $ne: 'Overdue' },
      },
      { $set: { paymentStatus: 'Overdue', status: 'Pending' } }
    );
    res.json({ updated: result.modifiedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
