import { useNotifications } from '../../hooks/useNotifications'
import NotificationItem from './NotificationItem'
import { Bell, CheckCheck } from 'lucide-react'

export default function NotificationPanel({ onClose }) {
  const { notifications, markAllRead, unreadCount } = useNotifications()

  return (
    <div className="glass-card shadow-card-hover overflow-hidden w-80">
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-teal-600" />
          <span className="text-slate-900 font-medium text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-teal-500 text-white text-xs rounded-full font-bold">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1">
            <CheckCheck size={13} /> All read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={24} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 15).map(n => <NotificationItem key={n._id} notification={n} />)
        )}
      </div>
    </div>
  )
}
