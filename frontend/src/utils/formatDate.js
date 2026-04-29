import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

const DASH = '-'

const toValidDate = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const parsed = parseISO(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const formatSlotTime = (time) => {
  if (!time) return null
  if (/[ap]m/i.test(time)) {
    return String(time)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/am/i, 'AM')
      .replace(/pm/i, 'PM')
  }

  const match = String(time).match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return String(time)

  const [, hours, minutes] = match
  const dt = new Date()
  dt.setHours(Number(hours), Number(minutes), 0, 0)
  return format(dt, 'h:mm a')
}

export const getAppointmentDateTime = (appointment) => {
  if (!appointment) return null
  if (appointment instanceof Date || typeof appointment === 'string') return toValidDate(appointment)

  const baseDate = toValidDate(appointment.dateTime || appointment.date)
  if (!baseDate) return null

  const startTime = appointment.timeSlot?.startTime
  if (!startTime) return baseDate

  const match = String(startTime).match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return baseDate

  const [, hours, minutes] = match
  const next = new Date(baseDate)
  next.setHours(Number(hours), Number(minutes), 0, 0)
  return next
}

export const formatDate = (date, pattern = 'MMM d, yyyy') => {
  const d = toValidDate(date)
  if (!d) return DASH
  return format(d, pattern)
}

export const formatDateTime = (date) => {
  const d = toValidDate(date)
  if (!d) return DASH
  return format(d, 'MMM d, yyyy · h:mm a')
}

export const formatTime = (date) => {
  const d = toValidDate(date)
  if (!d) return DASH
  return format(d, 'h:mm a')
}

export const formatRelative = (date) => {
  const d = toValidDate(date)
  if (!d) return DASH
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`
  return formatDistanceToNow(d, { addSuffix: true })
}

export const formatShortDate = (date) => {
  const d = toValidDate(date)
  if (!d) return DASH
  return format(d, 'MMM d')
}

export const formatAppointmentDate = (appointment, pattern = 'MMM d, yyyy') => {
  const d = getAppointmentDateTime(appointment)
  if (!d) return DASH
  return format(d, pattern)
}

export const formatAppointmentTime = (appointment) => {
  if (!appointment) return DASH

  const start = formatSlotTime(appointment.timeSlot?.startTime)
  const end = formatSlotTime(appointment.timeSlot?.endTime)
  if (start && end && start === end) return start
  if (start && end) return `${start} - ${end}`
  if (start) return start

  const d = getAppointmentDateTime(appointment)
  return d ? format(d, 'h:mm a').toUpperCase() : DASH
}

export const formatAppointmentRelative = (appointment) => {
  const d = getAppointmentDateTime(appointment)
  if (!d) return DASH

  const timeLabel = formatAppointmentTime(appointment)
  if (isToday(d)) return `Today, ${timeLabel}`
  if (isYesterday(d)) return `Yesterday, ${timeLabel}`
  return `${format(d, 'MMM d, yyyy')} · ${timeLabel}`
}
