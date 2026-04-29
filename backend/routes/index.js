const express = require('express')

const router = express.Router()

const authRoutes = require('./authRoutes')
const patientRoutes = require('./patientRoutes')
const doctorRoutes = require('./doctorRoutes')
const caregiverRoutes = require('./caregiverRoutes')
const adminRoutes = require('./adminRoutes')
const vitalsRoutes = require('./vitalsRoutes')
const medicationRoutes = require('./medicationRoutes')
const appointmentRoutes = require('./appointmentRoutes')
const consultationRoutes = require('./consultationRoutes')
const notificationRoutes = require('./notificationRoutes')
const aiRoutes = require('./aiRoutes')

router.use('/auth', authRoutes)
router.use('/patients', patientRoutes)
router.use('/doctors', doctorRoutes)
router.use('/caregivers', caregiverRoutes)
router.use('/admin', adminRoutes)

router.use('/vitals', vitalsRoutes)
router.use('/medications', medicationRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/consultations', consultationRoutes)
router.use('/notifications', notificationRoutes)

router.use('/ai', aiRoutes)

module.exports = router