export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  required = false,
  disabled = false,
  icon: Icon,
  hint,
  className = '',
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>

      {/* Label */}
      {label && (
        <label htmlFor={name} className="label-text">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative min-w-0">

        {/* Icon — sits inside left edge, never overlaps text */}
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
            <Icon size={15} className="text-slate-500 shrink-0" />
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={Icon ? { paddingLeft: '2.9rem' } : {}}
          className={[
            'input-field',
            error   ? 'border-red-500/50 focus:border-red-500/70 focus:shadow-none' : '',
            disabled ? 'opacity-45 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ')}
        />
      </div>

      {/* Messages */}
      {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      {hint && !error && <p className="text-slate-500 text-xs mt-0.5">{hint}</p>}
    </div>
  )
}
