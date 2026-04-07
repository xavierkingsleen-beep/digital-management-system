const cron = require('node-cron');
const NotificationConfig = require('../models/NotificationConfig');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushToUser } = require('../routes/push');
const { sendNotificationEmail } = require('../utils/mailer');

// Runs every minute — reads config from DB each time so changes take effect immediately
function startNotificationScheduler(io) {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      // Fetch all enabled configs whose times array includes the current HH:mm
      const configs = await NotificationConfig.find({
        enabled: true,
        times: currentTime,
      });

      if (configs.length === 0) return;

      for (const config of configs) {
        // Determine target users — always exclude non-approved students
        const roleFilter = config.targetRole === 'all'
          ? { $or: [{ role: 'admin' }, { role: 'student', status: 'APPROVED' }] }
          : config.targetRole === 'student'
          ? { role: 'student', status: 'APPROVED' }
          : { role: config.targetRole };

        const users = await User.find(roleFilter).select('_id');

        // Bulk-create notifications and emit via socket
        const docs = users.map(u => ({
          userId:    u._id,
          title:     config.name,
          message:   config.message,
          type:      config.type,
          actionUrl: config.actionUrl,
        }));

        if (docs.length === 0) continue;

        const created = await Notification.insertMany(docs, { ordered: false });

        // Emit to each user's socket room + send push + email (warning only)
        if (io) {
          for (const notif of created) {
            io.to(`user:${notif.userId}`).emit('new_notification', notif);
            sendPushToUser(notif.userId, {
              title: notif.title,
              message: notif.message,
              actionUrl: notif.actionUrl,
              type: notif.type,
            }).catch(() => {});

            // Email only for warning-type scheduled notifications
            if (config.type === 'warning') {
              User.findById(notif.userId).select('email name').then(u => {
                if (u?.email) {
                  sendNotificationEmail(u.email, u.name, {
                    title: notif.title,
                    message: notif.message,
                    actionUrl: notif.actionUrl,
                    type: notif.type,
                  }).catch(() => {});
                }
              }).catch(() => {});
            }
          }
        }

        console.log(`[Scheduler] "${config.name}" → sent to ${created.length} user(s) at ${currentTime}`);
      }
    } catch (err) {
      // Never crash the server — just log
      console.error('[Scheduler] Error:', err.message);
    }
  });

  console.log('[Scheduler] Notification scheduler started');
}

module.exports = { startNotificationScheduler };
