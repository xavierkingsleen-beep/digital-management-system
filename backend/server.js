const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { startNotificationScheduler } = require('./scheduler/notificationScheduler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true },
});

// Make io accessible in route handlers via app.get('io')
app.set('io', io);

// Track userId → socketId mapping for targeted delivery
const userSockets = new Map();

io.on('connection', (socket) => {
  // Client sends their userId after connecting
  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) { userSockets.delete(uid); break; }
    }
  });
});

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/links', require('./routes/links'));
app.use('/api/gatepass', require('./routes/gatepass'));
app.use('/api/device', require('./routes/device'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/notification-config', require('./routes/notificationConfig'));
app.use('/api/push', require('./routes/push'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
      startNotificationScheduler(io); // start after DB is ready
    });
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
    process.exit(1); // prevent server running in broken state
  });
