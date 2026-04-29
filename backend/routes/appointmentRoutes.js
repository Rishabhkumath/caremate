const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const appointmentController = require('../controllers/appointmentController');

router.use(protect);

router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/available-slots', appointmentController.getAvailableSlots);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id/rate', appointmentController.rateAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
