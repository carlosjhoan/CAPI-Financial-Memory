import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy loading de las páginas
const IncomesPage = lazy(() => import('../features/incomes/pages/IncomesPage'));
const IncomeDetailPage = lazy(() => import('../features/incomes/pages/IncomeDetailPage'));

// Componente de loading para lazy loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-secondary-600 dark:text-secondary-400">
        Cargando...
      </p>
    </div>
  </div>
);

// Componente wrapper para Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const incomesRoutes: RouteObject[] = [
  {
    path: 'incomes',
    children: [
      {
        index: true,
        element: withSuspense(IncomesPage),
      },
      {
        path: ':id',
        element: withSuspense(IncomeDetailPage),
      },
    ],
  },
];