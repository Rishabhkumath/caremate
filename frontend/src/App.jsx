import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/common/ProtectedRoute'

// Public pages
import LandingPage    from './pages/LandingPage'
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'

// Patient
import PatientDashboard    from './pages/patient/PatientDashboard'
import PatientVitals       from './pages/patient/PatientVitals'
import PatientMedications  from './pages/patient/PatientMedications'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientReports      from './pages/patient/PatientReports'
import PatientProfile      from './pages/patient/PatientProfile'

// Doctor
import DoctorDashboard    from './pages/doctor/DoctorDashboard'
import DoctorPatients     from './pages/doctor/DoctorPatients'
import DoctorConsultations from './pages/doctor/DoctorConsultations'
import DoctorSchedule     from './pages/doctor/DoctorSchedule'
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions'
import DoctorProfile      from './pages/doctor/DoctorProfile'
import DoctorPatientVitals from './pages/doctor/DoctorPatientVitals'
import DoctorPatientMedications from './pages/doctor/DoctorPatientMedications'

// Caregiver
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard'
import CaregiverPatients  from './pages/caregiver/CaregiverPatients'
import CaregiverWorkboard from './pages/caregiver/CaregiverWorkboard'
import CaregiverProfile   from './pages/caregiver/CaregiverProfile'

// Admin
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminDoctors    from './pages/admin/AdminDoctors'
import AdminReports    from './pages/admin/AdminReports'
import AdminSettings   from './pages/admin/AdminSettings'
import AdminAnalytics  from './pages/admin/AdminAnalytics'

// Redirects logged-in users to their own dashboard
function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user)   return <Navigate to="/login" replace />
  const paths = {
    patient:   '/patient/dashboard',
    doctor:    '/doctor/dashboard',
    caregiver: '/caregiver/dashboard',
    admin:     '/admin/dashboard',
  }
  return <Navigate to={paths[user.role] || '/login'} replace />
}

// Redirect already-logged-in users away from login/register
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (user) return <RoleRedirect />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />

  return (
    <Routes>

      {/* Public */}
      <Route path="/"               element={<LandingPage />} />
      <Route path="/dashboard"      element={<RoleRedirect />} />

      <Route path="/login"          element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"       element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

      {/* Patient */}
      <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route index        element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"    element={<PatientDashboard />} />
        <Route path="vitals"       element={<PatientVitals />} />
        <Route path="medications"  element={<PatientMedications />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="reports"      element={<PatientReports />} />
        <Route path="profile"      element={<PatientProfile />} />
      </Route>

      {/* Doctor */}
      <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route index         element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<DoctorDashboard />} />
        <Route path="patients"      element={<DoctorPatients />} />
        <Route path="patients/:patientId/vitals" element={<DoctorPatientVitals />} />
        <Route path="patients/:patientId/medications" element={<DoctorPatientMedications />} />
        <Route path="consultations" element={<DoctorConsultations />} />
        <Route path="schedule"      element={<DoctorSchedule />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
        <Route path="profile"       element={<DoctorProfile />} />
      </Route>

      {/* Caregiver */}
      <Route path="/caregiver" element={<ProtectedRoute allowedRoles={['caregiver']} />}>
        <Route index       element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CaregiverDashboard />} />
        <Route path="patients"  element={<CaregiverPatients />} />
        <Route path="workboard" element={<CaregiverWorkboard />} />
        <Route path="carework"  element={<Navigate to="/caregiver/workboard" replace />} />
        <Route path="logs"      element={<Navigate to="/caregiver/workboard" replace />} />
        <Route path="tasks"     element={<Navigate to="/caregiver/workboard" replace />} />
        <Route path="profile"   element={<CaregiverProfile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route index        element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<AdminDashboard />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="doctors"    element={<AdminDoctors />} />
        <Route path="reports"    element={<AdminReports />} />
        <Route path="settings"   element={<AdminSettings />} />
        <Route path="analytics"  element={<AdminAnalytics />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}
