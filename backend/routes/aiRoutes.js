/**
 * AI Routes - Connect Node.js backend to Python FastAPI AI service
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { apiLimiter, aiLimiter } = require('../middleware/rateLimiter');
const {
  chatWithAI,
  analyzeSymptoms,
  getRoutineRecommendations,
  streamChatResponse,
  getAIHealth,
  getSymptomInfo,
  getRoutineTemplates
} = require('../controllers/aiProxyController');

// Validation rules
const chatValidation = [
  body('message')
    .notEmpty().withMessage('Message is required')
    .isString().withMessage('Message must be a string')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
  body('context')
    .optional()
    .isObject().withMessage('Context must be an object')
];

const symptomValidation = [
  body('symptoms')
    .isArray({ min: 1, max: 20 }).withMessage('Symptoms must be an array with 1-20 items')
    .custom((symptoms) => {
      if (!symptoms.every(s => typeof s === 'string' && s.trim().length > 0)) {
        throw new Error('All symptoms must be non-empty strings');
      }
      return true;
    }),
  body('duration')
    .optional()
    .isString().withMessage('Duration must be a string'),
  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe']).withMessage('Severity must be mild, moderate, or severe'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Invalid gender value')
];

const routineValidation = [
  param('patientId')
    .isMongoId().withMessage('Invalid patient ID'),
  query('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  query('conditions')
    .optional()
    .isString().withMessage('Conditions must be a comma-separated string')
];

// Apply authentication to all routes
router.use(protect);

// Health check route (admin only)
router.get('/health', checkRole('admin'), getAIHealth);

// Chat endpoints
router.post(
  '/chat',
  apiLimiter,
  chatValidation,
  chatWithAI
);

// Streaming chat endpoint (for future implementation)
router.post(
  '/chat/stream',
  aiLimiter,
  chatValidation,
  streamChatResponse
);

// Symptom analysis endpoints
router.post(
  '/analyze-symptoms',
  aiLimiter,
  symptomValidation,
  analyzeSymptoms
);

// Symptom information
router.get(
  '/symptom/:symptom',
  [
    param('symptom')
      .isString().withMessage('Symptom must be a string')
      .trim()
      .toLowerCase()
  ],
  getSymptomInfo
);

// Routine recommendation endpoints
router.get(
  '/recommend-routine/:patientId',
  routineValidation,
  getRoutineRecommendations
);

// Routine templates
router.get(
  '/templates',
  getRoutineTemplates
);

// Batch symptom analysis (for multiple patients - doctor only)
router.post(
  '/batch/analyze-symptoms',
  checkRole('doctor', 'admin'),
  [
    body('analyses')
      .isArray({ min: 1, max: 10 }).withMessage('Analyses must be an array of 1-10 items')
  ],
  async (req, res, next) => {
    try {
      const { analyses } = req.body;
      const results = [];
      
      for (const analysis of analyses) {
        const result = await aiService.analyzeSymptoms(
          analysis.symptoms,
          analysis.patientInfo
        );
        results.push({
          patientId: analysis.patientId,
          ...result
        });
      }
      
      return successResponse(res, results);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;