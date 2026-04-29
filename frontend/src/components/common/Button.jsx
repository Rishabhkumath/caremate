import LoadingSpinner from './LoadingSpinner'

const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition-all duration-200',
  outline:   'border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all duration-200 inline-flex items-center justify-content gap-2 font-medium',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2',
}

export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  onClick,
  type      = 'button',
  className = '',
  icon: Icon,
  fullWidth = false,
}) {
  const isCustomClass = ['ghost', 'outline'].includes(variant)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        isCustomClass ? VARIANTS[variant] : VARIANTS[variant],
        isCustomClass ? SIZES[size] : '',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading
        ? <LoadingSpinner size="sm" />
        : Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2} />
      }
      {children}
    </button>
  )
}