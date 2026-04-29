const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const medicationController = require('../controllers/medicationController')

router.use(protect)

// ⚠️ IMPORTANT: Specific routes MUST come before /:id
// Otherwise Express matches /reminders/today and /stats/adherence as an ID

router.get('/reminders/today',    medicationController.getTodayReminders)
router.put('/reminders/:id/taken', medicationController.markReminderTaken)
router.get('/stats/adherence',    medicationController.getAdherenceStats)
router.get('/patient/:patientId', medicationController.getPatientMedications)

// General CRUD
router.post('/',    medicationController.createMedication)
router.get('/',     medicationController.getMedications)
router.get('/:id',  medicationController.getMedicationById)
router.put('/:id',  medicationController.updateMedication)
router.delete('/:id', medicationController.deleteMedication)

module.exports = router