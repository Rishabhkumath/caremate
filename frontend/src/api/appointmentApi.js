import axiosInstance from './axiosInstance'

export const appointmentApi = {
  getAll: () => axiosInstance.get('/appointments'),
  getById: (id) => axiosInstance.get(`/appointments/${id}`),
  create: (data) => axiosInstance.post('/appointments', data),
  update: (id, data) => axiosInstance.put(`/appointments/${id}`, data),
  cancel: (id, data) => axiosInstance.put(`/appointments/${id}/cancel`, data),
  rateDoctor: (id, data) => axiosInstance.put(`/appointments/${id}/rate`, data),
  getUpcoming: () => axiosInstance.get('/appointments/upcoming'),
}
