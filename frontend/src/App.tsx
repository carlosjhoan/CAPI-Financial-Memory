import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, FilterProvider } from './core/contexts'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import IncomesPage from './features/incomes/pages/IncomesPage'
import IncomeDetailPage from './features/incomes/pages/IncomeDetailPage'
import DebtsPage from './features/debts/pages/DebtsPage'
import DebtDetailPage from './features/debts/pages/DebtDetailPage'
import ExpensesPage from './features/expenses/pages/ExpensesPage'
import ExpenseDetailPage from './features/expenses/pages/ExpenseDetailPage'
import LoansPage from './features/loans/pages/LoansPage'
import LoanDetailPage from './features/loans/pages/LoanDetailPage'
import PocketsPage from './features/pockets/pages/PocketsPage'
import PocketDetailPage from './features/pockets/pages/PocketDetailPage'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PageGradient from './shared/components/PageGradient'
import { useTheme } from './core/hooks/useTheme'

// Configuración global del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos default para listas
      gcTime: 1000 * 60 * 10, // 10 minutos (garbage collection)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

function getGradientForPath(path: string, isDark: boolean) {
  const section = path.split('/')[1] || ''
  switch (section) {
    case 'incomes':
      return isDark ? { r: 74, g: 222, b: 128 } : { r: 22, g: 163, b: 74 }
    case 'expenses':
      return isDark ? { r: 251, g: 146, b: 60 } : { r: 234, g: 88, b: 12 }
    default:
      return isDark ? { r: 59, g: 130, b: 246 } : { r: 37, g: 99, b: 235 }
  }
}

function App() {
  const { pathname } = useLocation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const { r, g, b } = getGradientForPath(pathname, isDarkMode);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>
          {/* Fondo sólido del theme activo, debajo del gradiente */}
          <div className="fixed inset-0 -z-20 bg-gray-50 dark:bg-secondary-900" />
          <PageGradient key={pathname.split('/')[1] || 'root'} r={r} g={g} b={b} isDark={isDarkMode} />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="incomes">
                <Route index element={<IncomesPage />} />
                <Route path=":id" element={<IncomeDetailPage />} />
              </Route>
              <Route path="debts">
                <Route index element={<DebtsPage />} />
                <Route path=":id" element={<DebtDetailPage />} />
              </Route>
              <Route path="expenses">
                <Route index element={<ExpensesPage />} />
                <Route path=":id" element={<ExpenseDetailPage />} />
              </Route>
              <Route path="loans">
                <Route index element={<LoansPage />} />
                <Route path=":id" element={<LoanDetailPage />} />
              </Route>
              <Route path="pockets">
                <Route index element={<PocketsPage />} />
                <Route path=":id" element={<PocketDetailPage />} />
              </Route>
            </Route>

            {/* Redirect raíz a login si no está autenticado */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
