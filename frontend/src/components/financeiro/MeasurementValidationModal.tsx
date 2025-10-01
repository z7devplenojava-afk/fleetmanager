import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, FileCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin } from '@/types/measurement';

interface MeasurementValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletin: MeasurementBulletin;
  onSuccess: () => void;
}

export const MeasurementValidationModal: React.FC<MeasurementValidationModalProps> = ({
  open,
  onOpenChange,
  bulletin,
  onSuccess
}) => {
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [validationData, setValidationData] = useState({
    validatedBy: '',
    checkedBy: '',
    notes: ''
  });

  const handleValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationData.validatedBy || !validationData.checkedBy) {
      toast({
        title: "Atenção",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setValidating(true);
    try {
      await measurementService.validateBulletin(bulletin.id, {
        validatedBy: validationData.validatedBy,
        checkedBy: validationData.checkedBy
      });
      
      toast({
        title: "Sucesso",
        description: "Boletim de medição validado com sucesso!"
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao validar boletim:', error);
      toast({
        title: "Erro",
        description: "Não foi possível validar o boletim de medição",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (field: keyof typeof validationData, value: string) => {
    setValidationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-seguranca-yellow" />
            Validar Boletim de Medição
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleValidation} className="space-y-6">
          {/* Informações do Boletim */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg">Informações do Boletim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Contrato</Label>
                  <p className="text-seguranca-lightgray font-medium">{bulletin.contractNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Status Atual</Label>
                  <Badge variant="default" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Cliente</Label>
                  <p className="text-seguranca-lightgray">{bulletin.client?.name || 'Cliente não definido'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Valor Total</Label>
                  <p className="text-seguranca-yellow font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(bulletin.subtotal || 0)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-400">Período</Label>
                <p className="text-seguranca-lightgray">
                  {bulletin.periodStart && bulletin.periodEnd 
                    ? `${new Date(bulletin.periodStart).toLocaleDateString('pt-BR')} a ${new Date(bulletin.periodEnd).toLocaleDateString('pt-BR')}`
                    : '-'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Validação */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Dados da Validação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validatedBy" className="text-seguranca-lightgray">
                    Validado por (ADM) *
                  </Label>
                  <Input
                    id="validatedBy"
                    value={validationData.validatedBy}
                    onChange={(e) => handleInputChange('validatedBy', e.target.value)}
                    placeholder="Ex: Otto Mendes - ADM"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkedBy" className="text-seguranca-lightgray">
                    Conferido por *
                  </Label>
                  <Input
                    id="checkedBy"
                    value={validationData.checkedBy}
                    onChange={(e) => handleInputChange('checkedBy', e.target.value)}
                    placeholder="Ex: Benedito"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-seguranca-lightgray">
                  Observações da Validação
                </Label>
                <Textarea
                  id="notes"
                  value={validationData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações sobre a validação (opcional)"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo da Validação */}
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-400 mb-3">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Resumo da Validação</span>
              </div>
              <div className="text-sm text-green-300 space-y-1">
                <p>• O boletim será marcado como <strong>VALIDADO</strong></p>
                <p>• Será possível gerar relatórios e notas fiscais</p>
                <p>• O status não poderá ser alterado posteriormente</p>
                <p>• A validação será registrada com data e hora</p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={validating || !validationData.validatedBy || !validationData.checkedBy}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar Boletim
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
