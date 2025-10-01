import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Benefit } from '@/services/benefitService';

interface BeneficioDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  benefit: Benefit | null;
  onConfirm: () => void;
  loading?: boolean;
}

const BeneficioDeleteDialog: React.FC<BeneficioDeleteDialogProps> = ({
  isOpen,
  onClose,
  benefit,
  onConfirm,
  loading = false
}) => {
  if (!isOpen || !benefit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Excluir Benefício
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tem certeza que deseja excluir o benefício <strong>"{benefit.name}"</strong>?
            </p>
            <p className="text-xs text-gray-400">
              Esta ação não pode ser desfeita. Todos os dados relacionados a este benefício serão removidos permanentemente.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Benefício:</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Nome:</strong> {benefit.name}</div>
                <div><strong>Tipo:</strong> {benefit.type}</div>
                <div><strong>Valor:</strong> R$ {benefit.value?.toFixed(2) || '0.00'}</div>
                <div><strong>Status:</strong> {benefit.isActive ? 'Ativo' : 'Inativo'}</div>
              </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? 'Excluindo...' : 'Excluir Benefício'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeneficioDeleteDialog; 