import axiosInstance from './axiosInstance'

export const chatbotApi = {

  sendMessage: async (message, context = {}) => {
    const res = await axiosInstance.post('/ai/chat', {
      message,
      context
    })
    return res.data
  },

  analyzeSymptoms: async (symptoms) => {
    const res = await axiosInstance.post('/ai/analyze-symptoms', {
      symptoms
    })
    return res.data
  },

  getRoutineRecommendation: async (patientId) => {
    const res = await axiosInstance.get(`/ai/recommend-routine/${patientId}`)
    return res.data
  }

}