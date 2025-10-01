import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { pagamentosService, Pagamento, Cliente, CreatePagamentoRequest, UpdatePagamentoRequest } from '@/services/pagamentosService';

interface PagamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pagamento?: Pagamento | null;
  clientes: Cliente[];
}

interface FormData {
  clienteId: string;
  descricao: string;
  valor: string;
  dataVencimento: Date | undefined;
  formaPagamento: 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'CARTAO' | 'DINHEIRO' | '';
  categoria: 'FORNECEDOR' | 'SERVICO' | 'EQUIPAMENTO' | 'IMPOSTO' | 'OUTROS' | '';
  observacoes: string;
  numeroDocumento: string;
  centroCusto: string;
  agendarPagamento: boolean;
  dataAgendamento: Date | undefined;
}

export const PagamentoFormModal: React.FC<PagamentoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pagamento,
  clientes
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clienteId: '',
    descricao: '',
    valor: '',
    dataVencimento: undefined,
    formaPagamento: '',
    categoria: '',
    observacoes: '',
    numeroDocumento: '',
    centroCusto: '',
    agendarPagamento: false,
    dataAgendamento: undefined
  });

  const isEditMode = !!pagamento;

  // Resetar formulário quando modal abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (pagamento) {
        // Modo edição
        setFormData({
          clienteId: pagamento.clienteId,
          descricao: pagamento.descricao,
          valor: pagamento.valor.toString(),
          dataVencimento: new Date(pagamento.dataVencimento),
          formaPagamento: pagamento.formaPagamento,
          categoria: pagamento.categoria,
          observacoes: pagamento.observacoes || '',
          numeroDocumento: pagamento.numeroDocumento || '',
          centroCusto: pagamento.centroCusto || '',
          agendarPagamento: !!pagamento.agendamento,
          dataAgendamento: pagamento.agendamento ? new Date(pagamento.agendamento.dataAgendamento) : undefined
        });
      } else {
        // Modo criação
        setFormData({
          clienteId: '',
          descricao: '',
          valor: '',
          dataVencimento: undefined,
          formaPagamento: '',
          categoria: '',
          observacoes: '',
          numeroDocumento: '',
          centroCusto: '',
          agendarPagamento: false,
          dataAgendamento: undefined
        });
      }
    }
  }, [isOpen, pagamento]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.clienteId) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.descricao.trim()) {
      toast({
        title: 'Erro',
        description: 'Descrição é obrigatória.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast({
        title: 'Erro',
        description: 'Valor deve ser maior que zero.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.dataVencimento) {
      toast({
        title: 'Erro',
        description: 'Data de vencimento é obrigatória.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.formaPagamento) {
      toast({
        title: 'Erro',
        description: 'Forma de pagamento é obrigatória.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.categoria) {
      toast({
        title: 'Erro',
        description: 'Categoria é obrigatória.',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.agendarPagamento && !formData.dataAgendamento) {
      toast({
        title: 'Erro',
        description: 'Data de agendamento é obrigatória quando agendamento está ativado.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        clienteId: formData.clienteId,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        dataVencimento: formData.dataVencimento!.toISOString().split('T')[0],
        formaPagamento: formData.formaPagamento as any,
        categoria: formData.categoria as any,
        observacoes: formData.observacoes,
        numeroDocumento: formData.numeroDocumento,
        centroCusto: formData.centroCusto,
        agendarPagamento: formData.agendarPagamento,
        dataAgendamento: formData.dataAgendamento?.toISOString().split('T')[0]
      };

      if (isEditMode) {
        const updateRequest: UpdatePagamentoRequest = {
          ...requestData,
          id: pagamento!.id
        };
        await pagamentosService.updatePagamento(pagamento!.id, updateRequest);
        
        toast({
          title: 'Sucesso',
          description: 'Pagamento atualizado com sucesso.',
        });
      } else {
        await pagamentosService.createPagamento(requestData);
        
        toast({
          title: 'Sucesso',
          description: 'Pagamento criado com sucesso.',
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels = {
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'TRANSFERENCIA': 'Transferência',
      'CARTAO': 'Cartão',
      'DINHEIRO': 'Dinheiro'
    };
    return labels[forma as keyof typeof labels] || forma;
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels = {
      'FORNECEDOR': 'Fornecedor',
      'SERVICO': 'Serviço',
      'EQUIPAMENTO': 'Equipamento',
      'IMPOSTO': 'Imposto',
      'OUTROS': 'Outros'
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Pagamento' : 'Novo Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Atualize as informações do pagamento.' 
              : 'Preencha as informações para criar um novo pagamento.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(clientes) ? clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                )) : (
                  <SelectItem value="no-clients" disabled>
                    Nenhum cliente disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição do pagamento"
            />
          </div>

          {/* Valor e Data de Vencimento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataVencimento ? (
                      format(formData.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dataVencimento}
                    onSelect={(date) => handleInputChange('dataVencimento', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Forma de Pagamento e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={formData.formaPagamento} onValueChange={(value) => handleInputChange('formaPagamento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="SERVICO">Serviço</SelectItem>
                  <SelectItem value="EQUIPAMENTO">Equipamento</SelectItem>
                  <SelectItem value="IMPOSTO">Imposto</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Número do Documento e Centro de Custo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Número do Documento</Label>
              <Input
                id="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                placeholder="Ex: NF-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centroCusto">Centro de Custo</Label>
              <Input
                id="centroCusto"
                value={formData.centroCusto}
                onChange={(e) => handleInputChange('centroCusto', e.target.value)}
                placeholder="Ex: CC-001"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Agendamento de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agendarPagamento"
                checked={formData.agendarPagamento}
                onCheckedChange={(checked) => handleInputChange('agendarPagamento', checked)}
              />
              <Label htmlFor="agendarPagamento" className="text-sm font-medium">
                Agendar Pagamento
              </Label>
            </div>

            {formData.agendarPagamento && (
              <div className="space-y-2">
                <Label>Data do Agendamento *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dataAgendamento ? (
                        format(formData.dataAgendamento, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dataAgendamento}
                      onSelect={(date) => handleInputChange('dataAgendamento', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    O pagamento será agendado para a data selecionada. 
                    Alertas de vencimento serão enviados 3 dias antes da data de vencimento.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Atualizar' : 'Criar'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
