import { useState } from 'react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { MEDICATION_FREQUENCY } from '../../utils/constants'

const createInitialForm = (initialData) => ({
  name: initialData?.name ?? '',
  dosage: initialData?.dosage ?? '',
  frequency: initialData?.frequency ?? '',
  status: initialData?.status ?? 'active',
  times: Array.isArray(initialData?.timing)
    ? initialData.timing.map((item) => item?.time).filter(Boolean).join(', ')
    : '',
  startDate: initialData?.duration?.startDate ? String(initialData.duration.startDate).slice(0, 10) : '',
  endDate: initialData?.duration?.endDate ? String(initialData.duration.endDate).slice(0, 10) : '',
  instructions: initialData?.instructions ?? initialData?.notes ?? '',
})

const normalizeTimes = (timesText) =>
  timesText
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'discontinued', label: 'Discontinued' },
]

export default function MedicationForm({ initialData, onSubmit, onCancel, loading, showStatus = false }) {
  const [form, setForm] = useState(() => createInitialForm(initialData))

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency,
      times: normalizeTimes(form.times),
      instructions: form.instructions.trim(),
      ...(showStatus ? { status: form.status } : {}),
    }

    if (form.startDate || form.endDate) {
      payload.duration = {}
      if (form.startDate) payload.duration.startDate = form.startDate
      if (form.endDate) payload.duration.endDate = form.endDate
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Medication Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Metformin" required className="md:col-span-2" />
        <Input label="Dosage" name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g. 500mg" required />
        <Select label="Frequency" name="frequency" value={form.frequency} onChange={handleChange} options={MEDICATION_FREQUENCY} required />
        {showStatus && (
          <Select label="Status" name="status" value={form.status} onChange={handleChange} options={STATUS_OPTIONS} required />
        )}
        <Input label="Medicine Times" name="times" value={form.times} onChange={handleChange} placeholder="e.g. 08:00, 14:00, 20:00" className="md:col-span-2" hint="Use 24-hour times separated by commas." />
        <Input label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
        <Input label="End Date" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
        <Input label="Instructions" name="instructions" value={form.instructions} onChange={handleChange} placeholder="e.g. Take after meals" className="md:col-span-2" />
      </div>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="submit" loading={loading} fullWidth>Save Medication</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} fullWidth>Cancel</Button>}
      </div>
    </form>
  )
}
