import { useState, useEffect } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { doctorApi } from '../../api/doctorApi'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'in-person', label: 'In-Person' },
  { value: 'video', label: 'Video Call' },
  { value: 'phone', label: 'Phone Call' },
]

const INITIAL = { doctorId: '', date: '', timeSlot: '', type: 'in-person', reason: '' }

export default function AppointmentForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL)
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  useEffect(() => {
    let active = true

    doctorApi.getAll()
      .then((response) => {
        if (!active) return
        const list = response.data?.data ?? response.data ?? []
        setDoctors(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!active) return
        setDoctors([])
      })
      .finally(() => {
        if (active) setLoadingDoctors(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.doctorId) return toast.error('Please select a doctor')
    if (!form.date) return toast.error('Please select a date')

    onSubmit({
      doctorId: form.doctorId,
      date: form.date,
      timeSlot: form.timeSlot
        ? { startTime: form.timeSlot }
        : undefined,
      type: form.type,
      reason: form.reason.trim(),
    })
  }

  const doctorOptions = doctors.map((doctor) => ({
    value: doctor._id,
    label: `Dr. ${doctor.user?.name || doctor.name || 'Doctor'}${doctor.specialization ? ` - ${doctor.specialization}` : ''}${doctor.rating ? ` - ${doctor.rating}/5` : ''}${doctor.isVerified ? ' - Verified' : ''}`,
  }))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Select Doctor"
        name="doctorId"
        value={form.doctorId}
        onChange={handleChange}
        options={doctorOptions}
        placeholder={loadingDoctors ? 'Loading doctors...' : doctorOptions.length === 0 ? 'No doctors available' : 'Choose a doctor'}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input label="Date" name="date" type="date" value={form.date} onChange={handleChange} required />
        <Input label="Preferred Time" name="timeSlot" type="time" value={form.timeSlot} onChange={handleChange} hint="Optional" />
      </div>

      <Select label="Appointment Type" name="type" value={form.type} onChange={handleChange} options={TYPES} />

      <div>
        <label className="label-text">Reason for Visit</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={handleChange}
          className="input-field resize-none"
          rows={3}
          placeholder="Briefly describe your concern..."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" loading={loading} fullWidth>Book Appointment</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
