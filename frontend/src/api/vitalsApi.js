import axiosInstance from './axiosInstance'

export const vitalsApi = {
  // Patient logs their own vitals
  log: (data) => axiosInstance.post('/vitals', data),

  // Patient gets their own history — backend uses JWT to identify them
  getHistory: (params) => axiosInstance.get('/vitals', { params }),

  // Patient gets their own stats
  getStats: () => axiosInstance.get('/vitals/stats'),

  // Doctor or caregiver fetches a specific patient's vitals
  getPatientHistory: (patientId, params) =>
    axiosInstance.get(`/vitals/patient/${patientId}`, { params }),

  getPatientStats: (patientId) =>
    axiosInstance.get(`/vitals/patient/${patientId}/stats`),

  // Get single record
  getById: (id) => axiosInstance.get(`/vitals/${id}`),
}