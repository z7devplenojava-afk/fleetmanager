import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  History
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Equipment,
  EQUIPMENT_STATUS_LABELS
} from '@/types/equipment';
import { 
  EquipmentMovement, 
  MOVEMENT_TYPE_LABELS 
} from '@/types/equipmentMovement';
import equipmentService from '@/services/equipmentService';
import equipmentMovementService from '@/services/equipmentMovementService';

interface EquipmentHistoryModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
}

const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({
  equipment,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [movements, setMovements] = useState<EquipmentMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (equipment && isOpen) {
      loadHistory();
    }
  }, [equipment, isOpen]);

  const loadHistory = async () => {
    if (!equipment) return;
    
    try {
      setLoading(true);
      const history = await equipmentMovementService.getEquipmentHistory(equipment.id);
      setMovements(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico do equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMovementCard = (movement: EquipmentMovement) => (
    <Card key={movement.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge className={equipmentMovementService.getMovementTypeColor(movement.movementType)}>
              {MOVEMENT_TYPE_LABELS[movement.movementType]}
            </Badge>
            <Badge className={equipmentMovementService.getStatusColor(movement.status)}>
              {movement.status}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {equipmentMovementService.formatDateTime(movement.movementDate)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Informações do funcionário */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{movement.employeeName}</span>
          {movement.employeeCpf && (
            <span className="text-sm text-gray-500">({movement.employeeCpf})</span>
          )}
        </div>

        {/* Posto de trabalho */}
        {movement.workPostName && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{movement.workPostName}</span>
            {movement.workPostLocation && (
              <span className="text-sm text-gray-500">- {movement.workPostLocation}</span>
            )}
          </div>
        )}

        {/* Autorizado por */}
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm">Autorizado por: <strong>{movement.authorizedByName}</strong></span>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Retirada:</div>
            <div>{equipmentMovementService.formatDateTime(movement.movementDate)}</div>
          </div>
          
          {movement.expectedReturnDate && (
            <div>
              <div className="font-medium text-gray-700">Retorno previsto:</div>
              <div className={movement.isOverdue ? 'text-red-600 font-semibold' : ''}>
                {equipmentMovementService.formatDateTime(movement.expectedReturnDate)}
                {movement.isOverdue && ' (Atrasado)'}
              </div>
            </div>
          )}
          
          {movement.actualReturnDate && (
            <div>
              <div className="font-medium text-gray-700">Retorno real:</div>
              <div>{equipmentMovementService.formatDateTime(movement.actualReturnDate)}</div>
            </div>
          )}
        </div>

        {/* Condições */}
        {(movement.conditionOnWithdrawal || movement.conditionOnReturn) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {movement.conditionOnWithdrawal && (
              <div>
                <div className="font-medium text-gray-700">Estado na retirada:</div>
                <div>{movement.conditionOnWithdrawal}</div>
              </div>
            )}
            
            {movement.conditionOnReturn && (
              <div>
                <div className="font-medium text-gray-700">Estado na devolução:</div>
                <div>{movement.conditionOnReturn}</div>
              </div>
            )}
          </div>
        )}

        {/* Motivo */}
        {movement.reason && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Motivo:</div>
            <div className="text-sm">{movement.reason}</div>
          </div>
        )}

        {/* Observações */}
        {movement.notes && (
          <div>
            <div className="font-medium text-gray-700 mb-1">Observações:</div>
            <div className="text-sm bg-gray-50 p-2 rounded">{movement.notes}</div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
          <span>Dias em uso: {movement.daysOut}</span>
          <span>Criado em: {equipmentMovementService.formatDateTime(movement.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações - {equipment.serialNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do equipamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Equipamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Número de Série:</div>
                  <div className="font-mono">{equipment.serialNumber}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Modelo:</div>
                  <div>{equipment.model || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Status Atual:</div>
                  <Badge className={equipmentService.getStatusColor(equipment.status)}>
                    {EQUIPMENT_STATUS_LABELS[equipment.status]}
                  </Badge>
                </div>
                {equipment.currentUserName && (
                  <div className="md:col-span-3">
                    <div className="font-medium text-muted-foreground">Usuário Atual:</div>
                    <div>{equipment.currentUserName}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Histórico de movimentações */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Movimentações ({movements.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando histórico...</span>
              </div>
            ) : movements.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma movimentação encontrada para este equipamento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {movements.map(renderMovementCard)}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentHistoryModal; 