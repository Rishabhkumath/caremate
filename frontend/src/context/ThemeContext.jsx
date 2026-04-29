import { createContext, useState } from 'react'

export const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => setSidebarOpen(p => !p)
  const toggleCollapse = () => setSidebarCollapsed(p => !p)

  return (
    <ThemeContext.Provider value={{ sidebarOpen, sidebarCollapsed, toggleSidebar, toggleCollapse }}>
      {children}
    </ThemeContext.Provider>
  )
}
