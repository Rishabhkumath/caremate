export default function Badge({ children, variant = 'default', size = 'sm', dot = false }) {
  const variants = {
    default: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    danger:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    info:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    purple:  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  }
  const sizes = {
    xs: { fontSize: '11px', padding: '2px 8px' },
    sm: { fontSize: '12px', padding: '3px 10px' },
    md: { fontSize: '13px', padding: '4px 12px' },
  }
  const s = variants[variant] || variants.default
  const z = sizes[size] || sizes.sm

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: z.fontSize,
        padding: z.padding,
        lineHeight: 1.4,
      }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: s.color }} />
      )}
      {children}
    </span>
  )
}