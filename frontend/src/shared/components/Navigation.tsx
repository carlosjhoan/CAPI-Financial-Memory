import { useState, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../core/hooks/useTheme'
import { useAuth } from '../../core/contexts'
import { Theme } from '../../core/types/common.types'
import DropdownMenu from './DropdownMenu'

interface SessionInfo {
  label: string
  color: string
  darkColor: string
}

const SESSION_MAP: Record<string, SessionInfo> = {
  '/incomes': { label: 'Ingresos', color: 'text-green-600', darkColor: 'dark:text-green-400' },
  '/debts': { label: 'Deudas', color: 'text-red-600', darkColor: 'dark:text-red-400' },
  '/expenses': { label: 'Gastos', color: 'text-orange-600', darkColor: 'dark:text-orange-400' },
  '/loans': { label: 'Préstamos', color: 'text-blue-600', darkColor: 'dark:text-blue-400' },
  '/pockets': { label: 'Bolsillos', color: 'text-purple-600', darkColor: 'dark:text-purple-400' },
}

// Get next theme label for tooltip
const getNextThemeTooltip = (currentTheme: Theme): string => {
  switch (currentTheme) {
    case 'light':
      return 'Modo oscuro';
    case 'dark':
      return 'Modo tenue';
    case 'dim':
      return 'Modo claro';
    default:
      return 'Cambiar tema';
  }
}

// Theme icon component with 3 states
const ThemeIcon = ({ theme }: { theme: Theme }) => {
  switch (theme) {
    case 'light':
      // Sun icon
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    case 'dark':
      // Full moon icon
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    case 'dim':
      // Solid crescent moon — filled shape to contrast with outlined full moon of dark
      return (
        <svg className="w-5 h-5" fill="currentColor" stroke="none" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    default:
      return null;
  }
};

const Navigation = () => {
  const { theme, cycleTheme } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const currentSession = SESSION_MAP[location.pathname]

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

  const handleLogout = useCallback(() => {
    setIsDropdownOpen(false)
    logout()
  }, [logout])

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-secondary-800 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="relative flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
              PFM
            </Link>
          </div>

          {/* Session Title in Center */}
          {currentSession && (
            <div className={`absolute left-1/2 transform -translate-x-1/2 ${currentSession.color} ${currentSession.darkColor} font-semibold text-xl`}>
              {currentSession.label}
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {/* User Name */}
            {user && (
              <span className="text-sm text-secondary-600 dark:text-secondary-400 hidden sm:block">
                {user.name}
              </span>
            )}

            {/* Menu Icon with Dropdown */}
            <div className="relative">
              <button
                ref={menuButtonRef}
                onClick={toggleDropdown}
                className="p-2 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                title="Menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <DropdownMenu 
                isOpen={isDropdownOpen} 
                onClose={handleCloseDropdown}
                onLogout={handleLogout}
                menuButtonRef={menuButtonRef}
              />
            </div>

            {/* Theme Toggle (cycles: light -> dark -> dim) */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-lg bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
              title={getNextThemeTooltip(theme)}
            >
              <ThemeIcon theme={theme} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation