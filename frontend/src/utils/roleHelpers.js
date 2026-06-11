import { ROLES } from './constants'

export const getRoleDashboardPath = (role) => {
  const paths = {
    [ROLES.PATIENT]: '/patient/dashboard',
    [ROLES.DOCTOR]: '/doctor/dashboard',
    [ROLES.CAREGIVER]: '/caregiver/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
  }
  return paths[role] || '/patient/dashboard'
}

export const getRoleLabel = (role) => {
  const labels = {
    [ROLES.PATIENT]: 'Patient',
    [ROLES.DOCTOR]: 'Doctor',
    [ROLES.CAREGIVER]: 'Caregiver',
    [ROLES.ADMIN]: 'Administrator',
  }
  return labels[role] || role
}

export const getRoleColor = (role) => {
  const colors = {
    [ROLES.PATIENT]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [ROLES.DOCTOR]: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    [ROLES.CAREGIVER]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [ROLES.ADMIN]: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }
  return colors[role] || 'text-slate-400 bg-slate-400/10'
}

export const hasRole = (user, ...roles) => {
  if (!user) return false
  return roles.includes(user.role)
}

export const canAccessRoute = (user, allowedRoles) => {
  if (!user) return false
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(user.role)
}
