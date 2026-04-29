const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect);
router.use(isAdmin);

router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/role', adminController.updateUserRole);
router.get('/doctors', adminController.getDoctors);
router.put('/doctors/:doctorId/verify', adminController.verifyDoctor);
router.put('/caregivers/:caregiverId/verify', adminController.verifyCaregiver);
router.get('/dashboard/stats', adminController.getDashboardStats);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;
