import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Building2, 
  Plus, 
  Sparkles,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { clientService } from '@/services/clientService';

type ContractType = 'ARRENDAMENTO' | 'LOCACAO_VEICULOS' | 'PRESTACAO_SERVICOS' | 'VENDA' | 'OUTROS';

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'ARRENDAMENTO', label: 'Arrendamento' },
  { value: 'LOCACAO_VEICULOS', label: 'Locação de Veículos' },
  { value: 'PRESTACAO_SERVICOS', label: 'Prestação de Serviços' },
  { value: 'VENDA', label: 'Venda' },
  { value: 'OUTROS', label: 'Outros' },
];

interface ContratoFormData {
  clientId: string;
  contractNumber: string;
  description: string;
  startDate: Date | null;
  endDate?: Date | null;
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING';
  contractType?: ContractType;
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
    startDate: new Date(),
    endDate: null,
    value: 0,
    status: 'ACTIVE',
    contractType: 'PRESTACAO_SERVICOS',
    notes: '',
    notificar_rh: false,
    notificar_dp: false,
    notificar_operacional: false
  });

  // Função para gerar número do contrato baseado no nome do cliente
  const generateContractNumber = () => {
    if (!formData.clientId) {
      toast({
        title: "Aviso",
        description: "Selecione um cliente primeiro",
        variant: "destructive"
      });
      return;
    }

    const selectedClient = clients.find(client => client.id === formData.clientId);
    if (!selectedClient) return;

    // Extrair sigla do nome do cliente (primeiras letras de cada palavra)
    const clientName = selectedClient.name.toUpperCase();
    const words = clientName.split(' ').filter(word => word.length > 0);
    const sigla = words.map(word => word.charAt(0)).join('').substring(0, 4);
    
    // Gerar número com ano atual e sequencial
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    const contractNumber = `CON-${sigla}-${currentYear}-${randomSuffix}`;
    
    setFormData(prev => ({
      ...prev,
      contractNumber
    }));

    toast({
      title: "Sucesso",
      description: "Número do contrato gerado automaticamente!",
    });
  };

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
        startDate: contrato.startDate ? new Date(contrato.startDate) : new Date(),
        endDate: contrato.endDate ? new Date(contrato.endDate) : null,
        notificar_rh: contrato.notificar_rh || false,
        notificar_dp: contrato.notificar_dp || false,
        notificar_operacional: contrato.notificar_operacional || false
      });
    } else {
      setFormData({
        clientId: '',
        contractNumber: '',
        description: '',
        startDate: new Date(),
        endDate: null,
        value: 0,
        status: 'ACTIVE',
        contractType: 'PRESTACAO_SERVICOS',
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
          startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : '',
          endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
          value: formData.value,
          status: formData.status,
          contractType: formData.contractType,
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
      <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-2 border-gray-600/50 text-white p-0">
        {/* Header Moderno */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-600/30 bg-seguranca-black/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-seguranca-red/20 border border-seguranca-red/30">
              <FileText className="h-6 w-6 text-seguranca-red" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                {contrato ? 'Editar Contrato' : 'Novo Contrato'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-400 mt-1">
                {contrato ? 'Atualize as informações do contrato' : 'Preencha os dados do novo contrato'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            
            {/* Seção 1: Informações Básicas */}
            <Card className="bg-seguranca-black/50 border-gray-600/50 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
                  <FileText size={18} />
                  Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cliente */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <Users size={14} />
                      Cliente *
                    </Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                      required
                    >
                      <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow h-12">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {clients.map(client => (
                          <SelectItem 
                            key={client.id} 
                            value={client.id}
                            className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                          >
                            {client.name} - {client.cnpj || 'Sem CNPJ'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número do Contrato com Botão de Geração */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <FileText size={14} />
                      Número do Contrato
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.contractNumber}
                        onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                        className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow h-12"
                        placeholder="Deixe em branco para gerar automaticamente"
                      />
                      <Button
                        type="button"
                        onClick={generateContractNumber}
                        className="bg-seguranca-yellow hover:bg-yellow-500 text-black px-4 h-12"
                        disabled={!formData.clientId}
                      >
                        <Sparkles size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                    <FileText size={14} />
                    Descrição do Contrato *
                  </Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow min-h-[100px]"
                    placeholder="Descreva os serviços do contrato..."
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Seção 2: Informações Financeiras */}
            <Card className="bg-seguranca-black/50 border-gray-600/50 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
                  <DollarSign size={18} />
                  Informações Financeiras
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Valor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-green-400 flex items-center gap-2">
                      <DollarSign size={14} />
                      Valor (R$) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      className="border-green-500 bg-white text-black placeholder:text-gray-500 focus:border-green-400 focus:ring-green-400 font-medium h-12"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  {/* Tipo do Contrato */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <FileText size={14} />
                      Tipo do Contrato
                    </Label>
                    <Select
                      value={formData.contractType}
                      onValueChange={(value) => setFormData({ ...formData, contractType: value as ContractType })}
                    >
                      <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow h-12">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        {CONTRACT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <CheckCircle size={14} />
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="ACTIVE" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            Ativo
                          </div>
                        </SelectItem>
                        <SelectItem value="PENDING" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-yellow-500" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="INACTIVE" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-gray-500" />
                            Inativo
                          </div>
                        </SelectItem>
                        <SelectItem value="TERMINATED" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-500" />
                            Terminado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Seção 3: Datas */}
            <Card className="bg-seguranca-black/50 border-gray-600/50 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
                  <Calendar size={18} />
                  Datas Importantes
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data de Início */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <CalendarDays size={14} />
                      Data de Início *
                    </Label>
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date: Date | null) => setFormData({ ...formData, startDate: date })}
                      dateFormat="dd/MM/yyyy"
                      locale={ptBR}
                      placeholderText="dd/mm/aaaa"
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white text-black placeholder:text-gray-500 font-medium [&_input]:text-black [&_input]:bg-white [&_input]:placeholder-gray-500"
                      required
                    />
                  </div>

                  {/* Data de Término */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                      <CalendarDays size={14} />
                      Data de Término
                    </Label>
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date: Date | null) => setFormData({ ...formData, endDate: date })}
                      dateFormat="dd/MM/yyyy"
                      locale={ptBR}
                      placeholderText="dd/mm/aaaa"
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white text-black placeholder:text-gray-500 font-medium [&_input]:text-black [&_input]:bg-white [&_input]:placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Seção 4: Observações */}
            <Card className="bg-seguranca-black/50 border-gray-600/50 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
                  <FileText size={18} />
                  Observações
                </h3>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                    <FileText size={14} />
                    Observações Adicionais
                  </Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow min-h-[100px]"
                    rows={4}
                    placeholder="Observações adicionais sobre o contrato..."
                  />
                </div>
              </div>
            </Card>

            {/* Seção 5: Notificações */}
            <Card className="bg-seguranca-black/50 border-gray-600/50 p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
                  <Bell size={18} />
                  Notificar Departamentos
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-seguranca-graphite/30 border border-gray-600/30">
                    <Checkbox
                      id="notificar_rh"
                      checked={formData.notificar_rh}
                      onCheckedChange={(checked) => setFormData({ ...formData, notificar_rh: !!checked })}
                      className="border-seguranca-yellow data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                    />
                    <Label htmlFor="notificar_rh" className="text-seguranca-lightgray font-medium">
                      Recursos Humanos
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-seguranca-graphite/30 border border-gray-600/30">
                    <Checkbox
                      id="notificar_dp"
                      checked={formData.notificar_dp}
                      onCheckedChange={(checked) => setFormData({ ...formData, notificar_dp: !!checked })}
                      className="border-seguranca-yellow data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                    />
                    <Label htmlFor="notificar_dp" className="text-seguranca-lightgray font-medium">
                      Departamento Pessoal
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-seguranca-graphite/30 border border-gray-600/30">
                    <Checkbox
                      id="notificar_operacional"
                      checked={formData.notificar_operacional}
                      onCheckedChange={(checked) => setFormData({ ...formData, notificar_operacional: !!checked })}
                      className="border-seguranca-yellow data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                    />
                    <Label htmlFor="notificar_operacional" className="text-seguranca-lightgray font-medium">
                      Operacional
                    </Label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer com Botões */}
          <div className="px-6 py-4 border-t border-gray-600/30 bg-seguranca-black/50">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-600 text-white hover:bg-seguranca-black h-12 px-6"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-seguranca-red hover:bg-red-700 text-white h-12 px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    {contrato ? 'Atualizar' : 'Criar'} Contrato
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
