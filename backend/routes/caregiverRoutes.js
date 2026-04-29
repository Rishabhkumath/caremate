const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isCaregiver } = require('../middleware/roleMiddleware');
const caregiverController = require('../controllers/caregiverController');

router.use(protect);

router.get('/all', caregiverController.getAllCaregivers);

router.use(isCaregiver);

router.get('/profile', caregiverController.getCaregiverProfile);
router.put('/profile', caregiverController.updateCaregiverProfile);
router.get('/patients', caregiverController.getAssignedPatients);
router.get('/patients/:patientId', caregiverController.getPatientDetails);
router.post('/patients/:patientId/logs', caregiverController.createCaregiverLog);
router.put('/logs/:logId', caregiverController.updateCaregiverLog);
router.get('/logs/today', caregiverController.getTodayLogs);
router.get('/tasks', caregiverController.getTasks);
router.get('/stats', caregiverController.getCaregiverStats);
router.put('/reminders/:reminderId/administer', caregiverController.administerMedication);

module.exports = router;
