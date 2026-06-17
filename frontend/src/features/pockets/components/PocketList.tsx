import React, { useState } from 'react';
import type { Pocket } from '../types/pocket.types';
import { usePockets, useDeletePocket } from '../hooks/usePockets';
import PocketCard from './PocketCard';
import DeletePocketModal from './DeletePocketModal';

export interface PocketListProps {
  onEditPocket?: (pocket: Pocket) => void;
}

const PocketList: React.FC<PocketListProps> = ({ onEditPocket }) => {
  const { data: pockets, isLoading, isError, error } = usePockets();
  const deletePocketMutation = useDeletePocket();

  const [pocketToDelete, setPocketToDelete] = useState<Pocket | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!pocketToDelete) return;

    await deletePocketMutation.mutateAsync(pocketToDelete.id);
    setIsDeleteModalOpen(false);
    setPocketToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPocketToDelete(null);
  };

  const handleDeleteClick = (pocket: Pocket) => {
    setPocketToDelete(pocket);
    setIsDeleteModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-5 border border-secondary-200 dark:border-secondary-700 animate-pulse"
          >
            <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3 mb-4" />
            <div className="h-7 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2 mb-3" />
            <div className="h-2.5 bg-secondary-200 dark:bg-secondary-700 rounded-full mb-3" />
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
          Error al cargar bolsillos
        </h3>
        <p className="text-secondary-500 dark:text-secondary-400">
          {(error as Error)?.message || 'No se pudieron cargar los bolsillos. Intenta de nuevo.'}
        </p>
      </div>
    );
  }

  // Empty state
  if (!pockets || pockets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
          No hay bolsillos aún
        </h3>
        <p className="text-secondary-500 dark:text-secondary-400">
          Crea tu primer bolsillo para comenzar a organizar tu dinero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pockets.map((pocket) => (
          <PocketCard
            key={pocket.id}
            pocket={pocket}
            onEdit={onEditPocket}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>

      <DeletePocketModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        pocket={pocketToDelete}
        onConfirm={handleDeleteConfirm}
        isLoading={deletePocketMutation.isPending}
      />
    </div>
  );
};

export default PocketList;
