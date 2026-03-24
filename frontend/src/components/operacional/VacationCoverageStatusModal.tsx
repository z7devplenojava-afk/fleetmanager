import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface VacationCoverageStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  onConfirm: (newStatus: string) => void;
}

// Status específicos para cobertura de férias
const statusOptions = [
  { value: 'PENDING', label: 'Pendente', icon: Clock, color: 'text-yellow-500', description: 'Aguardando confirmação do substituto' },
  { value: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle2, color: 'text-green-500', description: 'Substituto confirmou a cobertura' },
  { value: 'NO_COVERAGE', label: 'Sem Cobertura', icon: AlertTriangle, color: 'text-red-500', description: 'Sem substituto disponível' },
  { value: 'COMPLETED', label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-600', description: 'Período de cobertura finalizado' },
  { value: 'CANCELLED', label: 'Cancelado', icon: XCircle, color: 'text-gray-500', description: 'Cobertura cancelada' },
];

export default function VacationCoverageStatusModal({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
}: VacationCoverageStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleConfirm = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      onConfirm(selectedStatus);
      onOpenChange(false);
    }
  };

  const getCurrentStatusLabel = () => {
    const status = statusOptions.find(s => s.value === currentStatus);
    return status?.label || currentStatus;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            Alterar Status da Cobertura
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Selecione o novo status para esta cobertura de férias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-seguranca-lightgray">
              Status Atual: <span className="font-semibold text-white">{getCurrentStatusLabel()}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-seguranca-lightgray font-medium">
              Novo Status <span className="text-seguranca-red">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-11">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-seguranca-lightgray hover:bg-seguranca-red/20 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${option.color} mt-0.5 flex-shrink-0`} />
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-gray-400">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedStatus === currentStatus}
            className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
          >
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

























