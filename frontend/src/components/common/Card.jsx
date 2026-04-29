export default function Card({ children, className = '', hover = false, onClick, padding = 'p-5 sm:p-6' }) {
  return (
    <div
      onClick={onClick}
      className={[
        'glass-card w-full min-w-0',
        padding,
        hover ? 'transition-all duration-200 cursor-pointer hover:-translate-y-0.5' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={hover ? { '--hover-shadow': '0 4px 20px rgba(42,125,225,0.10)' } : {}}
    >
      {children}
    </div>
  )
}
