/**
 * AI Proxy Controller - Handles AI service requests
 * Routes requests to Python FastAPI microservice
 */

const aiService = require('../services/aiService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

/**
 * @desc    Send message to AI chatbot
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chatWithAI = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation error', 400, errors.array());
    }

    const { message, context } = req.body;

    // Add patient context if available
    const enrichedContext = {
      ...context,
      userId: req.user._id,
      userRole: req.user.role,
      timestamp: new Date().toISOString()
    };

    // Forward to AI service
    const aiResponse = await aiService.sendChatMessage(message, enrichedContext);

    // Log the interaction (for analytics)
    console.log(`[AI Chat] User: ${req.user._id}, Message length: ${message.length}`);

    return successResponse(
      res,
      aiResponse,
      'AI response generated successfully'
    );
  } catch (error) {
    console.error('[AI Proxy] Chat error:', error);
    
    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      return errorResponse(
        res,
        'AI service is currently unavailable. Please try again later.',
        503
      );
    }
    
    if (error.response?.status === 429) {
      return errorResponse(
        res,
        'AI service rate limit exceeded. Please try again later.',
        429
      );
    }

    if (error.statusCode) {
      return errorResponse(
        res,
        error.message || 'AI service request failed.',
        error.statusCode
      );
    }

    next(error);
  }
};

/**
 * @desc    Analyze symptoms using AI
 * @route   POST /api/ai/analyze-symptoms
 * @access  Private
 */
const analyzeSymptoms = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation error', 400, errors.array());
    }

    const { symptoms, duration, severity } = req.body;

    // Prepare patient info from user data
    const patientInfo = {
      age: req.body.age || null,
      gender: req.body.gender || null,
      duration,
      severity,
      additionalInfo: req.body.additionalInfo || ''
    };

    // Forward to AI service
    const analysisResult = await aiService.analyzeSymptoms(symptoms, patientInfo);

    // Check urgency and potentially trigger alerts
    if (analysisResult.urgency_level === 'emergency' || analysisResult.urgency_level === 'urgent') {
      console.log(`[AI Alert] Urgent symptoms detected for user ${req.user._id}`);
      
      // Trigger notification service if needed
      if (req.app.get('notificationService')) {
        await req.app.get('notificationService').createNotification({
          recipient: req.user._id,
          type: 'vitals_alert',
          title: 'Urgent Symptom Analysis',
          message: `Your symptoms require ${analysisResult.urgency_level} attention. Please consult a healthcare provider.`,
          data: { analysis: analysisResult }
        });
      }
    }

    return successResponse(
      res,
      analysisResult,
      'Symptom analysis completed'
    );
  } catch (error) {
    console.error('[AI Proxy] Symptom analysis error:', error);
    next(error);
  }
};

/**
 * @desc    Get daily routine recommendations
 * @route   GET /api/ai/recommend-routine/:patientId
 * @access  Private
 */
const getRoutineRecommendations = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    // Verify access permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return errorResponse(res, 'Unauthorized to access this patient\'s data', 403);
    }

    // Get patient preferences from request or database
    const preferences = {
      age: req.query.age,
      conditions: req.query.conditions ? req.query.conditions.split(',') : []
    };

    const routine = await aiService.getRoutineRecommendations(patientId, preferences);

    return successResponse(
      res,
      routine,
      'Routine recommendations generated'
    );
  } catch (error) {
    console.error('[AI Proxy] Routine recommendation error:', error);
    next(error);
  }
};

/**
 * @desc    Stream chat response
 * @route   POST /api/ai/chat/stream
 * @access  Private
 */
const streamChatResponse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation error', 400, errors.array());
    }

    const { message } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream response
    await aiService.streamChatMessage(message, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[AI Proxy] Stream error:', error);
    next(error);
  }
};

/**
 * @desc    Get AI service health status
 * @route   GET /api/ai/health
 * @access  Admin
 */
const getAIHealth = async (req, res, next) => {
  try {
    const health = await aiService.checkHealth();
    return successResponse(res, health);
  } catch (error) {
    console.error('[AI Proxy] Health check error:', error);
    next(error);
  }
};

/**
 * @desc    Get symptom information
 * @route   GET /api/ai/symptom/:symptom
 * @access  Private
 */
const getSymptomInfo = async (req, res, next) => {
  try {
    const { symptom } = req.params;
    
    if (!symptom) {
      return errorResponse(res, 'Symptom parameter is required', 400);
    }

    const info = await aiService.getSymptomInfo(symptom);
    return successResponse(res, info);
  } catch (error) {
    console.error('[AI Proxy] Symptom info error:', error);
    next(error);
  }
};

/**
 * @desc    Get routine templates
 * @route   GET /api/ai/templates
 * @access  Private
 */
const getRoutineTemplates = async (req, res, next) => {
  try {
    const templates = await aiService.getRoutineTemplates();
    return successResponse(res, templates);
  } catch (error) {
    console.error('[AI Proxy] Templates error:', error);
    next(error);
  }
};

module.exports = {
  chatWithAI,
  analyzeSymptoms,
  getRoutineRecommendations,
  streamChatResponse,
  getAIHealth,
  getSymptomInfo,
  getRoutineTemplates
};
