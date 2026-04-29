import axiosInstance from './axiosInstance'

export const consultationApi = {
  getAll: () => axiosInstance.get('/consultations'),
  getById: (id) => axiosInstance.get(`/consultations/${id}`),
  start: (appointmentId) => axiosInstance.post(`/consultations/${appointmentId}/start`),
  update: (id, data) => axiosInstance.put(`/consultations/${id}`, data),
  end: (id, data) => axiosInstance.put(`/consultations/${id}/end`, data),
}
