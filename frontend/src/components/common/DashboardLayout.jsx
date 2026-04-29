import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatbotWidget from '../chatbot/ChatbotWidget'

const SIDEBAR_W = 240

export default function DashboardLayout({ children }) {
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [isDesktop,     setIsDesktop]     = useState(window.innerWidth >= 1024)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', overflowX: 'hidden' }}>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Push content right by sidebar width on desktop only */}
      <div style={{
        marginLeft: isDesktop ? SIDEBAR_W : 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
        transition: 'margin-left 0.3s ease',
      }}>

        <Navbar onToggleSidebar={() => setSidebarOpen(p => !p)} />

        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }} className="scrollbar-thin">
          <div
            className="dashboard-page mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10"
          >
            {children}
          </div>
        </main>

        <Footer />
      </div>

      <ChatbotWidget />
    </div>
  )
}
