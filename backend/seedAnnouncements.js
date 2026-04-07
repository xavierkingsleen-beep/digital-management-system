const mongoose = require('mongoose');
const Announcement = require('./models/Announcement');
require('dotenv').config();

const announcements = [
  {
    title: 'Fee Payment Deadline — Last Date: 30th April',
    content: 'All students are reminded to clear their hostel fee dues before 30th April 2026. Late payments will attract a fine of ₹500 per week. Contact the warden office for any queries.',
    priority: 'High',
  },
  {
    title: 'Water Supply Interruption on 2nd April',
    content: 'Due to maintenance work on the main pipeline, water supply will be interrupted from 9:00 AM to 2:00 PM on 2nd April 2026. Students are advised to store water in advance.',
    priority: 'High',
  },
  {
    title: 'Mess Menu Updated for April',
    content: 'The mess committee has revised the monthly menu for April 2026. Special Sunday meals and festival specials have been added. Check the Hostel Info section for the full menu.',
    priority: 'Medium',
  },
  {
    title: 'Hostel Day Celebration — 10th April',
    content: 'Annual Hostel Day will be celebrated on 10th April 2026. Cultural events, sports competitions, and a special dinner are planned. All students are encouraged to participate.',
    priority: 'Medium',
  },
  {
    title: 'Electricity Maintenance — Block B',
    content: 'Electrical maintenance work will be carried out in Block B on 5th April from 10:00 AM to 4:00 PM. Power supply will be temporarily cut. Students are advised to charge devices in advance.',
    priority: 'High',
  },
  {
    title: 'New Wi-Fi Password Updated',
    content: 'The hostel Wi-Fi password has been updated for security purposes. Students can collect the new password from the warden office by showing their ID card.',
    priority: 'Medium',
  },
  {
    title: 'Gate Pass Policy Reminder',
    content: 'Students are reminded that gate passes must be applied at least 2 hours before the planned exit time. Emergency passes can be requested directly from the duty warden.',
    priority: 'Medium',
  },
  {
    title: 'Room Inspection on 8th April',
    content: 'A routine room inspection will be conducted on 8th April 2026. All students must ensure their rooms are clean and tidy. Disciplinary action will be taken for violations.',
    priority: 'High',
  },
  {
    title: 'Library Books Return Notice',
    content: 'Students who have borrowed books from the hostel library are requested to return them by 15th April 2026. Overdue books will attract a fine of ₹10 per day.',
    priority: 'Low',
  },
  {
    title: 'Sports Equipment Available for Booking',
    content: 'The hostel sports room now has new cricket, badminton, and chess equipment available. Students can book equipment from 4:00 PM to 7:00 PM on weekdays by contacting the sports coordinator.',
    priority: 'Low',
  },
  {
    title: 'Anti-Ragging Committee Meeting',
    content: 'The anti-ragging committee will hold its monthly meeting on 12th April. Any student facing issues is encouraged to report to the committee. All complaints will be handled confidentially.',
    priority: 'High',
  },
  {
    title: 'Attendance Regularization Window Open',
    content: 'Students with attendance below 75% can apply for regularization between 1st–7th April 2026. Submit your application with valid medical or emergency documents to the warden office.',
    priority: 'Medium',
  },
];

async function seedAnnouncements() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const count = await Announcement.countDocuments();
  if (count >= announcements.length) {
    console.log(`Already have ${count} announcements — skipping seed.`);
    process.exit(0);
  }

  await Announcement.deleteMany({});
  await Announcement.insertMany(announcements);
  console.log(`✅ Inserted ${announcements.length} announcements`);
  process.exit(0);
}

seedAnnouncements().catch(err => { console.error(err); process.exit(1); });
