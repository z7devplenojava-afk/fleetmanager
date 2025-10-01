import React, { useState } from 'react';
import { Dependent } from '@/types/dependent';
import { dependentService } from '@/services/dependentService';
import DependenteForm from './DependenteForm';
import DependentesList from './DependentesList';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface DependenteModalProps {
  employeeId: string;
  employeeName?: string;
}

const DependenteModal: React.FC<DependenteModalProps> = ({
  employeeId,
  employeeName
}) => {
  const [isAddingDependent, setIsAddingDependent] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Dependent | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleAddClick = () => {
    setIsAddingDependent(true);
    setEditingDependent(undefined);
  };

  const handleEditClick = (dependent: Dependent) => {
    setEditingDependent(dependent);
    setIsAddingDependent(true);
  };

  const handleDeleteClick = (dependent: Dependent) => {
    setConfirmDelete(dependent);
  };

  const handleFormSuccess = () => {
    setIsAddingDependent(false);
    setEditingDependent(undefined);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setIsAddingDependent(false);
    setEditingDependent(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      await dependentService.deleteDependent(confirmDelete.id);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao excluir dependente:', error);
      // Poderia mostrar uma notificação de erro aqui
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-seguranca-lightgray">
          {isAddingDependent 
            ? (editingDependent ? 'Editar Dependente' : 'Adicionar Dependente') 
            : `Dependentes de ${employeeName || 'Funcionário'}`}
        </h2>
        {!isAddingDependent && (
          <Button 
            onClick={handleAddClick}
            className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
          >
            <UserPlus size={16} className="mr-2" />
            Adicionar Dependente
          </Button>
        )}
      </div>

      <div className="overflow-y-auto">
        {isAddingDependent ? (
          <DependenteForm
            employeeId={employeeId}
            dependent={editingDependent}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        ) : (
          <DependentesList
            key={refreshKey}
            employeeId={employeeId}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o dependente <strong>{confirmDelete?.name}</strong>?</p>
            <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DependenteModal;