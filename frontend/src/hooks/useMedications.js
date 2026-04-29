import { useState, useEffect, useCallback } from 'react'
import { medicationApi } from '../api/medicationApi'
import toast from 'react-hot-toast'

export const useMedications = (patientId) => {
  const [medications, setMedications] = useState([])
  const [reminders,   setReminders]   = useState([])
  const [loading,     setLoading]     = useState(false)

  const fetchMedications = useCallback(async () => {
    setLoading(true)
    try {
      let medsRes
      if (patientId) {
        // Doctor / caregiver viewing a specific patient
        medsRes = await medicationApi.getPatientMedications(patientId)
      } else {
        // Patient viewing their own (JWT identifies them)
        medsRes = await medicationApi.getAll()
      }

      const list = medsRes.data?.data ?? medsRes.data ?? []
      setMedications(Array.isArray(list) ? list : [])

      // Only fetch today's reminders for the logged-in patient
      if (!patientId) {
        try {
          const remRes = await medicationApi.getTodayReminders()
          const rems   = remRes.data?.data ?? remRes.data ?? []
          setReminders(Array.isArray(rems) ? rems : [])
        } catch {
          setReminders([])
        }
      }
    } catch (err) {
      if (err?.response) toast.error('Failed to load medications')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { fetchMedications() }, [fetchMedications])

  const addMedication = async (data) => {
    const res = await medicationApi.create(data)
    await fetchMedications()
    return res.data
  }

  const updateMedication = async (id, data) => {
    await medicationApi.update(id, data)
    await fetchMedications()
  }

  const deleteMedication = async (id) => {
    await medicationApi.delete(id)
    setMedications(prev => prev.filter(m => m._id !== id))
  }

  return {
    medications, reminders, loading,
    fetchMedications, addMedication, updateMedication, deleteMedication
  }
}