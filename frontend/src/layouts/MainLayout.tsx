import { Outlet } from 'react-router-dom'
import Navigation from '../shared/components/Navigation'

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout