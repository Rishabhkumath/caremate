import axiosInstance from './axiosInstance'

export const adminApi = {
  getStats: () => axiosInstance.get('/admin/dashboard/stats'),
  getUsers: (params) => axiosInstance.get('/admin/users', { params }),
  getUserDetails: (id) => axiosInstance.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) => axiosInstance.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => axiosInstance.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),
  getDoctors: (params) => axiosInstance.get('/admin/doctors', { params }),
  verifyDoctor: (id, verified = true) => axiosInstance.put(`/admin/doctors/${id}/verify`, { verified }),
  verifyCaregiver: (id, status, reportUrl) => axiosInstance.put(`/admin/caregivers/${id}/verify`, { status, reportUrl }),
}
