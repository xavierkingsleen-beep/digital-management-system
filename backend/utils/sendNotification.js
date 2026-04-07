const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushToUser } = require('../routes/push');
const { sendNotificationEmail } = require('./mailer');

async function sendNotification(io, {
    userId,
    title,
    message,
    type = "info",
    actionUrl
}) {
    try {
        // ❗ safety check (only approved users)
        const user = await User.findById(userId);
        if (!user) return;

        // 1. Save to DB
        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            actionUrl
        });

        // 2. Real-time (socket)
        if (io) {
            io.to(`user:${userId}`).emit('new_notification', notification);
        }

        // 3. Push notification (outside)
        sendPushToUser(userId, {
            title,
            message,
            actionUrl,
            type
        }).catch(() => { }); // ❗ never crash

        // 4. Email (non-blocking)
        if (user.email) {
            sendNotificationEmail(user.email, user.name, {
                title,
                message,
                actionUrl,
                type
            }).catch(() => { });
        }

    } catch (err) {
        console.log("Notification error:", err.message);
    }
}

module.exports = { sendNotification };