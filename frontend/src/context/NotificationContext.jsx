import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { notificationApi } from '../api/notificationApi'
import { medicationApi } from '../api/medicationApi'
import { useAuth } from '../hooks/useAuth'

export const NotificationContext = createContext(null)

const SOUND_STORAGE_KEY = 'caremate_reminder_sound'
const DURATION_STORAGE_KEY = 'caremate_reminder_duration'
const NOTIFICATION_POLL_INTERVAL = 30 * 1000
const REMINDER_POLL_INTERVAL = 10 * 1000
const REPEAT_REMINDER_WINDOW = 30 * 60 * 1000

const SOUND_OPTIONS = [
  { value: 'alarm', label: 'Alarm' },
  { value: 'chime', label: 'Chime' },
  { value: 'gentle', label: 'Gentle' },
]

const DURATION_OPTIONS = [
  { value: '3', label: '3 sec' },
  { value: '5', label: '5 sec' },
  { value: '10', label: '10 sec' },
]

const isUnread = (notification) => notification?.status === 'unread'

const getStoredValue = (storageKey, options, fallback) => {
  if (typeof window === 'undefined') return fallback
  const saved = window.localStorage.getItem(storageKey)
  return options.some((option) => option.value === saved) ? saved : fallback
}

const createSoundPattern = (soundProfile) => {
  if (soundProfile === 'gentle') {
    return [
      { frequency: 740, duration: 0.18, gain: 0.1, type: 'sine' },
      { frequency: 880, duration: 0.22, gain: 0.1, type: 'sine' },
    ]
  }

  if (soundProfile === 'chime') {
    return [
      { frequency: 880, duration: 0.2, gain: 0.16, type: 'sine' },
      { frequency: 988, duration: 0.22, gain: 0.16, type: 'sine' },
      { frequency: 1174, duration: 0.3, gain: 0.14, type: 'sine' },
    ]
  }

  return [
    { frequency: 880, duration: 0.35, gain: 0.24, type: 'square' },
    { frequency: 880, duration: 0.35, gain: 0.24, type: 'square' },
    { frequency: 784, duration: 0.45, gain: 0.22, type: 'square' },
    { frequency: 784, duration: 0.45, gain: 0.22, type: 'square' },
  ]
}

const playReminderSound = (soundProfile, durationSeconds) => {
  if (typeof window === 'undefined') return

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  const context = new AudioContextClass()
  const masterGain = context.createGain()
  masterGain.gain.setValueAtTime(0.9, context.currentTime)
  masterGain.connect(context.destination)

  const duration = Math.max(1, Number(durationSeconds) || 3)
  const basePattern = createSoundPattern(soundProfile)
  const cycleLength = soundProfile === 'alarm' ? 2.2 : soundProfile === 'chime' ? 1.5 : 1.2
  const cycleCount = Math.max(1, Math.ceil(duration / cycleLength))
  const events = []

  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    const cycleOffset = cycle * cycleLength
    basePattern.forEach((tone, index) => {
      const spacing = soundProfile === 'alarm' ? 0.55 : soundProfile === 'chime' ? 0.35 : 0.28
      const at = cycleOffset + index * spacing
      if (at + tone.duration <= duration + 0.1) {
        events.push({ ...tone, at })
      }
    })
  }

  events.forEach((tone) => {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.type = tone.type
    oscillator.frequency.setValueAtTime(tone.frequency, context.currentTime + tone.at)

    gainNode.gain.setValueAtTime(0.001, context.currentTime + tone.at)
    gainNode.gain.exponentialRampToValueAtTime(tone.gain, context.currentTime + tone.at + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + tone.at + tone.duration)

    oscillator.connect(gainNode)
    gainNode.connect(masterGain)
    oscillator.start(context.currentTime + tone.at)
    oscillator.stop(context.currentTime + tone.at + tone.duration)
  })

  window.setTimeout(() => {
    context.close().catch(() => {})
  }, (duration + 0.4) * 1000)
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundProfile, setSoundProfileState] = useState(() => getStoredValue(SOUND_STORAGE_KEY, SOUND_OPTIONS, 'alarm'))
  const [ringDuration, setRingDurationState] = useState(() => getStoredValue(DURATION_STORAGE_KEY, DURATION_OPTIONS, '10'))
  const { user } = useAuth()
  const notificationIntervalRef = useRef(null)
  const reminderIntervalRef = useRef(null)
  const seenNotificationIdsRef = useRef(new Set())
  const reminderRingTimesRef = useRef(new Map())

  const setSoundProfile = useCallback((value) => {
    if (!SOUND_OPTIONS.some((option) => option.value === value)) return
    setSoundProfileState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SOUND_STORAGE_KEY, value)
    }
  }, [])

  const setRingDuration = useCallback((value) => {
    if (!DURATION_OPTIONS.some((option) => option.value === value)) return
    setRingDurationState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DURATION_STORAGE_KEY, value)
    }
  }, [])

  const testReminderSound = useCallback(() => {
    playReminderSound(soundProfile, ringDuration)
  }, [ringDuration, soundProfile])

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      const { data } = await notificationApi.getAll()
      const payload = data?.data
      const list = payload?.notifications ?? data?.notifications ?? payload ?? []
      const arr = Array.isArray(list) ? list : []

      const unreadMedicationNotifications = arr.filter(
        (notification) => notification?.type === 'medication_reminder' && isUnread(notification)
      )

      const hasNewMedicationReminder = unreadMedicationNotifications.some(
        (notification) => !seenNotificationIdsRef.current.has(notification._id)
      )

      setNotifications(arr)
      setUnreadCount(arr.filter(isUnread).length)
      seenNotificationIdsRef.current = new Set(arr.map((notification) => notification._id))

      if (hasNewMedicationReminder) {
        playReminderSound(soundProfile, ringDuration)
      }
    } catch {
      // Polling errors should never crash the UI
    }
  }, [ringDuration, soundProfile, user])

  const pollMedicationReminders = useCallback(async () => {
    if (!user || user.role !== 'patient') return

    try {
      const { data } = await medicationApi.getTodayReminders()
      const list = data?.data ?? data ?? []
      const reminders = Array.isArray(list) ? list : []
      const now = Date.now()
      const activeReminderIds = new Set()

      reminders.forEach((reminder) => {
        if (!reminder?._id || reminder.status !== 'pending' || !reminder.scheduledTime) return

        const dueAt = new Date(reminder.scheduledTime).getTime()
        if (Number.isNaN(dueAt) || dueAt > now) return

        activeReminderIds.add(reminder._id)
        const lastRingAt = reminderRingTimesRef.current.get(reminder._id) ?? 0

        if (lastRingAt === 0 || now - lastRingAt >= REPEAT_REMINDER_WINDOW) {
          playReminderSound(soundProfile, ringDuration)
          reminderRingTimesRef.current.set(reminder._id, now)
        }
      })

      Array.from(reminderRingTimesRef.current.keys()).forEach((reminderId) => {
        if (!activeReminderIds.has(reminderId)) {
          reminderRingTimesRef.current.delete(reminderId)
        }
      })
    } catch {
      // Keep reminder polling silent on failure
    }
  }, [ringDuration, soundProfile, user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      seenNotificationIdsRef.current = new Set()
      reminderRingTimesRef.current = new Map()
      return
    }

    fetchNotifications()
    pollMedicationReminders()

    notificationIntervalRef.current = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL)
    reminderIntervalRef.current = setInterval(pollMedicationReminders, REMINDER_POLL_INTERVAL)

    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current)
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current)
    }
  }, [fetchNotifications, pollMedicationReminders, user])

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, status: 'read', readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, status: 'read', readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch {}
  }

  const removeNotification = async (id) => {
    try {
      const wasUnread = notifications.find((notification) => notification._id === id)?.status === 'unread'
      await notificationApi.delete(id)
      setNotifications((prev) => prev.filter((notification) => notification._id !== id))
      seenNotificationIdsRef.current.delete(id)
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundProfile,
        ringDuration,
        soundOptions: SOUND_OPTIONS,
        durationOptions: DURATION_OPTIONS,
        setSoundProfile,
        setRingDuration,
        testReminderSound,
        fetchNotifications,
        markRead,
        markAllRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
