const nodemailer = require('nodemailer')

class EmailService {
  constructor() {
    this.enabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
    this.transporter = null
    if (this.enabled) this._init()
  }

  _init() {
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const hasRealCredentials =
      emailUser &&
      emailPass &&
      emailUser !== 'your-email@gmail.com' &&
      emailUser !== 'youremail@gmail.com' &&
      emailPass !== 'your-app-specific-password' &&
      emailPass !== 'abcdefghijklmnop'

    if (!hasRealCredentials) {
      this.enabled = false
      console.warn('[Email DISABLED] Missing valid SMTP credentials in backend/.env')
      return
    }

    this.transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
      port:   parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }

  // Core send — never throws, always logs
  async sendMail({ to, subject, html, text }) {
    if (!this.enabled || !this.transporter) {
      console.log(`[Email DISABLED] To: ${to} | Subject: ${subject}`)
      return { skipped: true }
    }
    try {
      const info = await this.transporter.sendMail({
        from: `"CareMate" <${process.env.EMAIL_FROM || 'noreply@caremate.com'}>`,
        to, subject, html, text,
      })
      console.log(`[Email SENT] ${info.messageId}`)
      return info
    } catch (err) {
      console.error('[Email ERROR]', err.message)
      return { error: err.message }   // never throw — email failure must not crash the API
    }
  }

  // ── Templates ─────────────────────────────────────────

  async sendPasswordResetEmail(userEmail, resetToken) {
    const url = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    return this.sendMail({
      to: userEmail,
      subject: 'Reset your CareMate password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">Reset your password</h2>
          <p style="color:#64748b;margin:0 0 24px">
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${url}"
             style="display:inline-block;padding:12px 28px;background:#2a7de1;color:#fff;
                    text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">
            Reset Password
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendWelcomeEmail(userEmail, userName) {
    return this.sendMail({
      to: userEmail,
      subject: 'Welcome to CareMate!',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">Welcome, ${userName}! 👋</h2>
          <p style="color:#64748b;margin:0 0 24px">
            Your CareMate account is ready. Start tracking vitals, managing medications, and booking appointments.
          </p>
          <a href="${process.env.CLIENT_URL}/dashboard"
             style="display:inline-block;padding:12px 28px;background:#2a7de1;color:#fff;
                    text-decoration:none;border-radius:8px;font-weight:600">
            Go to Dashboard
          </a>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendMedicationReminder(userEmail, medication) {
    return this.sendMail({
      to: userEmail,
      subject: `Medication Reminder: ${medication.name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">💊 Time for your medication</h2>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0">
            <p style="font-weight:600;color:#0f172a;margin:0">${medication.name}</p>
            <p style="color:#64748b;font-size:14px;margin:4px 0 0">Dosage: ${medication.dosage}</p>
            ${medication.instructions ? `<p style="color:#64748b;font-size:14px;margin:4px 0 0">${medication.instructions}</p>` : ''}
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendAppointmentConfirmation(userEmail, appointment, doctorName) {
    const date = new Date(appointment.date).toLocaleDateString('en-IN', { dateStyle: 'full' })
    return this.sendMail({
      to: userEmail,
      subject: 'Appointment Confirmed – CareMate',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">📅 Appointment Confirmed</h2>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0">
            <p style="color:#64748b;font-size:13px;margin:0">Doctor</p>
            <p style="font-weight:600;color:#0f172a;margin:4px 0 12px">Dr. ${doctorName}</p>
            <p style="color:#64748b;font-size:13px;margin:0">Date</p>
            <p style="font-weight:600;color:#0f172a;margin:4px 0 0">${date}</p>
            ${appointment.timeSlot ? `
            <p style="color:#64748b;font-size:13px;margin:12px 0 0">Time</p>
            <p style="font-weight:600;color:#0f172a;margin:4px 0 0">
              ${appointment.timeSlot.startTime}${appointment.timeSlot.endTime ? ' – ' + appointment.timeSlot.endTime : ''}
            </p>` : ''}
          </div>
          <p style="color:#64748b;font-size:14px">Please arrive 10 minutes early.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendAppointmentReminder(userEmail, appointment, doctorName) {
    const date = new Date(appointment.date).toLocaleDateString('en-IN', { dateStyle: 'full' })
    return this.sendMail({
      to: userEmail,
      subject: 'Reminder: Appointment Tomorrow – CareMate',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">⏰ Appointment Tomorrow</h2>
          <p style="color:#64748b;margin:0 0 16px">
            Don't forget your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong>
            ${appointment.timeSlot ? ` at <strong>${appointment.timeSlot.startTime}</strong>` : ''}.
          </p>
          <p style="color:#64748b;font-size:14px">Remember to bring your ID and any relevant documents.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendVitalsAlert(userEmail, patientName, vitals) {
    return this.sendMail({
      to: userEmail,
      subject: '⚠️ Abnormal Vitals Detected – CareMate',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#dc2626;margin:0 0 8px">⚠️ Abnormal Vitals Alert</h2>
          <p style="color:#64748b;margin:0 0 16px">Dear ${patientName}, the following abnormal readings were detected:</p>
          <ul style="color:#0f172a;padding-left:20px;margin:0 0 16px">
            ${(vitals.alerts || []).map(a => `<li style="margin-bottom:6px"><strong>${a}</strong></li>`).join('')}
          </ul>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:16px 0">
            ${vitals.bloodPressure?.systolic ? `<p style="margin:0 0 4px;font-size:14px">🩺 BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg</p>` : ''}
            ${vitals.heartRate?.value ? `<p style="margin:0 0 4px;font-size:14px">❤️ Heart Rate: ${vitals.heartRate.value} bpm</p>` : ''}
            ${vitals.oxygenSaturation?.value ? `<p style="margin:0 0 4px;font-size:14px">🫁 SpO₂: ${vitals.oxygenSaturation.value}%</p>` : ''}
            ${vitals.temperature?.value ? `<p style="margin:0;font-size:14px">🌡️ Temp: ${vitals.temperature.value}°${vitals.temperature.unit === 'celsius' ? 'C' : 'F'}</p>` : ''}
          </div>
          <p style="color:#dc2626;font-weight:600">
            If you're experiencing symptoms, contact your doctor or call emergency services immediately.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }

  async sendCaregiverLogSummary(userEmail, patientName, log) {
    const date = new Date(log.date).toLocaleDateString()
    return this.sendMail({
      to: userEmail,
      subject: `Caregiver Log for ${patientName} – CareMate`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#0f172a;margin:0 0 8px">📋 Daily Care Log – ${date}</h2>
          <p style="color:#64748b;margin:0 0 16px">Summary for <strong>${patientName}</strong></p>
          ${log.observations ? `<p style="color:#0f172a"><strong>Observations:</strong> ${log.observations}</p>` : ''}
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
          <p style="color:#94a3b8;font-size:12px;margin:0">The CareMate Team</p>
        </div>
      `,
    })
  }
}

module.exports = new EmailService()
