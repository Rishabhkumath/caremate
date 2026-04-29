import axiosInstance from './axiosInstance'

export const medicationApi = {
  // Patient gets their own medications — backend reads from JWT, no ID in URL
  getAll: () => axiosInstance.get('/medications'),

  create: (data)        => axiosInstance.post('/medications', data),
  update: (id, data)    => axiosInstance.put(`/medications/${id}`, data),
  delete: (id)          => axiosInstance.delete(`/medications/${id}`),

  // Today's reminders
  getTodayReminders: () => axiosInstance.get('/medications/reminders/today'),
  markTaken: (id)       => axiosInstance.put(`/medications/reminders/${id}/taken`),

  // Doctor/caregiver fetching a specific patient's medications
  getPatientMedications: (patientId) =>
    axiosInstance.get(`/medications/patient/${patientId}`),
}