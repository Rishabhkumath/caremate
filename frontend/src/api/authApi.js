import axiosInstance from './axiosInstance'

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  googleLogin: (credential) => axiosInstance.post('/auth/google', { credential }),
  getGoogleConfig: () => axiosInstance.get('/auth/google/config'),
  register: (userData) => axiosInstance.post('/auth/register', userData),
  logout: () => axiosInstance.post('/auth/logout'),
  getMe: () => axiosInstance.get('/auth/me'),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => axiosInstance.post(`/auth/reset-password/${token}`, { password }),
}
