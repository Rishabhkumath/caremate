import { useState, useEffect, useCallback } from 'react'
import { appointmentApi } from '../api/appointmentApi'
import toast from 'react-hot-toast'

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await appointmentApi.getAll()
      const list = data?.data ?? data?.appointments ?? []
      setAppointments(Array.isArray(list) ? list : [])
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const createAppointment = async (data) => {
    const res = await appointmentApi.create(data)
    await fetchAppointments()
    return res.data
  }

  const updateAppointment = async (id, data) => {
    await appointmentApi.update(id, data)
    await fetchAppointments()
  }

  const cancelAppointment = async (id) => {
    await appointmentApi.cancel(id)
    setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a))
  }

  const rateAppointment = async (id, data) => {
    const res = await appointmentApi.rateDoctor(id, data)
    const updated = res.data?.data ?? res.data
    setAppointments(prev => prev.map(a => a._id === id ? updated : a))
    return res.data
  }

  return { appointments, loading, fetchAppointments, createAppointment, updateAppointment, cancelAppointment, rateAppointment }
}
