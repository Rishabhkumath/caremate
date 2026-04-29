export default function Footer() {
  return (
    <footer
      className="px-8 py-4 text-center text-xs"
      style={{
        borderTop: '1px solid #e2e8f0',
        color: '#94a3b8',
        background: '#ffffff',
      }}
    >
      © {new Date().getFullYear()} CareMate – Virtual Nursing Assistant. All rights reserved.
    </footer>
  )
}