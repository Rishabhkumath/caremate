import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationPanel from '../notifications/NotificationPanel'
import { getRoleDashboardPath } from '../../utils/roleHelpers'

export default function Navbar({ onToggleSidebar }) {
  const { user, logout }    = useAuth()
  const { unreadCount }     = useNotifications()
  const [showNotif, setShowNotif] = useState(false)
  const [showMenu,  setShowMenu]  = useState(false)

  const roleColors = {
    patient:   '#2a7de1',
    doctor:    '#0d9488',
    caregiver: '#7c3aed',
    admin:     '#d97706',
  }
  const accent = roleColors[user?.role] || '#2a7de1'

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8 h-16"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg lg:hidden transition-colors"
          style={{ color: '#64748b' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={20} />
        </button>

        <Link to={getRoleDashboardPath(user?.role)} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm"
               style={{ background: accent }}>
            C
          </div>
          <span className="font-display font-semibold hidden sm:block" style={{ color: '#0f172a' }}>
            CareMate
          </span>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(p => !p); setShowMenu(false) }}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ background: accent }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 z-50">
              <NotificationPanel onClose={() => setShowNotif(false)} />
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(p => !p); setShowNotif(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                 style={{ background: accent }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-tight" style={{ color: '#0f172a' }}>{user?.name}</p>
              <p className="text-xs capitalize leading-tight" style={{ color: '#94a3b8' }}>{user?.role}</p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-14 w-44 rounded-xl overflow-hidden z-50"
                 style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}>
              <Link
                to={`/${user?.role}/profile`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                style={{ color: '#334155' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User size={14} /> My Profile
              </Link>
              <div style={{ borderTop: '1px solid #f1f5f9' }} />
              <button
                onClick={() => { logout(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                style={{ color: '#dc2626' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}