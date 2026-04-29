import axiosInstance from './axiosInstance'

export const doctorApi = {
  getMe:            ()      => axiosInstance.get('/doctors/me'),
  updateMe:         (data)  => axiosInstance.put('/doctors/me', data),
  getProfile:       (id)    => axiosInstance.get(`/doctors/${id}`),
  updateProfile:    (id, d) => axiosInstance.put(`/doctors/${id}`, d),
  getPatients:      ()      => axiosInstance.get('/doctors/patients'),
  getConsultations: ()      => axiosInstance.get('/doctors/consultations'),
  getSchedule:      ()      => axiosInstance.get('/doctors/schedule'),
  getPrescriptions: ()      => axiosInstance.get('/doctors/prescriptions'),
  addPrescription:  (data)  => axiosInstance.post('/doctors/prescriptions', data),
  assignCaregiver:  (patientId, caregiverId) => axiosInstance.post(`/doctors/patients/${patientId}/caregivers/${caregiverId}/assign`),
  getDashboardStats:()      => axiosInstance.get('/doctors/dashboard/stats'),
  // Public: get all doctors for appointment booking
  getAll:           ()      => axiosInstance.get('/doctors/all'),
}
