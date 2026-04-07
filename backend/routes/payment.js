const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const HostelFee = require('../models/HostelFee');
const PaymentTransaction = require('../models/PaymentTransaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// POST /api/payment/create-order
// Creates a Razorpay order for a given fee
router.post('/create-order', protect, async (req, res) => {
  try {
    const { feeId } = req.body;
    if (!feeId) return res.status(400).json({ message: 'feeId is required' });

    const fee = await HostelFee.findOne({ _id: feeId, student: req.user._id });
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    const total = (fee.totalAmount || 0) + (fee.fineAmount || 0);
    const remaining = total - (fee.paidAmount || 0);
    if (remaining <= 0) return res.status(400).json({ message: 'No outstanding amount to pay' });

    const amountPaise = Math.round(remaining * 100);
    if (amountPaise <= 0) return res.status(400).json({ message: 'Invalid fee amount' });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Math.random().toString(36).substring(2, 10)}`,
      notes: {
        feeId: feeId.toString(),
        studentId: req.user._id.toString(),
        semester: fee.semester,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create payment order' });
  }
});

// POST /api/payment/verify
// Verifies Razorpay signature and marks fee as paid
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feeId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feeId) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      // Record failed transaction
      const fee = await HostelFee.findById(feeId);
      if (fee) {
        await PaymentTransaction.create({
          fee: feeId,
          student: req.user._id,
          amount: (fee.totalAmount || 0) + (fee.fineAmount || 0),
          method: 'UPI',
          transactionId: razorpay_payment_id,
          status: 'Failed',
          note: 'Signature mismatch',
        });
      }
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const fee = await HostelFee.findOne({ _id: feeId, student: req.user._id });
    if (!fee) return res.status(404).json({ message: 'Fee not found' });

    const total = (fee.totalAmount || 0) + (fee.fineAmount || 0);
    const nowPaid = (fee.paidAmount || 0) + (total - (fee.paidAmount || 0)); // = total
    const amountThisPayment = total - (fee.paidAmount || 0);

    fee.status = 'Paid';
    fee.paymentStatus = 'Paid';
    fee.paidAt = new Date();
    fee.paidAmount = nowPaid;
    fee.paymentId = razorpay_payment_id;
    await fee.save();

    await PaymentTransaction.create({
      fee: feeId,
      student: req.user._id,
      amount: amountThisPayment,
      method: 'UPI',
      transactionId: razorpay_payment_id,
      status: 'Success',
      note: `Razorpay order: ${razorpay_order_id}`,
    });

    await User.findByIdAndUpdate(req.user._id, { feeStatus: 'Paid' });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      amount: amountThisPayment,
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: err.message || 'Payment verification failed' });
  }
});

module.exports = router;
