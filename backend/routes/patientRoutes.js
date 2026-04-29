const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isPatient } = require('../middleware/roleMiddleware');
const patientController = require('../controllers/patientController');

router.use(protect);
router.use(isPatient);

router.get('/profile', patientController.getPatientProfile);
router.put('/profile', patientController.updatePatientProfile);
router.get('/vitals', patientController.getPatientVitals);
router.post('/vitals', patientController.recordVitals);
router.get('/appointments', patientController.getAppointments);
router.get('/medications', patientController.getMedications);
router.get('/caregiver-logs', patientController.getCaregiverLogs);
router.post('/caregivers/:caregiverId/approve', patientController.approveCaregiver);

module.exports = router;
