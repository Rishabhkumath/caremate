const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { checkRole } = require('../middleware/roleMiddleware')
const doctorController = require('../controllers/doctorController')

// Public route — patients need to see all doctors to book appointments
router.get('/all', protect, doctorController.getAllDoctors)

// Protected routes
router.use(protect)
router.use(checkRole('doctor'))

router.get('/me', doctorController.getMyProfile)
router.put('/me', doctorController.updateMyProfile)
router.get('/dashboard/stats', doctorController.getDashboardStats)
router.get('/patients',        doctorController.getPatients)
router.get('/consultations',   doctorController.getConsultations)
router.get('/schedule',        doctorController.getSchedule)
router.get('/prescriptions',   doctorController.getPrescriptions)
router.post('/prescriptions',  doctorController.addPrescription)
router.post('/patients/:patientId/caregivers/:caregiverId/assign', doctorController.assignCaregiverToPatient)

router.get('/:id',    doctorController.getDoctorById)
router.put('/:id',    doctorController.updateDoctor)

module.exports = router
