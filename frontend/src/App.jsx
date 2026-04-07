import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import LandingPage from './pages/LandingPage';
import StudentLogin from './pages/auth/StudentLogin';
import StudentRegister from './pages/auth/StudentRegister';
import AdminLogin from './pages/auth/AdminLogin';
import DeviceReset from './pages/auth/DeviceReset';

// Student pages
import StudentLayout from './components/layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentComplaints from './pages/student/Complaints';
import StudentLeave from './pages/student/Leave';
import StudentAttendance from './pages/student/Attendance';
import StudentFees from './pages/student/Fees';
import StudentRoom from './pages/student/Room';
import HostelInfo from './pages/student/HostelInfo';
import StudentProfile from './pages/student/Profile';
import StudentGatePass from './pages/student/GatePass';

// Admin pages
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminComplaints from './pages/admin/Complaints';
import AdminLeave from './pages/admin/Leave';
import AdminRooms from './pages/admin/Rooms';
import AdminAttendance from './pages/admin/Attendance';
import AdminFees from './pages/admin/Fees';
import AdminInfo from './pages/admin/HostelInfo';
import AdminGatePass from './pages/admin/GatePass';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/device-reset" element={<DeviceReset />} />

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="leave" element={<StudentLeave />} />
          <Route path="gatepass" element={<StudentGatePass />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="room" element={<StudentRoom />} />
          <Route path="info" element={<HostelInfo />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="leave" element={<AdminLeave />} />
          <Route path="gatepass" element={<AdminGatePass />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="info" element={<AdminInfo />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
