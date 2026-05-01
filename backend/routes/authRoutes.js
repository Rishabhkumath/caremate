const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  googleLogin,
  getGoogleConfig,
  forgotPassword,
  resetPassword,
  logout,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'caregiver', 'admin'])
    .withMessage('Invalid role'),
  body('adminSetupKey')
    .if(body('role').equals('admin'))
    .notEmpty()
    .withMessage('Admin setup key is required'),
  body('specialization')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Please add specialization'),
  body('licenseNumber')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Please add license number'),
  body('consultationFee')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Please add consultation fee')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', authLimiter, googleLogin);
router.get('/google/config', getGoogleConfig);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
