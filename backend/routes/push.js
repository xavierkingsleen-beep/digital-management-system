const router = require('express').Router();
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middleware/auth');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// GET /push/vapid-public-key — frontend needs this to subscribe
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe — save subscription for logged-in user
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ message: 'Invalid subscription object' });

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user._id, endpoint, keys },
      { upsert: true, new: true }
    );
    res.json({ message: 'Subscribed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /push/unsubscribe — remove subscription
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
    res.json({ message: 'Unsubscribed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

// ── Exported helper: send push to a userId ────────────────────────────────────
async function sendPushToUser(userId, payload) {
  const subs = await PushSubscription.find({ userId });
  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload)
      ).catch(async (err) => {
        // 410 Gone = subscription expired, clean it up
        if (err.statusCode === 410) await PushSubscription.deleteOne({ _id: sub._id });
        throw err;
      })
    )
  );
  return results;
}

module.exports.sendPushToUser = sendPushToUser;
