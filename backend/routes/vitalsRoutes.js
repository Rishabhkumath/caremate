const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const vitalsController = require('../controllers/vitalsController');

router.use(protect);

router.post('/', vitalsController.createVitals);
router.get('/', vitalsController.getVitals);
router.get('/stats', vitalsController.getVitalsStats);

// Doctor/Caregiver access to patient vitals
router.get('/patient/:patientId', vitalsController.getVitals);
router.get('/patient/:patientId/stats', vitalsController.getVitalsStats);

router.get('/:id', vitalsController.getVitalsById);
router.put('/:id', vitalsController.updateVitals);
router.delete('/:id', vitalsController.deleteVitals);
router.post('/:id/check-alert', vitalsController.checkVitalsAlert);

module.exports = router;
