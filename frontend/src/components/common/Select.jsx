export default function Select({
  label, name, value, onChange, options = [], placeholder = 'Select an option',
  error, required = false, disabled = false, className = ''
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="label-text">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`input-field ${error ? 'border-red-500/50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-navy-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
