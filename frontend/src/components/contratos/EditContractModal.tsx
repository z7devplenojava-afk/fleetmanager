import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X } from 'lucide-react';
import { Contract, ContractType, contractService, UpdateContractRequest } from '@/services/contractService';
import { clientService, Client } from '@/services/clientService';

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'ARRENDAMENTO', label: 'Arrendamento' },
  { value: 'LOCACAO_VEICULOS', label: 'Locação de Veículos' },
  { value: 'PRESTACAO_SERVICOS', label: 'Prestação de Serviços' },
  { value: 'VENDA', label: 'Venda' },
  { value: 'OUTROS', label: 'Outros' },
];

interface EditContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSuccess: () => void;
}

export const EditContractModal: React.FC<EditContractModalProps> = ({
  open,
  onOpenChange,
  contract,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<UpdateContractRequest>({
    id: '',
    contractNumber: '',
    description: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'ACTIVE',
    clientId: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      loadClients();
      if (contract) {
        setFormData({
          id: contract.id,
          contractNumber: contract.contractNumber,
          description: contract.description,
          startDate: contract.startDate,
          endDate: contract.endDate || '',
          value: contract.value,
          status: contract.status,
          contractType: contract.contractType || 'PRESTACAO_SERVICOS',
          clientId: contract.clientId,
          notes: contract.notes || ''
        });
      }
    }
  }, [open, contract]);

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const clientsData = await clientService.getClients();
      setClients(Array.isArray(clientsData) ? clientsData : clientsData.content || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive"
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contractNumber || !formData.description || !formData.clientId || 
        !formData.startDate || formData.value <= 0) {
      toast({
        title: "Dados Incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Atualizando contrato:', formData);

      const updatedContract = await contractService.updateContract(formData.id, {
        contractNumber: formData.contractNumber,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        value: formData.value,
        status: formData.status,
        contractType: formData.contractType,
        clientId: formData.clientId,
        notes: formData.notes || undefined
      });

      console.log('✅ Contrato atualizado:', updatedContract);

      toast({
        title: "Sucesso!",
        description: `Contrato ${formData.contractNumber} atualizado com sucesso.`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar contrato:', error);
      toast({
        title: "Erro!",
        description: error.message || "Não foi possível atualizar o contrato.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      contractNumber: '',
      description: '',
      startDate: '',
      endDate: '',
      value: 0,
      status: 'ACTIVE',
      clientId: '',
      notes: ''
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            Editar Contrato - {contract.contractNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray">
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-seguranca-lightgray">Número do Contrato *</Label>
                <Input
                  value={formData.contractNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  required
                />
              </div>
              
              <div>
                <Label className="text-seguranca-lightgray">Tipo do Contrato</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value: ContractType) =>
                    setFormData(prev => ({ ...prev, contractType: value }))
                  }
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {CONTRACT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-seguranca-lightgray">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="TERMINATED">Terminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-seguranca-lightgray">Cliente *</Label>
              {loadingClients ? (
                <div className="flex items-center gap-2 p-2 bg-seguranca-black border border-gray-600 rounded">
                  <Loader2 className="h-4 w-4 animate-spin text-seguranca-yellow" />
                  <span className="text-seguranca-lightgray">Carregando clientes...</span>
                </div>
              ) : (
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                  required
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.cnpj || 'Sem CNPJ'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-seguranca-lightgray">Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Valores e Datas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-seguranca-lightgray">
              Valores e Período
            </h3>
            
            <div>
              <Label className="text-seguranca-lightgray">Valor do Contrato (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-seguranca-lightgray">Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  required
                />
              </div>
              
              <div>
                <Label className="text-seguranca-lightgray">Data de Término</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-seguranca-lightgray">Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={3}
              placeholder="Observações adicionais sobre o contrato..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
