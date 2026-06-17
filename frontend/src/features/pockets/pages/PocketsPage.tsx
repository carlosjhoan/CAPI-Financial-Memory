import React, { useState } from 'react';
import type { Pocket } from '../types/pocket.types';
import { useCreatePocket, useUpdatePocket } from '../hooks/usePockets';
import PocketList from '../components/PocketList';
import PocketForm from '../components/PocketForm';
import Modal from '../../../shared/components/Modal';
import FloatingActionButton from '../../../shared/components/FloatingActionButton';
import type { PocketFormData } from '../hooks/usePocketForm';

const PocketsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pocketToEdit, setPocketToEdit] = useState<Pocket | null>(null);

  const createPocketMutation = useCreatePocket();
  const updatePocketMutation = useUpdatePocket();

  const handleCreatePocket = async (data: PocketFormData) => {
    await createPocketMutation.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdatePocket = async (data: PocketFormData) => {
    if (!pocketToEdit) return;

    await updatePocketMutation.mutateAsync({
      id: pocketToEdit.id,
      data,
    });
    setPocketToEdit(null);
  };

  const handleEditPocket = (pocket: Pocket) => {
    setPocketToEdit(pocket);
  };

  return (
    <div className="space-y-6">
      {/* ═══ FAB — todos los breakpoints, con tooltip hover en desktop ═══ */}
      <FloatingActionButton
        onClick={() => setIsCreateModalOpen(true)}
        label="Nuevo Bolsillo"
        accentColor="purple"
      />

      {/* ═══ Dynamic title ═══ */}
      <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
        Mis bolsillos
      </h1>

      {/* ═══ Content ═══ */}
      <PocketList
        onEditPocket={handleEditPocket}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Bolsillo"
        description="Crea un nuevo bolsillo para organizar tu dinero"
        size="lg"
        glass
        glassBackdrop
        accentColor="168,85,247"
      >
        <PocketForm
          onSubmit={handleCreatePocket}
          isLoading={createPocketMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!pocketToEdit}
        onClose={() => setPocketToEdit(null)}
        title="Editar Bolsillo"
        description="Actualiza los datos de tu bolsillo"
        size="lg"
      >
        {pocketToEdit && (
          <PocketForm
            pocket={pocketToEdit}
            onSubmit={handleUpdatePocket}
            isLoading={updatePocketMutation.isPending}
          />
        )}
      </Modal>

    </div>
  );
};

export default PocketsPage;
