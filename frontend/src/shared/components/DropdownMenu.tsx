import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface MenuItem {
  label: string
  path?: string
  icon: 'incomes' | 'debts' | 'expenses' | 'loans' | 'pockets' | 'logout'
  sessionType?: 'incomes' | 'debts' | 'expenses' | 'loans' | 'pockets'
  onClick?: () => void
  isDivider?: boolean
}

interface DropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
  menuButtonRef?: React.RefObject<HTMLButtonElement>
}

// Get color classes based on session type - using literal classes for Tailwind to scan
const getSessionColorClasses = (sessionType?: string): { icon: string; bg: string } => {
  switch (sessionType) {
    case 'incomes':
      return {
        icon: 'group-hover:text-green-600 dark:group-hover:text-green-400',
        bg: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      }
    case 'debts':
      return {
        icon: 'group-hover:text-red-600 dark:group-hover:text-red-400',
        bg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      }
    case 'expenses':
      return {
        icon: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
        bg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      }
    case 'loans':
      return {
        icon: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      }
    case 'pockets':
      return {
        icon: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      }
    default:
      return {
        icon: 'text-secondary-500 dark:text-secondary-400',
        bg: 'hover:bg-secondary-100 dark:hover:bg-secondary-700',
      }
  }
}

const iconMap: Record<MenuItem['icon'], JSX.Element> = {
  pockets: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  incomes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  debts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  expenses: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  loans: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

const DropdownMenu = ({ isOpen, onClose, onLogout, menuButtonRef }: DropdownMenuProps) => {
  const menuItems: MenuItem[] = [
    { label: 'Ingresos', path: '/incomes', icon: 'incomes', sessionType: 'incomes' },
    { label: 'Deudas', path: '/debts', icon: 'debts', sessionType: 'debts' },
    { label: 'Gastos', path: '/expenses', icon: 'expenses', sessionType: 'expenses' },
    { label: 'Préstamos', path: '/loans', icon: 'loans', sessionType: 'loans' },
    { label: 'Bolsillos', path: '/pockets', icon: 'pockets', sessionType: 'pockets' },
    { label: 'Cerrar sesión', icon: 'logout', isDivider: true, onClick: onLogout },
  ]

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler - only attach when open
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if click is outside both dropdown AND menu button
      const isOutsideDropdown = !dropdownRef.current?.contains(target)
      const isOutsideMenuButton = !menuButtonRef?.current?.contains(target)
      
      if (isOutsideDropdown && isOutsideMenuButton) {
        onClose()
      }
    }

    // Add small delay to prevent immediate close on button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, menuButtonRef])

  if (!isOpen) return null

  const handleItemClick = (action?: () => void) => {
    onClose()
    action?.()
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50 animate-fade-in"
    >
      {menuItems.map((item, index) => {
        const colorClasses = getSessionColorClasses(item.sessionType)
        return (
        <div key={item.label}>
          {item.path ? (
            <Link
              to={item.path}
              onClick={() => handleItemClick()}
              className={`group flex items-center gap-3 px-4 py-2.5 text-secondary-700 dark:text-secondary-200 ${colorClasses.bg} transition-colors`}
            >
              <span className={colorClasses.icon}>
                {iconMap[item.icon]}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ) : (
            <button
              onClick={() => handleItemClick(item.onClick)}
              className={`group flex items-center gap-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
            >
              <span>{iconMap[item.icon]}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )}
          {item.isDivider && index < menuItems.length - 1 && (
            <div className="border-t border-secondary-200 dark:border-secondary-700 my-1" />
          )}
        </div>
      )})}
    </div>
  )
}

export default DropdownMenu