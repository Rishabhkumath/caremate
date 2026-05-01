import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { caregiverApi } from '../../api/caregiverApi'
import { formatDateTime, formatRelative } from '../../utils/formatDate'
import toast from 'react-hot-toast'
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Folder,
  Pill,
  CheckCircle,
  Search,
  Stethoscope,
} from 'lucide-react'

const taskIcons = {
  medication: Pill,
  consultation_follow_up: Calendar,
  consultation_care_plan: ClipboardList,
  consultation_medication_monitoring: Stethoscope,
  daily_log: ClipboardList,
}

const taskLabels = {
  medication: 'Medication reminder',
  consultation_follow_up: 'Consultation follow-up',
  consultation_care_plan: 'Care plan',
  consultation_medication_monitoring: 'Medication monitoring',
  daily_log: 'Daily log',
}

const logTypeLabels = {
  medication: 'Medication',
  follow_up: 'Follow-up',
  medication_monitoring: 'Monitoring',
  treatment_step: 'Treatment',
}

const getPatientId = (item) => (
  item.patient?._id || item.patient?.id || item.patientId || 'unknown-patient'
)

const getPatientName = (item) => (
  item.patient?.user?.name || item.patient?.name || 'Patient'
)

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const startOfDay = (value) => {
  const date = toDate(value)
  if (!date) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (value, days) => {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

const asArray = (value) => (Array.isArray(value) ? value : [])

const getDateKey = (value) => {
  const date = startOfDay(value)
  return date ? date.toISOString().slice(0, 10) : 'no-appointment-date'
}

const getDisplayDate = (value) => {
  const date = toDate(value)
  return date
    ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'No appointment date'
}

const getTaskAppointmentDate = (task) => (
  task.appointmentDate || task.careWindow?.appointmentDate || task.createdAt || task.dueTime
)

const getTaskFollowUpDate = (task) => (
  task.followUpDate || task.careWindow?.followUpDate || null
)

const getLogAppointmentDate = (log) => (
  log.careWindow?.appointmentDate || log.appointmentDate || log.date || log.createdAt
)

const getLogFollowUpDate = (log) => (
  log.careWindow?.followUpDate || log.followUpDate || null
)

const getCareLogDateKey = (log) => getDateKey(log.date || log.createdAt)

const isSameDay = (left, right) => getDateKey(left) === getDateKey(right)

const taskToChecklistItem = (task) => ({
  task: task.title || 'Task',
  type: task.type === 'consultation_follow_up'
    ? 'follow_up'
    : task.type === 'consultation_medication_monitoring'
      ? 'medication_monitoring'
      : task.type === 'medication'
        ? 'medication'
        : 'treatment_step',
  sourceId: getTaskSourceId(task),
  sourceLabel: task.sourceLabel || taskLabels[task.type] || 'Care task',
  scheduledTime: task.dueTime || task.appointmentDate || task.createdAt || null,
  completed: false,
  time: '',
  notes: task.details || '',
})

function getTaskSourceId(task) {
  const id = String(task._id || '')
  if (task.type === 'medication') return `reminder-${id}`
  if (task.type === 'consultation_follow_up') return id.replace(/^consultation-followup-/, 'followup-')
  if (task.type === 'consultation_medication_monitoring') return id.replace(/^consultation-medications-/, 'monitor-')
  if (task.type === 'consultation_care_plan') {
    const consultationId = id.replace(/^consultation-care-/, '').replace(/-\d+$/, '')
    return consultationId
      ? `treatment-${consultationId}-${String(task.title || '').toLowerCase()}`
      : String(task.title || '').toLowerCase()
  }
  return id ? `task-${id}` : String(task.title || '').toLowerCase()
}

const getTasksForCareLogDate = (appointmentFolder, date) => (
  asArray(appointmentFolder.tasks).filter((task) => {
    if (task.type === 'daily_log') return false

    const dueDate = task.dueTime || task.createdAt || appointmentFolder.appointmentDate
    if (task.type === 'consultation_care_plan' || task.type === 'consultation_medication_monitoring') {
      const day = startOfDay(date)
      const start = startOfDay(appointmentFolder.appointmentDate)
      const end = startOfDay(appointmentFolder.followUpDate || appointmentFolder.appointmentDate)
      return day && start && end && day >= start && day <= end
    }

    return dueDate ? isSameDay(dueDate, date) : false
  }).map(taskToChecklistItem)
)

const mergeChecklistWithDateTasks = (log, appointmentFolder, date) => {
  const existingChecklist = asArray(log.treatmentChecklist)
  const existingKeys = new Set(existingChecklist.map((item) => String(item.sourceId || item.task || '').toLowerCase()))
  const dateTasks = getTasksForCareLogDate(appointmentFolder, date)
    .filter((item) => !existingKeys.has(String(item.sourceId || item.task || '').toLowerCase()))

  return {
    ...log,
    treatmentChecklist: [...existingChecklist, ...dateTasks],
  }
}

const buildDailyCareLogSlots = (appointmentFolder, patientFolder) => {
  const fallbackDate =
    appointmentFolder.appointmentDate ||
    asArray(appointmentFolder.tasks)[0]?.dueTime ||
    asArray(appointmentFolder.tasks)[0]?.createdAt ||
    asArray(appointmentFolder.logs)[0]?.date ||
    asArray(appointmentFolder.logs)[0]?.createdAt ||
    new Date()
  const startDate = startOfDay(fallbackDate)
  const endDate = startOfDay(appointmentFolder.followUpDate || fallbackDate)
  const savedLogsByDate = new Map(
    asArray(appointmentFolder.logs).map((log) => [getCareLogDateKey(log), log])
  )

  if (!startDate || !endDate || endDate < startDate) {
    return asArray(appointmentFolder.logs).length > 0
      ? asArray(appointmentFolder.logs)
      : [{
          _id: `missing-log-${appointmentFolder.appointmentKey}-${getDateKey(fallbackDate)}`,
          date: toDate(fallbackDate)?.toISOString() || new Date().toISOString(),
          isPlaceholder: true,
          patient: { _id: patientFolder.patientId, user: { name: patientFolder.patientName } },
          patientId: patientFolder.patientId,
          careWindow: {
            appointmentDate: fallbackDate,
            followUpDate: appointmentFolder.followUpDate,
          },
          treatmentChecklist: [],
        }]
  }

  const days = []
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const dayKey = getDateKey(date)
    const savedLog = savedLogsByDate.get(dayKey)
    days.push(savedLog ? mergeChecklistWithDateTasks(savedLog, appointmentFolder, date) : {
      _id: `missing-log-${appointmentFolder.appointmentKey}-${dayKey}`,
      date: date.toISOString(),
      isPlaceholder: true,
      patient: { _id: patientFolder.patientId, user: { name: patientFolder.patientName } },
      patientId: patientFolder.patientId,
      careWindow: {
        appointmentDate: fallbackDate,
        followUpDate: appointmentFolder.followUpDate,
      },
      treatmentChecklist: getTasksForCareLogDate(appointmentFolder, date),
    })
  }

  return days.sort((a, b) => new Date(a.date || a.createdAt || 0) - new Date(b.date || b.createdAt || 0))
}

const isLogInsideFolderWindow = (log, folder) => {
  const logDate = startOfDay(log.date || log.createdAt)
  const appointmentDate = startOfDay(folder.appointmentDate)
  const followUpDate = startOfDay(folder.followUpDate)

  if (!logDate || !appointmentDate) return true
  if (logDate < appointmentDate) return false
  return followUpDate ? logDate <= followUpDate : true
}

export default function CaregiverWorkboard() {
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingLogIds, setSavingLogIds] = useState({})
  const [openPatientIds, setOpenPatientIds] = useState({})
  const [openAppointmentIds, setOpenAppointmentIds] = useState({})
  const [openDailyLogIds, setOpenDailyLogIds] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    Promise.all([
      caregiverApi.getTasks().catch(() => ({ data: [] })),
      caregiverApi.getLogs().catch(() => ({ data: [] })),
    ])
      .then(([tasksRes, logsRes]) => {
        setTasks(tasksRes.data?.data || tasksRes.data || [])
        setLogs(logsRes.data?.data || logsRes.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const patientFolders = useMemo(() => {
    const patients = new Map()

    const ensurePatient = (item) => {
      const patientId = getPatientId(item)
      if (!patients.has(patientId)) {
        patients.set(patientId, {
          patientId,
          patientName: getPatientName(item),
          appointmentFolders: new Map(),
        })
      }
      return patients.get(patientId)
    }

    const ensureAppointment = (patientFolder, dateValue, followUpValue) => {
      const appointmentKey = getDateKey(dateValue)
      if (!patientFolder.appointmentFolders.has(appointmentKey)) {
        patientFolder.appointmentFolders.set(appointmentKey, {
          appointmentKey,
          appointmentDate: dateValue || null,
          followUpDate: followUpValue || null,
          tasks: [],
          logs: [],
          dailyLogs: [],
        })
      }

      const folder = patientFolder.appointmentFolders.get(appointmentKey)
      if (!folder.appointmentDate && dateValue) folder.appointmentDate = dateValue
      if (!folder.followUpDate && followUpValue) folder.followUpDate = followUpValue
      return folder
    }

    tasks.forEach((task) => {
      const patientFolder = ensurePatient(task)
      const appointmentFolder = ensureAppointment(
        patientFolder,
        getTaskAppointmentDate(task),
        getTaskFollowUpDate(task)
      )
      appointmentFolder.tasks.push(task)
    })

    logs.forEach((log) => {
      const patientFolder = ensurePatient(log)
      const appointmentFolder = ensureAppointment(
        patientFolder,
        getLogAppointmentDate(log),
        getLogFollowUpDate(log)
      )
      if (isLogInsideFolderWindow(log, appointmentFolder)) {
        appointmentFolder.logs.push(log)
      }
    })

    return Array.from(patients.values())
      .map((patientFolder) => ({
        ...patientFolder,
        appointmentFolders: Array.from(patientFolder.appointmentFolders.values())
          .map((appointmentFolder) => ({
            ...appointmentFolder,
            dailyLogs: buildDailyCareLogSlots(appointmentFolder, patientFolder),
          }))
          .sort((a, b) => new Date(b.appointmentDate || 0) - new Date(a.appointmentDate || 0)),
      }))
      .sort((a, b) => a.patientName.localeCompare(b.patientName))
  }, [tasks, logs])

  const filteredPatientFolders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return patientFolders

    return patientFolders
      .map((patientFolder) => {
        const patientMatches = patientFolder.patientName.toLowerCase().includes(query)
        const appointmentFolders = patientFolder.appointmentFolders.filter((appointmentFolder) => {
          const appointmentDate = getDisplayDate(appointmentFolder.appointmentDate).toLowerCase()
          const followUpDate = getDisplayDate(appointmentFolder.followUpDate).toLowerCase()
          const taskMatches = appointmentFolder.tasks.some((task) => [
            task.title,
            task.details,
            task.sourceLabel,
            taskLabels[task.type],
          ].filter(Boolean).join(' ').toLowerCase().includes(query))
          const logMatches = appointmentFolder.dailyLogs.some((log) => {
            const logDate = getDisplayDate(log.date || log.createdAt).toLowerCase()
            const checklistText = (log.treatmentChecklist || [])
              .map((item) => `${item.task || ''} ${item.sourceLabel || ''}`)
              .join(' ')
              .toLowerCase()
            return logDate.includes(query) || checklistText.includes(query)
          })

          return patientMatches || appointmentDate.includes(query) || followUpDate.includes(query) || taskMatches || logMatches
        })

        return patientMatches
          ? patientFolder
          : { ...patientFolder, appointmentFolders }
      })
      .filter((patientFolder) => patientFolder.appointmentFolders.length > 0)
  }, [patientFolders, searchTerm])

  const getSavedChecklist = (saved, fallback = []) => (
    asArray(saved?.treatmentChecklist).length > 0
      ? saved.treatmentChecklist
      : asArray(saved?.tasks).length > 0
        ? saved.tasks
        : fallback
  )

  const getChecklist = (log) => asArray(log.treatmentChecklist)

  const upsertSavedLog = (currentLogs, originalLog, nextLog) => {
    if (originalLog.isPlaceholder) return [...currentLogs, nextLog]

    const index = currentLogs.findIndex((item) => item._id === originalLog._id)
    if (index === -1) return [...currentLogs, nextLog]

    return currentLogs.map((item, itemIndex) => (
      itemIndex === index ? nextLog : item
    ))
  }

  const markCareLogDone = async (log) => {
    const draftId = log._id
    const completedAt = new Date().toISOString()
    const completedChecklist = getChecklist(log).map((item) => ({
      ...item,
      completed: true,
      time: item.time || completedAt,
    }))

    setSavingLogIds((prev) => ({ ...prev, [draftId]: true }))
    try {
      const response = log.isPlaceholder
        ? await caregiverApi.addLog(log.patientId || getPatientId(log), {
            date: log.date,
            observations: '',
            treatmentChecklist: completedChecklist,
            checkOutTime: completedAt,
          })
        : await caregiverApi.updateLog(log._id, {
            treatmentChecklist: completedChecklist,
            checkOutTime: completedAt,
          })
      const saved = response.data?.data || response.data || {}
      const nextLog = {
        ...log,
        ...saved,
        isPlaceholder: false,
        patient: log.patient,
        careWindow: log.careWindow,
        treatmentChecklist: getSavedChecklist(saved, asArray(log.treatmentChecklist)),
      }
      setLogs((prev) => upsertSavedLog(prev, log, nextLog))
      setOpenDailyLogIds((prev) => {
        if (!log.isPlaceholder || !saved?._id) return prev
        const next = { ...prev, [saved._id]: true }
        delete next[log._id]
        return next
      })
      toast.success('Care log marked as done')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to mark care log done')
    } finally {
      setSavingLogIds((prev) => ({ ...prev, [draftId]: false }))
    }
  }

  const renderTask = (task, patientName) => {
    const doctorName = task.doctor?.user?.name || task.doctor?.name || ''
    const TaskIcon = taskIcons[task.type] || ClipboardList

    return (
      <div key={task._id} className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <TaskIcon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{task.title || 'Task'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <p className="text-xs" style={{ color: '#64748b' }}>File: {patientName}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>Type: {taskLabels[task.type] || task.type || 'Task'}</p>
                {doctorName && <p className="text-xs" style={{ color: '#64748b' }}>Doctor: Dr. {doctorName}</p>}
              </div>
              {task.dueTime && (
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  Due: {formatDateTime(task.dueTime)} ({formatRelative(task.dueTime)})
                </p>
              )}
              {task.sourceLabel && <p className="text-xs mt-1" style={{ color: '#64748b' }}>Source: {task.sourceLabel}</p>}
              {task.details && <p className="text-xs mt-2" style={{ color: '#475569' }}>{task.details}</p>}
            </div>
          </div>
          <Badge variant={task.priority === 'high' ? 'danger' : 'warning'}>{task.priority || 'normal'}</Badge>
        </div>
      </div>
    )
  }

  const renderCareLog = (log) => {
    const checklist = getChecklist(log)
    const isFuture = log.isPlaceholder && startOfDay(log.date) > startOfDay(new Date())
    const dateLabel = getDisplayDate(log.date || log.createdAt)
    const isLogOpen = !!openDailyLogIds[log._id]
    const isDone = !!log.checkOutTime
    const completedCount = checklist.filter((item) => item.completed).length

    return (
      <div
        key={log._id}
        className="rounded-xl overflow-hidden"
        style={{
          background: log.isPlaceholder ? '#ffffff' : '#f8fafc',
          border: log.isPlaceholder ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          className="w-full flex items-start justify-between gap-3 flex-wrap p-4 text-left"
          onClick={() => setOpenDailyLogIds((prev) => ({ ...prev, [log._id]: !isLogOpen }))}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Folder size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: '#0f172a', margin: 0 }}>
                Daily Care Log: {dateLabel}
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                {log.isPlaceholder
                  ? (isFuture ? 'Scheduled care-log file' : 'Care-log file not recorded yet')
                  : `Check-in: ${log.checkInTime ? formatDateTime(log.checkInTime) : 'Not recorded'}`}
              </p>
              {log.checkOutTime && <p className="text-xs mt-1" style={{ color: '#64748b' }}>Check-out: {formatDateTime(log.checkOutTime)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {checklist.length > 0 && (
              <Badge variant={completedCount === checklist.length ? 'success' : 'warning'}>
                {completedCount}/{checklist.length} tasks
              </Badge>
            )}
            <Badge variant={isDone ? 'success' : log.isPlaceholder ? (isFuture ? 'info' : 'warning') : 'warning'}>
              {isDone ? 'Done' : log.isPlaceholder ? (isFuture ? 'Upcoming' : 'Not recorded') : 'Open'}
            </Badge>
            {isLogOpen ? <ChevronDown size={18} style={{ color: '#64748b' }} /> : <ChevronRight size={18} style={{ color: '#64748b' }} />}
          </div>
        </button>

        {isLogOpen && (
          <div className="px-4 pb-4">
            {log.observations && <p className="text-sm mb-3" style={{ color: '#475569' }}>{log.observations}</p>}

            <div className="rounded-xl p-4 mb-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="text-sm font-semibold" style={{ color: '#0f172a', margin: 0 }}>
                  Care tasks for this day
                </p>
                <Badge variant={checklist.length > 0 ? 'purple' : 'default'}>{checklist.length} tasks</Badge>
              </div>

              {checklist.length === 0 ? (
                <p className="text-sm" style={{ color: '#64748b', margin: 0 }}>
                  No doctor treatment items or medication tasks are linked to this date yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {checklist.map((item, index) => (
                    <div key={`${log._id}-${index}-${item.sourceId || item.task}`} className="rounded-xl p-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {item.type && (
                              <Badge variant={item.type === 'medication' ? 'info' : item.type === 'follow_up' ? 'purple' : 'warning'}>
                                {logTypeLabels[item.type] || item.type}
                              </Badge>
                            )}
                            {item.scheduledTime && (
                              <span className="text-xs" style={{ color: '#64748b' }}>
                                Scheduled: {formatDateTime(item.scheduledTime)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: '#0f172a', margin: 0 }}>
                            {item.task || 'Care task'}
                          </p>
                          {item.notes && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{item.notes}</p>}
                        </div>
                        <Badge variant={item.completed ? 'success' : 'warning'}>
                          {item.completed ? 'Completed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isDone ? '#dcfce7' : '#ede9fe', color: isDone ? '#16a34a' : '#7c3aed' }}>
                    <CheckCircle size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#0f172a', margin: 0 }}>
                      {isDone ? 'Care log completed' : 'Ready to complete this care log'}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#64748b', margin: 0 }}>
                      {isDone
                        ? `Done on ${formatDateTime(log.checkOutTime)}`
                        : 'Click the button when this care log is done.'}
                    </p>
                  </div>
                </div>
                {!isDone && !isFuture && (
                  <Button
                    size="sm"
                    icon={CheckCircle}
                    loading={!!savingLogIds[log._id]}
                    onClick={() => markCareLogDone(log)}
                  >
                    Mark Done
                  </Button>
                )}
                {isFuture && (
                  <Badge variant="info">Upcoming</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title mb-1">Care Work</h1>
        <p className="text-slate-400 text-sm">Patient files grouped by appointment date, with daily care logs until follow-up</p>
      </div>

      <Card padding="p-5">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h3 className="section-title">Patient Folders</h3>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              Open a patient, then open an appointment date to see only the data linked to it
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="purple">{patientFolders.length} patients</Badge>
            <Badge variant="warning">{tasks.length} tasks</Badge>
            <Badge variant="info">{logs.length} saved logs</Badge>
          </div>
        </div>

        <div className="mb-5 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patients, appointment dates, tasks, or care logs"
            className="input-field pl-10"
            style={{ paddingLeft: 42 }}
          />
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm text-center py-12">Loading appointment folders...</p>
        ) : patientFolders.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No pending tasks or care logs are available right now.</p>
        ) : filteredPatientFolders.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">No care work matches your search.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPatientFolders.map((patientFolder) => {
              const isPatientOpen = !!openPatientIds[patientFolder.patientId]
              const totalTasks = patientFolder.appointmentFolders.reduce((sum, folder) => sum + folder.tasks.length, 0)
              const totalLogs = patientFolder.appointmentFolders.reduce((sum, folder) => sum + folder.dailyLogs.length, 0)

              return (
                <div key={patientFolder.patientId} className="rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 p-4 text-left"
                    onClick={() => setOpenPatientIds((prev) => ({ ...prev, [patientFolder.patientId]: !prev[patientFolder.patientId] }))}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                        <Folder size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold truncate" style={{ color: '#0f172a', margin: 0 }}>{patientFolder.patientName}</p>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{patientFolder.appointmentFolders.length} appointment date folders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge variant="warning">{totalTasks} tasks</Badge>
                      <Badge variant="info">{totalLogs} care days</Badge>
                      {isPatientOpen ? <ChevronDown size={18} style={{ color: '#64748b' }} /> : <ChevronRight size={18} style={{ color: '#64748b' }} />}
                    </div>
                  </button>

                  {isPatientOpen && (
                    <div className="flex flex-col gap-3 p-4 pt-0">
                      {patientFolder.appointmentFolders.map((appointmentFolder) => {
                        const appointmentOpenKey = `${patientFolder.patientId}-${appointmentFolder.appointmentKey}`
                        const isAppointmentOpen = !!openAppointmentIds[appointmentOpenKey]

                        return (
                          <div key={appointmentFolder.appointmentKey} className="rounded-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between gap-4 p-4 text-left"
                              onClick={() => setOpenAppointmentIds((prev) => ({ ...prev, [appointmentOpenKey]: !prev[appointmentOpenKey] }))}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfeff', color: '#0891b2' }}>
                                  <Calendar size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: '#0f172a', margin: 0 }}>
                                    Appointment: {getDisplayDate(appointmentFolder.appointmentDate)}
                                  </p>
                                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                    Daily care logs {appointmentFolder.followUpDate ? `until ${getDisplayDate(appointmentFolder.followUpDate)}` : 'from this appointment'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                <Badge variant="warning">{appointmentFolder.tasks.length} tasks</Badge>
                                <Badge variant="info">{appointmentFolder.dailyLogs.length} days</Badge>
                                {isAppointmentOpen ? <ChevronDown size={18} style={{ color: '#64748b' }} /> : <ChevronRight size={18} style={{ color: '#64748b' }} />}
                              </div>
                            </button>

                            {isAppointmentOpen && (
                              <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 p-4 pt-0 items-start">
                                <div className="xl:col-span-2 rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                      <h3 className="section-title">Tasks</h3>
                                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>Linked to this appointment date</p>
                                    </div>
                                    <Badge variant="warning">{appointmentFolder.tasks.length}</Badge>
                                  </div>
                                  {appointmentFolder.tasks.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-12">No tasks for this appointment date.</p>
                                  ) : (
                                    <div className="flex flex-col gap-3">
                                      {appointmentFolder.tasks.map((task) => renderTask(task, patientFolder.patientName))}
                                    </div>
                                  )}
                                </div>

                                <div className="xl:col-span-3 rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                  <div className="flex items-center justify-between gap-3 mb-4">
                                    <div>
                                      <h3 className="section-title">Daily Care Logs</h3>
                                      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                                        Care log entries continue here until the follow-up date
                                      </p>
                                    </div>
                                    <Badge variant="info">{appointmentFolder.dailyLogs.length}</Badge>
                                  </div>
                                  {appointmentFolder.dailyLogs.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-12">No daily care log dates are available for this appointment window.</p>
                                  ) : (
                                    <div className="flex flex-col gap-4">
                                      {appointmentFolder.dailyLogs.map(renderCareLog)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}
