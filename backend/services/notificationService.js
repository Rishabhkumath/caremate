const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationService {
  async createNotification({ recipient, type, title, message, data = {}, priority = 'medium', actionUrl = null }) {
    try {
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        data,
        priority,
        actionUrl
      });

      // For high priority notifications, also send email
      if (priority === 'high' || priority === 'urgent') {
        const user = await User.findById(recipient);
        if (user && user.email) {
          await emailService.sendMail({
            to: user.email,
            subject: title,
            html: `<h2>${title}</h2><p>${message}</p>`
          });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async sendAppointmentReminder(appointment, doctor, patient) {
    const patientUser = await User.findById(patient.user);
    const doctorUser = await User.findById(doctor.user);

    // Notify patient
    await this.createNotification({
      recipient: patientUser._id,
      type: 'appointment_reminder',
      title: 'Upcoming Appointment Reminder',
      message: `You have an appointment with Dr. ${doctor.name} tomorrow at ${appointment.timeSlot.startTime}`,
      data: { appointmentId: appointment._id },
      priority: 'high',
      actionUrl: `/appointments/${appointment._id}`
    });

    // Notify doctor
    await this.createNotification({
      recipient: doctorUser._id,
      type: 'appointment_reminder',
      title: 'Upcoming Appointment',
      message: `You have an appointment with ${patientUser.name} tomorrow at ${appointment.timeSlot.startTime}`,
      data: { appointmentId: appointment._id },
      priority: 'medium',
      actionUrl: `/appointments/${appointment._id}`
    });
  }

  async sendMedicationReminder(medication, patient, scheduledTime) {
    const patientUser = await User.findById(patient.user);

    // Create notification for patient
    await this.createNotification({
      recipient: patientUser._id,
      type: 'medication_reminder',
      title: 'Medication Reminder',
      message: `Time to take ${medication.name} (${medication.dosage})`,
      data: {
        medicationId: medication._id,
        scheduledTime
      },
      priority: 'high',
      actionUrl: `/medications/${medication._id}`
    });

    // If medication not taken within 30 minutes, notify caregivers
    setTimeout(async () => {
      const reminder = await MedicationReminder.findOne({
        medication: medication._id,
        scheduledTime,
        status: 'pending'
      });

      if (reminder) {
        reminder.status = 'missed';
        reminder.escalated = true;
        await reminder.save();

        // Notify assigned caregivers
        const caregivers = await Caregiver.find({
          assignedPatients: patient._id
        }).populate('user');

        for (const caregiver of caregivers) {
          await this.createNotification({
            recipient: caregiver.user._id,
            type: 'medication_reminder',
            title: 'Missed Medication Alert',
            message: `${patientUser.name} missed their ${medication.name} medication scheduled for ${new Date(scheduledTime).toLocaleTimeString()}`,
            data: {
              patientId: patient._id,
              medicationId: medication._id
            },
            priority: 'urgent',
            actionUrl: `/caregiver/patients/${patient._id}`
          });
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  async sendVitalsAlert(patient, vitals) {
    const patientUser = await User.findById(patient.user);

    // Notify patient
    await this.createNotification({
      recipient: patientUser._id,
      type: 'vitals_alert',
      title: 'Abnormal Vitals Detected',
      message: `Alert: ${vitals.alerts.join(', ')}`,
      data: { vitalsId: vitals._id },
      priority: 'urgent',
      actionUrl: `/vitals/${vitals._id}`
    });

    // Notify primary doctor
    if (patient.primaryDoctor) {
      const doctor = await Doctor.findById(patient.primaryDoctor).populate('user');
      await this.createNotification({
        recipient: doctor.user._id,
        type: 'vitals_alert',
        title: `Abnormal Vitals Alert - ${patientUser.name}`,
        message: `Patient ${patientUser.name} has abnormal vitals: ${vitals.alerts.join(', ')}`,
        data: {
          patientId: patient._id,
          vitalsId: vitals._id
        },
        priority: 'urgent',
        actionUrl: `/doctor/patients/${patient._id}`
      });
    }

    // Notify assigned caregivers
    const caregivers = await Caregiver.find({
      assignedPatients: patient._id
    }).populate('user');

    for (const caregiver of caregivers) {
      await this.createNotification({
        recipient: caregiver.user._id,
        type: 'vitals_alert',
        title: `Abnormal Vitals Alert - ${patientUser.name}`,
        message: `Patient ${patientUser.name} has abnormal vitals: ${vitals.alerts.join(', ')}`,
        data: {
          patientId: patient._id,
          vitalsId: vitals._id
        },
        priority: 'urgent',
        actionUrl: `/caregiver/patients/${patient._id}`
      });
    }
  }

  async sendCaregiverLogSummary(log) {
    const patient = await Patient.findById(log.patient).populate('user');
    const patientUser = patient.user;

    await this.createNotification({
      recipient: patientUser._id,
      type: 'caregiver_log',
      title: 'Daily Caregiver Log Summary',
      message: `Your caregiver has completed today's care log`,
      data: { logId: log._id },
      priority: 'medium',
      actionUrl: `/caregiver-logs/${log._id}`
    });
  }

  async sendConsultationSummary(consultation) {
    const patient = await Patient.findById(consultation.patient).populate('user');
    const doctor = await Doctor.findById(consultation.doctor).populate('user');

    // Notify patient
    await this.createNotification({
      recipient: patient.user._id,
      type: 'consultation',
      title: 'Consultation Summary Available',
      message: `Your consultation with Dr. ${doctor.name} has been completed. Summary is now available.`,
      data: { consultationId: consultation._id },
      priority: 'medium',
      actionUrl: `/consultations/${consultation._id}`
    });
  }

  async sendSystemNotification(userId, title, message, data = {}) {
    return this.createNotification({
      recipient: userId,
      type: 'system',
      title,
      message,
      data,
      priority: 'low'
    });
  }

  async broadcastToRole(role, title, message, data = {}) {
    const users = await User.find({ role, isActive: true });
    
    for (const user of users) {
      await this.createNotification({
        recipient: user._id,
        type: 'system',
        title,
        message,
        data,
        priority: 'medium'
      });
    }
  }
}

module.exports = new NotificationService();