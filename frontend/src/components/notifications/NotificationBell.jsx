import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications()
  return (
    <button onClick={onClick} className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
