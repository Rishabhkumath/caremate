export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const ring = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-2',
    lg: 'w-11 h-11 border-2',
  }

  const spinner = (
    <div
      className={`${ring[size] || ring.md} rounded-full animate-spin`}
      style={{
        borderColor: 'rgba(42,125,225,0.15)',
        borderTopColor: '#2a7de1',
      }}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
           style={{ backgroundColor: '#f4f7fb' }}>
        <div className="w-12 h-12 rounded-full animate-spin border-2"
             style={{ borderColor: 'rgba(42,125,225,0.15)', borderTopColor: '#2a7de1' }} />
        <p className="mt-4 text-sm" style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
          Loading CareMate…
        </p>
      </div>
    )
  }

  return spinner
}