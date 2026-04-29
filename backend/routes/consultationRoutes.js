const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isDoctor } = require('../middleware/roleMiddleware');
const consultationController = require('../controllers/consultationController');

router.use(protect);

router.get('/', consultationController.getConsultations);
router.get('/:id', consultationController.getConsultationById);

// Doctor only routes
router.post('/:appointmentId/start', isDoctor, consultationController.startConsultation);
router.put('/:id', isDoctor, consultationController.updateConsultation);
router.put('/:id/end', isDoctor, consultationController.endConsultation);
router.post('/:id/prescriptions', isDoctor, consultationController.addPrescription);
router.post('/:id/vitals', isDoctor, consultationController.addVitals);

module.exports = router;