import { Outlet } from 'react-router-dom'
import Navigation from '../shared/components/Navigation'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      <Navigation />
      <main className="min-h-0 flex-1 overflow-x-clip px-4 lg:px-6 pt-10 pb-2">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout