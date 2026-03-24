import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  Car, 
  Calendar, 
  DollarSign 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';

interface Multa {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  data_infracao: string;
  valor: number;
  tipo_infracao: string;
  status: string;
}

interface MultaDeleteDialogProps {
  multa: Multa | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const MultaDeleteDialog: React.FC<MultaDeleteDialogProps> = ({
  multa,
  isOpen,
  onClose,
  onDelete,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = async () => {
    if (!multa) return;

    setIsLoading(true);
    try {      
      // Chamar API para excluir multa
      console.log('🗑️ Excluindo multa do backend:', multa.id);
      await fleetService.deleteFine(multa.id);
      console.log('✅ Multa excluída do backend!');
      
      toast({
        title: 'Sucesso!',
        description: 'Multa excluída com sucesso.',
      });
      
      onDelete();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro ao excluir multa:', error);
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao excluir multa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!multa) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-seguranca-lightgray">
            Tem certeza que deseja excluir esta multa? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Veículo */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-seguranca-red rounded-full flex items-center justify-center">
                    <Car className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-seguranca-lightgray">{multa.placa}</div>
                    <div className="text-sm text-gray-400">{multa.marca} {multa.modelo}</div>
                  </div>
                </div>

                {/* Detalhes da Multa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Tipo de Infração</label>
                    <p className="text-seguranca-lightgray font-semibold">{multa.tipo_infracao}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">Data da Infração</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-seguranca-lightgray">{formatDate(multa.data_infracao)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Valor</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-seguranca-lightgray font-semibold">
                        {formatCurrency(multa.valor)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">Status</label>
                    <Badge className="bg-gray-100 text-gray-800">
                      {multa.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            disabled={isLoading}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Excluindo...' : 'Excluir Multa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MultaDeleteDialog; 
