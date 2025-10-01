import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { clientService } from '@/services/clientService';

interface ContratoFormData {
  clientId: string;
  contractNumber: string;
  description: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING';
  notes?: string;
  notificar_rh?: boolean;
  notificar_dp?: boolean;
  notificar_operacional?: boolean;
}

interface ContratoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
  onSuccess?: () => void;
  contrato?: ContratoFormData | null;
}

export const ContratoFormModal: React.FC<ContratoFormModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onSuccess,
  contrato
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState<ContratoFormData>({
    clientId: '',
    contractNumber: '',
    description: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'ACTIVE',
    notes: '',
    notificar_rh: false,
    notificar_dp: false,
    notificar_operacional: false
  });

  // Carregar clientes quando o modal abrir
  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const clientsData = await clientService.getClients({ page: 0, size: 1000 });
      let clientes = [];
      if (Array.isArray(clientsData)) {
        clientes = clientsData;
      } else if (clientsData && typeof clientsData === 'object') {
        if (Array.isArray(clientsData.content)) {
          clientes = clientsData.content;
        }
      }
      setClients(clientes);
      console.log('👥 Clientes carregados:', clientes);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (contrato) {
      setFormData({
        ...contrato,
        startDate: contrato.startDate ? new Date(contrato.startDate).toISOString().split('T')[0] : '',
        endDate: contrato.endDate ? new Date(contrato.endDate).toISOString().split('T')[0] : '',
        notificar_rh: contrato.notificar_rh || false,
        notificar_dp: contrato.notificar_dp || false,
        notificar_operacional: contrato.notificar_operacional || false
      });
    } else {
      setFormData({
        clientId: '',
        contractNumber: '',
        description: '',
        startDate: '',
        endDate: '',
        value: 0,
        status: 'ACTIVE',
        notes: '',
        notificar_rh: false,
        notificar_dp: false,
        notificar_operacional: false
      });
    }
  }, [contrato]);

  const createNotifications = async (contratoId: string, contratoData: ContratoFormData) => {
    const notifications = [];
    
    if (contratoData.notificar_rh) {
      notifications.push({
        contrato_id: contratoId,
        departamento: 'rh',
        titulo: 'Novo Contrato - RH',
        mensagem: `Novo contrato cadastrado com o cliente ${contratoData.cliente}. Tipo: ${contratoData.tipo}. Valor: R$ ${contratoData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      });
    }

    if (contratoData.notificar_dp) {
      notifications.push({
        contrato_id: contratoId,
        departamento: 'dp',
        titulo: 'Novo Contrato - DP',
        mensagem: `Novo contrato cadastrado com o cliente ${contratoData.cliente}. Vigência até: ${new Date(contratoData.vigencia).toLocaleDateString('pt-BR')}.`
      });
    }

    if (contratoData.notificar_operacional) {
      notifications.push({
        contrato_id: contratoId,
        departamento: 'operacional',
        titulo: 'Novo Contrato - Operacional',
        mensagem: `Novo contrato operacional cadastrado com ${contratoData.cliente}. Tipo de serviço: ${contratoData.tipo}.`
      });
    }

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('notificacoes')
        .insert(notifications);

      if (error) {
        console.error('Erro ao criar notificações:', error);
        toast({
          title: "Aviso",
          description: "Contrato salvo, mas houve erro ao criar notificações.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (onSubmit) {
        // Gerar número do contrato se não fornecido
        const contractNumber = formData.contractNumber || 
          `CON-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
        
        // Dados para enviar ao backend (formato ContractDTO)
        const contractData = {
          contractNumber,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          value: formData.value,
          status: formData.status,
          clientId: formData.clientId,
          notes: formData.notes
        };
        
        console.log('📤 Enviando dados para backend:', contractData);
        console.log('👥 Cliente selecionado:', formData.clientId);
        console.log('📋 Clientes disponíveis:', clients);
        
        await onSubmit(contractData);
        
        // TODO: Implementar notificações via backend
        if (formData.notificar_rh || formData.notificar_dp || formData.notificar_operacional) {
          console.log('📢 Notificações solicitadas:', {
            rh: formData.notificar_rh,
            dp: formData.notificar_dp,
            operacional: formData.notificar_operacional
          });
        }
      } else {
        // Fallback para o comportamento original (Supabase)
        if (contrato?.id) {
          const { error } = await supabase
            .from('contratos')
            .update({
              cliente: formData.cliente,
              tipo: formData.tipo,
              valor: formData.valor,
              vigencia: formData.vigencia,
              status: formData.status,
              observacoes: formData.observacoes,
              notificar_rh: formData.notificar_rh,
              notificar_dp: formData.notificar_dp,
              notificar_operacional: formData.notificar_operacional
            })
            .eq('id', contrato.id);

          if (error) throw error;

          toast({
            title: "Sucesso",
            description: "Contrato atualizado com sucesso!",
          });
        } else {
          const { data, error } = await supabase
            .from('contratos')
            .insert([{
              cliente: formData.cliente,
              tipo: formData.tipo,
              valor: formData.valor,
              vigencia: formData.vigencia,
              status: formData.status,
              observacoes: formData.observacoes,
              notificar_rh: formData.notificar_rh,
              notificar_dp: formData.notificar_dp,
              notificar_operacional: formData.notificar_operacional
            }])
            .select()
            .single();

          if (error) throw error;

          // Criar notificações se necessário
          await createNotifications(data.id, {
            cliente: formData.cliente,
            tipo: formData.tipo,
            valor: formData.valor,
            vigencia: formData.vigencia,
            status: formData.status,
            observacoes: formData.observacoes,
            notificar_rh: formData.notificar_rh,
            notificar_dp: formData.notificar_dp,
            notificar_operacional: formData.notificar_operacional
          });

          toast({
            title: "Sucesso",
            description: "Contrato cadastrado com sucesso!",
          });
        }
      }

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar contrato:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar contrato. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray">
            {contrato ? 'Editar Contrato' : 'Novo Contrato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente" className="text-seguranca-lightgray">Cliente *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
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
            </div>

            <div>
              <Label htmlFor="contractNumber" className="text-seguranca-lightgray">Número do Contrato</Label>
              <Input
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Deixe em branco para gerar automaticamente"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-seguranca-lightgray">Descrição do Contrato *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Descreva os serviços do contrato..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value" className="text-seguranca-lightgray">Valor (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                required
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-seguranca-lightgray">Data de Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-seguranca-lightgray">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-seguranca-lightgray">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={3}
              placeholder="Observações adicionais sobre o contrato..."
            />
          </div>

          <div className="space-y-3">
            <Label className="text-seguranca-lightgray">Notificar Departamentos:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notificar_rh"
                checked={formData.notificar_rh}
                onCheckedChange={(checked) => setFormData({ ...formData, notificar_rh: !!checked })}
              />
              <Label htmlFor="notificar_rh" className="text-seguranca-lightgray">Recursos Humanos</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notificar_dp"
                checked={formData.notificar_dp}
                onCheckedChange={(checked) => setFormData({ ...formData, notificar_dp: !!checked })}
              />
              <Label htmlFor="notificar_dp" className="text-seguranca-lightgray">Departamento Pessoal</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notificar_operacional"
                checked={formData.notificar_operacional}
                onCheckedChange={(checked) => setFormData({ ...formData, notificar_operacional: !!checked })}
              />
              <Label htmlFor="notificar_operacional" className="text-seguranca-lightgray">Operacional</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Contrato'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
