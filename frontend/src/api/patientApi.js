import axiosInstance from './axiosInstance'

export const patientApi = {
  getProfile: () => axiosInstance.get('/patients/profile'),
  updateProfile: (data) => axiosInstance.put('/patients/profile', data),
  getAll: () => axiosInstance.get('/patients'),
  getDashboardStats: () => axiosInstance.get('/patients/dashboard/stats'),
  approveCaregiver: (caregiverId) => axiosInstance.post(`/patients/caregivers/${caregiverId}/approve`),
}
