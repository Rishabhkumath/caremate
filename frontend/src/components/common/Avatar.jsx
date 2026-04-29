export default function Avatar({ name = '', src, size = 'md', role }) {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-xl', xl: 'w-20 h-20 text-2xl' }
  const roleColors = {
    patient: 'from-blue-600 to-blue-800',
    doctor: 'from-teal-600 to-teal-800',
    caregiver: 'from-purple-600 to-purple-800',
    admin: 'from-amber-600 to-amber-800',
    default: 'from-slate-600 to-slate-800',
  }
  const gradient = roleColors[role] || roleColors.default
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/10`} />

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-semibold text-white ring-2 ring-white/10`}>
      {initials || '?'}
    </div>
  )
}
