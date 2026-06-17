import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncome, useUpdateIncome, useDeleteIncome } from '../hooks/useIncomes';
import { formatCurrency, formatDate, formatDateTime } from '../../../core/utils/format';
import Card, { CardContent, CardHeader } from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import DeleteIncomeModal from '../components/DeleteIncomeModal';
import IncomeForm from '../components/IncomeForm';
import Modal from '../../../shared/components/Modal';
import { IncomeFormData } from '../hooks/useIncomeForm';

const IncomeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const { data: income, isLoading, error } = useIncome(id || '');
  const updateIncomeMutation = useUpdateIncome();
  const deleteIncomeMutation = useDeleteIncome();

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (data: IncomeFormData) => {
    if (!income) return;
    
    // Hook maneja error via onError callback - no duplicar toast aquí
    await updateIncomeMutation.mutateAsync({
      id: income.id,
      data,
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!income) return;
    
    // Hook maneja error via onError callback - no duplicar toast aquí
    await deleteIncomeMutation.mutateAsync(income.id);
    navigate('/incomes');
  };

  const handleBack = () => {
    navigate('/incomes');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">
            Cargando ingreso...
          </p>
        </div>
      </div>
    );
  }

  if (error || !income) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          {error ? 'Error al cargar ingreso' : 'Ingreso no encontrado'}
        </h3>
        <p className="text-secondary-600 dark:text-secondary-400 mb-4">
          {error instanceof Error ? error.message : 'El ingreso solicitado no existe'}
        </p>
        <Button onClick={handleBack}>
          Volver a Ingresos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Detalle de Ingreso
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Información completa del ingreso
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            Volver
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </Button>
          
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          title={formatCurrency(income.amount)}
          description={income.reason}
        />
        
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Información Básica
                  </h3>
                  
                  <dl className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Monto:
                      </dt>
                      <dd className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {formatCurrency(income.amount)}
                      </dd>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Motivo:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white text-right">
                        {income.reason}
                      </dd>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Fecha del ingreso:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white">
                        {formatDate(income.date)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                    Metadatos
                  </h3>
                  
                  <dl className="mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        ID:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white font-mono">
                        {income.id}
                      </dd>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Creado:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white">
                        {formatDateTime(income.createdAt)}
                      </dd>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <dt className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Actualizado:
                      </dt>
                      <dd className="text-sm text-secondary-900 dark:text-white">
                        {formatDateTime(income.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-3">
                Resumen
              </h3>
              
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Este ingreso fue registrado el {formatDate(income.createdAt)} y 
                  {income.updatedAt !== income.createdAt 
                    ? ` fue actualizado por última vez el ${formatDate(income.updatedAt)}.`
                    : ' no ha sido modificado desde su creación.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteIncomeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        income={income}
        onConfirm={handleDelete}
        isLoading={deleteIncomeMutation.isPending}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Ingreso"
        size="lg"
        showCloseButton={false}
      >
        {income && (
          <IncomeForm
            income={income}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={updateIncomeMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
};

export default IncomeDetailPage;