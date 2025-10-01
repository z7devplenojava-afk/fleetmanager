import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  UserX, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { equipmentAssignmentService } from '@/services/equipmentAssignmentService';

interface UnassignEquipmentModalProps {
  equipment: {
    id: string;
    serialNumber: string;
    model?: string;
    currentUserName?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UnassignEquipmentModal: React.FC<UnassignEquipmentModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnassignEquipment = async () => {
    if (!equipment) return;

    try {
      setLoading(true);
      
      await equipmentAssignmentService.unassignEquipment({
        equipmentId: equipment.id,
        reason: reason || `Equipamento ${equipment.serialNumber} removido de ${equipment.currentUserName}`
      });
      
      toast({
        title: "Sucesso!",
        description: `Equipamento ${equipment.serialNumber} removido de ${equipment.currentUserName}`,
      });
      
      onSuccess();
      onClose();
      setReason('');
    } catch (error) {
      console.error('Erro ao remover atribuição de equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover atribuição do equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Remover Atribuição de Equipamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do equipamento */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você está prestes a remover a atribuição do equipamento <strong>{equipment.serialNumber}</strong> do funcionário <strong>{equipment.currentUserName}</strong>.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da remoção (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da remoção da atribuição..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUnassignEquipment}
            disabled={loading}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Removendo...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Remover Atribuição
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnassignEquipmentModal;
