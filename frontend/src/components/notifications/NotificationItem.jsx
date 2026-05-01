import { Bell, Calendar, Pill, Activity, MessageSquare, FileText, Trash2 } from 'lucide-react'
import { formatRelative } from '../../utils/formatDate'
import { useNotifications } from '../../hooks/useNotifications'

const typeIcons = {
  appointment_reminder: { icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  medication_reminder: { icon: Pill, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  vitals_alert: { icon: Activity, color: 'text-red-400', bg: 'bg-red-400/10' },
  consultation: { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  caregiver_log: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  message: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  system: { icon: Bell, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
}

export default function NotificationItem({ notification }) {
  const { markRead, removeNotification } = useNotifications()
  const typeInfo = typeIcons[notification.type] || typeIcons.system
  const Icon = typeInfo.icon
  const isUnread = notification.status === 'unread'

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50 cursor-pointer ${isUnread ? 'bg-teal-50' : ''}`}
      onClick={() => isUnread && markRead(notification._id)}
    >
      <div className={`w-9 h-9 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={15} className={typeInfo.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${isUnread ? 'text-slate-900' : 'text-slate-700'} leading-tight`}>
            {notification.title}
          </p>
          {isUnread && <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1" />}
        </div>
        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-slate-500 mt-1">{formatRelative(notification.createdAt)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); removeNotification(notification._id) }}
        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded flex-shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
