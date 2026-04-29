/**
 * AI Service - Handles communication with Python FastAPI microservice
 * Connects to: http://localhost:8000/api
 */

const axios = require('axios');
const { APIError } = require('../utils/errorTypes');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';
    this.timeout = parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });

    /* Request logging */
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[AI Service] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('[AI Service] Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    /* Response handling */
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNREFUSED') {
          console.error('[AI Service] FastAPI server not running on port 8000');
          throw new APIError('AI Service unavailable', 503);
        }

        if (error.code === 'ETIMEDOUT') {
          throw new APIError('AI Service timeout', 504);
        }

        if (error.response) {
          console.error('[AI Service] Error Response:', error.response.data);
          throw new APIError(
            error.response.data?.message || error.response.data?.detail || 'AI Service error',
            error.response.status
          );
        }

        throw error;
      }
    );
  }

  /* ---------------------------------- CHATBOT ---------------------------------- */

  async sendChatMessage(message, context = {}) {
    try {
      const response = await this.client.post('/chat', {
        message,
        context,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        response: response.data.response,
        disclaimer: response.data.disclaimer,
        suggested_questions: response.data.suggested_questions || [],
        timestamp: response.data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('[AI Service] Chat error:', error.message);
      throw error;
    }
  }

  /* -------------------------------- SYMPTOM ANALYSIS ------------------------------- */

  async analyzeSymptoms(symptoms, patientInfo = {}) {
    try {
      const response = await this.client.post('/analyze-symptoms', {
        symptoms,
        duration: patientInfo.duration || null,
        severity: patientInfo.severity || null,
        patient_age: patientInfo.age || null,
        patient_gender: patientInfo.gender || null,
        additional_info: patientInfo.additionalInfo || null
      });

      return {
        success: true,
        possible_conditions: response.data.possible_conditions,
        advice: response.data.advice,
        urgency_level: response.data.urgency_level,
        disclaimer: response.data.disclaimer,
        matched_symptoms: response.data.matched_symptoms || [],
        timestamp: response.data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('[AI Service] Symptom analysis error:', error.message);
      throw error;
    }
  }

  /* ------------------------------ ROUTINE RECOMMENDATIONS ------------------------------ */

  async getRoutineRecommendations(patientId, preferences = {}) {
    try {
      const response = await this.client.get(`/recommend-routine/${patientId}`, {
        params: {
          age: preferences.age || null,
          conditions: preferences.conditions ? preferences.conditions.join(',') : null
        }
      });

      return {
        success: true,
        diet_plan: response.data.diet_plan,
        exercise_plan: response.data.exercise_plan,
        sleep_recommendation: response.data.sleep_recommendation,
        medication_reminders: response.data.medication_reminders,
        wellness_tips: response.data.wellness_tips,
        generated_at: response.data.generated_at
      };
    } catch (error) {
      console.error('[AI Service] Routine recommendation error:', error.message);
      throw error;
    }
  }

  /* ----------------------------- STREAM CHAT (SIMULATION) ----------------------------- */

  async streamChatMessage(message, onChunk) {
    try {
      const response = await this.sendChatMessage(message);

      const words = response.response.split(' ');

      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + ' ');
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return response;
    } catch (error) {
      console.error('[AI Service] Stream error:', error.message);
      throw error;
    }
  }

  /* -------------------------------- HEALTH CHECK -------------------------------- */

  async checkHealth() {
    try {
      const healthURL = this.baseURL.replace('/api', '');

      const response = await axios.get(`${healthURL}/health`, {
        timeout: 5000
      });

      return {
        status: 'healthy',
        service: 'AI Service',
        details: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'AI Service',
        error: error.message
      };
    }
  }

  /* ------------------------------ ROUTINE TEMPLATES ------------------------------ */

  async getRoutineTemplates() {
    try {
      const response = await this.client.get('/templates');
      return response.data.templates;
    } catch (error) {
      console.error('[AI Service] Get templates error:', error.message);
      throw error;
    }
  }

  /* -------------------------------- SYMPTOM INFO -------------------------------- */

  async getSymptomInfo(symptom) {
    try {
      const response = await this.client.get(`/symptom/${encodeURIComponent(symptom)}`);
      return response.data;
    } catch (error) {
      console.error('[AI Service] Get symptom info error:', error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
