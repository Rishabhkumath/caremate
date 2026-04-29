import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Activity, Pill, Calendar, FileText, User,
  Users, Stethoscope, ClipboardList, Clock, Settings,
  BarChart3, UserCheck, ShieldCheck, X
} from 'lucide-react'

const navConfig = {
  patient: [
    { to: '/patient/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/patient/vitals',       icon: Activity,        label: 'My Vitals'    },
    { to: '/patient/medications',  icon: Pill,            label: 'Medications'  },
    { to: '/patient/appointments', icon: Calendar,        label: 'Appointments' },
    { to: '/patient/reports',      icon: FileText,        label: 'Reports'      },
    { to: '/patient/profile',      icon: User,            label: 'Profile'      },
  ],
  doctor: [
    { to: '/doctor/dashboard',      icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/doctor/patients',       icon: Users,           label: 'My Patients'    },
    { to: '/doctor/consultations',  icon: Stethoscope,     label: 'Consultations'  },
    { to: '/doctor/schedule',       icon: Clock,           label: 'Schedule'       },
    { to: '/doctor/prescriptions',  icon: ClipboardList,   label: 'Prescriptions'  },
    { to: '/doctor/profile',        icon: User,            label: 'Profile'        },
  ],
  caregiver: [
    { to: '/caregiver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/caregiver/patients',  icon: Users,           label: 'Patients'  },
    { to: '/caregiver/workboard', icon: ClipboardList,   label: 'Care Work' },
    { to: '/caregiver/profile',   icon: User,            label: 'Profile'   },
  ],
  admin: [
    { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users',      icon: Users,           label: 'Users'     },
    { to: '/admin/doctors',    icon: UserCheck,       label: 'Doctors'   },
    { to: '/admin/analytics',  icon: BarChart3,       label: 'Analytics' },
    { to: '/admin/reports',    icon: FileText,        label: 'Reports'   },
    { to: '/admin/settings',   icon: Settings,        label: 'Settings'  },
  ],
}

const roleAccent = {
  patient:   { dot: '#2a7de1', soft: '#e8f1fd', label: 'Patient Portal'   },
  doctor:    { dot: '#0d9488', soft: '#ccfbf1', label: 'Doctor Portal'    },
  caregiver: { dot: '#7c3aed', soft: '#ede9fe', label: 'Caregiver Portal' },
  admin:     { dot: '#d97706', soft: '#fef3c7', label: 'Admin Portal'     },
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const links  = navConfig[user?.role] || []
  const accent = roleAccent[user?.role] || roleAccent.patient

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
             style={{ background: 'rgba(15,23,42,0.4)' }}
             onClick={onClose} />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          width: '240px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '2px 0 8px rgba(15,23,42,0.04)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
        // On lg+ always show
        className="lg:translate-x-0"
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0 20px', height: 64, borderBottom: '1px solid #e2e8f0',
                      flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: accent.dot,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 15 }}>
              C
            </div>
            <div>
              <p style={{ fontFamily: 'Fraunces,serif', fontWeight: 600, fontSize: 14,
                           color: '#0f172a', lineHeight: 1.2, margin: 0 }}>CareMate</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{accent.label}</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="lg:hidden"
                  style={{ padding: 4, borderRadius: 8, color: '#94a3b8',
                           background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}
             className="scrollbar-thin">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {links.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 12,
                        background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent.dot,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a',
                           margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0,
                           overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
            <ShieldCheck size={13} style={{ color: accent.dot, flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      {/* Spacer so content isn't hidden behind fixed sidebar on desktop */}
      <style>{`
        @media (min-width: 1024px) {
          aside.lg\\:translate-x-0 { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  )
}
