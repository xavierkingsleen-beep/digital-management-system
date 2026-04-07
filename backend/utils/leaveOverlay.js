/**
 * Leave Overlay Utility
 * Pure runtime check — reads LeaveRequest, writes NOTHING.
 * Returns { onLeave: true, leave } if student is currently on approved leave.
 * Returns { onLeave: false } otherwise.
 * Never throws — always falls back to normal attendance on any error.
 *
 * Activation: startDate at 06:00 AM → endDate at 22:00 PM (NO +1 day offset)
 * Example: leave April 8–10 → active from April 8 06:00 AM to April 10 22:00 PM
 */
const LeaveRequest = require('../models/LeaveRequest');

async function getLeaveOverlay(studentId) {
  try {
    // FIX 1: Use IST timezone for current time
    const nowIST = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );

    // Query: approved leave where startDate <= nowIST AND endDate >= nowIST
    const leave = await LeaveRequest.findOne({
      student: studentId,
      status: 'Approved',
      startDate: { $lte: nowIST },
      endDate:   { $gte: nowIST },
    }).sort('startDate');

    if (!leave) return { onLeave: false };

    // FIX 2: leaveStart = startDate at 06:00, leaveEnd = endDate at 22:00
    const leaveStart = new Date(leave.startDate);
    leaveStart.setHours(6, 0, 0, 0);

    const leaveEnd = new Date(leave.endDate);
    leaveEnd.setHours(22, 0, 0, 0);

    // FIX 3: Active condition uses nowIST only
    if (nowIST >= leaveStart && nowIST <= leaveEnd) {
      return { onLeave: true, leave };
    }

    return { onLeave: false };
  } catch {
    return { onLeave: false };
  }
}

module.exports = { getLeaveOverlay };
