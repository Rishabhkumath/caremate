import { useState, useEffect, useCallback } from 'react'
import { vitalsApi } from '../api/vitalsApi'
import toast from 'react-hot-toast'

export const useVitals = (patientId) => {
  const [vitals,  setVitals]  = useState([])
  const [latest,  setLatest]  = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchVitals = useCallback(async () => {
    setLoading(true)
    try {
      let res
      if (patientId) {
        // Doctor / caregiver viewing a specific patient
        res = await vitalsApi.getPatientHistory(patientId, { days: 30 })
      } else {
        // Patient viewing their own vitals (identified by JWT)
        res = await vitalsApi.getHistory({ days: 30 })
      }

      // Backend successResponse wraps in { success, data }
      // data is the array directly (see vitalsController.getVitals)
      const raw = res.data?.data ?? res.data ?? []
      const arr = Array.isArray(raw) ? raw : []

      setVitals(arr)
      setLatest(arr.length > 0 ? arr[0] : null) // sorted -recordedAt so [0] is latest
    } catch (err) {
      // Only show toast when backend actually responded with an error
      if (err?.response) toast.error('Failed to load vitals')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { fetchVitals() }, [fetchVitals])

  // Map flat frontend form fields → nested backend schema
  const logVital = async (formData) => {
    const payload = {
      bloodPressure: {
        systolic:  Number(formData.systolic),
        diastolic: Number(formData.diastolic),
      },
      heartRate: {
        value: Number(formData.heartRate),
      },
      oxygenSaturation: {
        value: Number(formData.oxygenLevel),
      },
      ...(formData.temperature ? {
        temperature: {
          value: Number(formData.temperature),
          unit: 'fahrenheit',
        }
      } : {}),
      notes: formData.notes || '',
    }

    const { data } = await vitalsApi.log(payload)
    await fetchVitals()
    return data
  }

  return { vitals, latest, loading, fetchVitals, logVital }
}