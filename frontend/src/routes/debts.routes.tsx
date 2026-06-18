/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy loading de las páginas
const DebtsPage = lazy(() => import('../features/debts/pages/DebtsPage'));
const DebtDetailPage = lazy(() => import('../features/debts/pages/DebtDetailPage'));

// Componente de loading para lazy loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
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

export const debtsRoutes: RouteObject[] = [
  {
    path: 'debts',
    children: [
      {
        index: true,
        element: withSuspense(DebtsPage),
      },
      {
        path: ':id',
        element: withSuspense(DebtDetailPage),
      },
    ],
  },
];
