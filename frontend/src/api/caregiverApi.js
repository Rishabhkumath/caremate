import axiosInstance from './axiosInstance'

export const caregiverApi = {
  getAll: () => axiosInstance.get('/caregivers/all'),
  getProfile: () => axiosInstance.get('/caregivers/profile'),
  updateProfile: (data) => axiosInstance.put('/caregivers/profile', data),
  getPatients: () => axiosInstance.get('/caregivers/patients'),
  getPatientDetails: (patientId) => axiosInstance.get(`/caregivers/patients/${patientId}`),
  getDashboardStats: () => axiosInstance.get('/caregivers/stats'),
  getLogs: () => axiosInstance.get('/caregivers/logs/today'),
  addLog: (patientId, data) => axiosInstance.post(`/caregivers/patients/${patientId}/logs`, data),
  updateLog: (logId, data) => axiosInstance.put(`/caregivers/logs/${logId}`, data),
  getTasks: () => axiosInstance.get('/caregivers/tasks'),
  updateTask: () => Promise.resolve({ data: { data: null } }),
}
