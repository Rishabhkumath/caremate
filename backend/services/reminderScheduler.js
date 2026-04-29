const cron = require('node-cron');
const Medication = require('../models/Medication');
const MedicationReminder = require('../models/MedicationReminder');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

class ReminderScheduler {
  constructor() {
    this.scheduledJobs = new Map();
  }

  initialize() {
    // Check medication reminders every minute
    cron.schedule('* * * * *', () => {
      this.checkMedicationReminders();
    });

    // Check appointment reminders every hour
    cron.schedule('0 * * * *', () => {
      this.checkAppointmentReminders();
    });

    // Generate daily medication reminders at midnight
    cron.schedule('0 0 * * *', () => {
      this.generateDailyReminders();
    });

    console.log('Reminder scheduler initialized');
  }

  async checkMedicationReminders() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      // Find medications that need reminders
      const medications = await Medication.find({
        status: 'active',
        'duration.endDate': { $gte: now }
      }).populate('patient');

      for (const medication of medications) {
        const patient = await Patient.findById(medication.patient).populate('user');
        
        // Check if reminder needed for current time
        const timing = medication.timing.find(t => t.time === currentTime);
        
        if (timing && !timing.taken) {
          // Check if reminder already sent today
          const existingReminder = await MedicationReminder.findOne({
            medication: medication._id,
            scheduledTime: {
              $gte: new Date(now.setHours(0, 0, 0, 0)),
              $lt: new Date(now.setHours(23, 59, 59, 999))
            },
            status: 'pending'
          });

          if (!existingReminder) {
            // Create reminder
            const scheduledTime = new Date();
            scheduledTime.setHours(parseInt(currentTime.split(':')[0]));
            scheduledTime.setMinutes(parseInt(currentTime.split(':')[1]));

            const reminder = await MedicationReminder.create({
              patient: medication.patient,
              medication: medication._id,
              scheduledTime,
              dose: medication.dosage,
              status: 'pending'
            });

            // Send notifications
            await notificationService.sendMedicationReminder(
              medication,
              patient,
              scheduledTime
            );

            await emailService.sendMedicationReminder(
              patient.user.email,
              medication
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking medication reminders:', error);
    }
  }

  async checkAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Find appointments for tomorrow
      const appointments = await Appointment.find({
        date: {
          $gte: tomorrow,
          $lt: dayAfter
        },
        status: 'scheduled'
      })
        .populate('patient')
        .populate('doctor');

      for (const appointment of appointments) {
        const patient = await Patient.findById(appointment.patient).populate('user');
        const doctor = await Doctor.findById(appointment.doctor).populate('user');

        await notificationService.sendAppointmentReminder(
          appointment,
          doctor,
          patient
        );

        await emailService.sendAppointmentReminder(
          patient.user.email,
          appointment,
          doctor
        );
      }
    } catch (error) {
      console.error('Error checking appointment reminders:', error);
    }
  }

  async generateDailyReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all active medications
      const medications = await Medication.find({
        status: 'active',
        'duration.endDate': { $gte: tomorrow }
      }).populate('patient');

      for (const medication of medications) {
        // Create reminders for each scheduled time
        for (const timing of medication.timing) {
          const [hours, minutes] = timing.time.split(':');
          const scheduledTime = new Date(tomorrow);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          await MedicationReminder.create({
            patient: medication.patient,
            medication: medication._id,
            scheduledTime,
            dose: medication.dosage,
            status: 'pending'
          });
        }
      }

      console.log('Daily medication reminders generated');
    } catch (error) {
      console.error('Error generating daily reminders:', error);
    }
  }

  scheduleMedicationReminders(medication) {
    // Clear existing jobs for this medication
    if (this.scheduledJobs.has(medication._id.toString())) {
      this.scheduledJobs.get(medication._id.toString()).forEach(job => job.stop());
    }

    const jobs = [];

    // Schedule job for each timing
    for (const timing of medication.timing) {
      const [hours, minutes] = timing.time.split(':');
      
      // Create cron expression for daily at this time
      const cronExpression = `${minutes} ${hours} * * *`;
      
      const job = cron.schedule(cronExpression, async () => {
        await this.sendScheduledReminder(medication, timing.time);
      });

      jobs.push(job);
    }

    this.scheduledJobs.set(medication._id.toString(), jobs);
  }

  async sendScheduledReminder(medication, time) {
    try {
      const patient = await Patient.findById(medication.patient).populate('user');
      const scheduledTime = new Date();
      const [hours, minutes] = time.split(':');
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const reminder = await MedicationReminder.create({
        patient: medication.patient,
        medication: medication._id,
        scheduledTime,
        dose: medication.dosage,
        status: 'pending'
      });

      await notificationService.sendMedicationReminder(
        medication,
        patient,
        scheduledTime
      );
    } catch (error) {
      console.error('Error sending scheduled reminder:', error);
    }
  }

  rescheduleMedicationReminders(medication) {
    this.scheduleMedicationReminders(medication);
  }

  async checkMissedReminders() {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Find pending reminders older than 1 hour
      const missedReminders = await MedicationReminder.find({
        status: 'pending',
        scheduledTime: { $lt: oneHourAgo }
      }).populate('medication').populate('patient');

      for (const reminder of missedReminders) {
        reminder.status = 'missed';
        await reminder.save();

        const patient = await Patient.findById(reminder.patient).populate('user');
        
        // Escalate to caregivers
        const caregivers = await Caregiver.find({
          assignedPatients: reminder.patient
        }).populate('user');

        for (const caregiver of caregivers) {
          await notificationService.createNotification({
            recipient: caregiver.user._id,
            type: 'medication_reminder',
            title: 'Missed Medication Alert',
            message: `${patient.user.name} missed their ${reminder.medication.name} medication`,
            data: {
              patientId: reminder.patient,
              medicationId: reminder.medication._id,
              reminderId: reminder._id
            },
            priority: 'urgent'
          });
        }
      }
    } catch (error) {
      console.error('Error checking missed reminders:', error);
    }
  }
}

module.exports = new ReminderScheduler();