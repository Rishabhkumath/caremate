import { useState } from 'react'
import { Activity } from 'lucide-react'
import toast from 'react-hot-toast'

import { useVitals } from '../../hooks/useVitals'
import Input from '../common/Input'
import Button from '../common/Button'

const INITIAL = {
  systolic: '',
  diastolic: '',
  heartRate: '',
  oxygenLevel: '',
  temperature: '',
  notes: '',
}

export default function VitalsForm({ onSuccess, patientId, logVital: logVitalProp }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const { logVital } = useVitals(patientId)
  const submitVital = logVitalProp || logVital

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.systolic || !form.diastolic) return 'Blood pressure is required'
    if (!form.heartRate) return 'Heart rate is required'
    if (!form.oxygenLevel) return 'Oxygen level is required'

    const sys = Number(form.systolic)
    const dia = Number(form.diastolic)
    const hr = Number(form.heartRate)
    const o2 = Number(form.oxygenLevel)

    if (Number.isNaN(sys) || sys < 50 || sys > 250) return 'Systolic BP must be 50-250 mmHg'
    if (Number.isNaN(dia) || dia < 30 || dia > 150) return 'Diastolic BP must be 30-150 mmHg'
    if (Number.isNaN(hr) || hr < 20 || hr > 300) return 'Heart rate must be 20-300 bpm'
    if (Number.isNaN(o2) || o2 < 50 || o2 > 100) return 'Oxygen level must be 50-100%'

    if (form.temperature) {
      const temp = Number(form.temperature)
      if (Number.isNaN(temp) || temp < 90 || temp > 115) {
        return 'Temperature must be 90-115 F'
      }
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }

    setSaving(true)
    try {
      await submitVital(form)
      toast.success('Vitals logged successfully!')
      setForm(INITIAL)
      onSuccess?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to log vitals')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Systolic BP"
          name="systolic"
          type="number"
          value={form.systolic}
          onChange={handleChange}
          placeholder="120"
          hint="mmHg"
          required
        />
        <Input
          label="Diastolic BP"
          name="diastolic"
          type="number"
          value={form.diastolic}
          onChange={handleChange}
          placeholder="80"
          hint="mmHg"
          required
        />
        <Input
          label="Heart Rate"
          name="heartRate"
          type="number"
          value={form.heartRate}
          onChange={handleChange}
          placeholder="72"
          hint="bpm"
          required
        />
        <Input
          label="Oxygen Level (SpO2)"
          name="oxygenLevel"
          type="number"
          value={form.oxygenLevel}
          onChange={handleChange}
          placeholder="98"
          hint="%"
          required
        />
        <Input
          label="Temperature (optional)"
          name="temperature"
          type="number"
          value={form.temperature}
          onChange={handleChange}
          placeholder="98.6"
          hint="F"
          className="md:col-span-2"
        />
      </div>

      <div>
        <label className="label-text">Notes (optional)</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="input-field resize-none"
          rows={3}
          placeholder="Any symptoms or observations..."
        />
      </div>

      <Button type="submit" fullWidth loading={saving} icon={Activity}>
        Log Vitals
      </Button>
    </form>
  )
}
