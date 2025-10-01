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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  Car, 
  Calendar, 
  Fuel,
  X 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';

interface Veiculo {
  id: string; // UUID
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  combustivel: string;
  quilometragem?: number;
  status: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
}

interface VeiculoDeleteDialogProps {
  veiculo: Veiculo | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const VeiculoDeleteDialog: React.FC<VeiculoDeleteDialogProps> = ({
  veiculo,
  isOpen,
  onClose,
  onDelete,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  // Mutation para deletar veículo
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => fleetService.deleteVehicle(id),
    onSuccess: (_, deletedId) => {
      toast({
        title: "Sucesso",
        description: "Veículo excluído com sucesso!"
      });
      
      // Invalidar e refetch da query de veículos
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      onDelete();
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao excluir veículo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir veículo. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = async () => {
    if (!veiculo) return;

    setIsLoading(true);
    try {
      deleteVehicleMutation.mutate(veiculo.id);
    } catch (error: any) {
      console.error('Erro ao excluir veículo:', error);
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao excluir veículo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'ativo' || statusLower === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800">
          Ativo
        </Badge>
      );
    } else if (statusLower === 'inativo' || statusLower === 'inactive') {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Inativo
        </Badge>
      );
    } else if (statusLower === 'manutencao' || statusLower === 'maintenance') {
      return (
        <Badge className="bg-red-100 text-red-800">
          Manutenção
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!veiculo) return null;

  const isConfirmed = confirmationText === veiculo.placa;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-seguranca-lightgray">
            Esta ação não pode ser desfeita. O veículo será permanentemente removido do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Informações do Veículo */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-seguranca-lightgray text-lg">{veiculo.placa}</h4>
                  <p className="text-sm text-gray-400">{veiculo.marca} {veiculo.modelo}</p>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(veiculo.status)}
                    <Badge className="bg-blue-100 text-blue-800">
                      {veiculo.ano}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Detalhes do Veículo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Combustível</label>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-gray-400" />
                    <span className="text-seguranca-lightgray capitalize">{veiculo.combustivel}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-400">Quilometragem</label>
                  <span className="text-seguranca-lightgray font-semibold">
                    {veiculo.quilometragem ? `${veiculo.quilometragem.toLocaleString()} km` : '-'}
                  </span>
                </div>

                {veiculo.cor && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Cor</label>
                    <span className="text-seguranca-lightgray">{veiculo.cor}</span>
                  </div>
                )}

                {veiculo.data_aquisicao && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">Data de Aquisição</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-seguranca-lightgray">{formatDate(veiculo.data_aquisicao)}</span>
                    </div>
                  </div>
                )}

                {veiculo.valor_aquisicao && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-400">Valor de Aquisição</label>
                    <span className="text-seguranca-lightgray font-semibold">
                      {formatCurrency(veiculo.valor_aquisicao)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmação */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-seguranca-lightgray">
              Digite a placa do veículo para confirmar: <strong>{veiculo.placa}</strong>
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Digite a placa do veículo"
            />
          </div>

          {/* Avisos */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Atenção:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Esta ação é irreversível</li>
                  <li>O veículo será removido permanentemente</li>
                  <li>Histórico de abastecimentos será perdido</li>
                  <li>Multas associadas serão afetadas</li>
                  <li>Dados de manutenção serão perdidos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || !isConfirmed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Excluindo...' : 'Excluir Veículo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VeiculoDeleteDialog; 