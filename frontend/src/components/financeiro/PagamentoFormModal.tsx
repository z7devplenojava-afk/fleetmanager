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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, CheckCircle, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { pagamentosService, Pagamento, CreatePagamentoRequest, UpdatePagamentoRequest } from '@/services/pagamentosService';
import { Supplier, contasAPagarService } from '@/services/contasAPagarService';
import SupplierFormModal from '@/components/estoque/SupplierFormModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { formatCurrency as formatCurrencyBRL } from '@/utils/formatters';

interface PagamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pagamento?: Pagamento | null;
  fornecedores: Supplier[];
}

interface FormData {
  fornecedorId: string;
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
  fornecedores
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['FORNECEDOR','SERVICO','EQUIPAMENTO','IMPOSTO','OUTROS']);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fornecedorId: '',
    descricao: '',
    valor: 'R$ 0,00',
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
          fornecedorId: pagamento.clienteId || '',
          descricao: pagamento.descricao,
          valor: formatCurrencyBRL(pagamento.valor || 0),
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
          fornecedorId: '',
          descricao: '',
          valor: 'R$ 0,00',
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
    if (!formData.fornecedorId) {
      toast({
        title: 'Erro',
        description: 'Selecione um fornecedor.',
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

    const parsedValor = parseCurrencyBRL(formData.valor);
    if (!formData.valor || parsedValor <= 0) {
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
        // Backend ainda usa clienteId; enviar fornecedorId neste campo
        clienteId: formData.fornecedorId,
        descricao: formData.descricao,
        valor: parseCurrencyBRL(formData.valor),
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

  // Helpers de moeda BRL
  const formatToBRL = (raw: string): string => {
    const onlyDigits = (raw || '').replace(/\D/g, '');
    const number = Number(onlyDigits) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
  };

  const parseCurrencyBRL = (formatted: string): number => {
    const onlyDigits = (formatted || '').replace(/\D/g, '');
    if (!onlyDigits) return 0;
    return Number(onlyDigits) / 100;
  };

  const handleValorChange = (value: string) => {
    setFormData(prev => ({ ...prev, valor: formatToBRL(value) }));
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
          {/* Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor *</Label>
            <Select value={formData.fornecedorId} onValueChange={(value) => handleInputChange('fornecedorId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-3 py-2 text-xs text-gray-500">Ações rápidas</div>
                <SelectItem value="__novo_fornecedor__" className="text-seguranca-yellow" onClick={(e) => { e.preventDefault(); setSupplierModalOpen(true); }}>
                  + Novo Fornecedor
                </SelectItem>
                <Separator className="my-1" />
                {Array.isArray(fornecedores) && fornecedores.length > 0 ? (
                  fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-suppliers" disabled>
                    Nenhum fornecedor disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {(!Array.isArray(fornecedores) || fornecedores.length === 0) && (
              <div className="text-xs text-gray-500 mt-1">
                Nenhum fornecedor encontrado.{' '}
                <button
                  type="button"
                  className="text-seguranca-yellow underline"
                  onClick={() => setSupplierModalOpen(true)}
                >
                  Cadastrar fornecedor
                </button>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição do pagamento"
              className="bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
            />
          </div>

          {/* Valor e Data de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="text"
                inputMode="numeric"
                value={formData.valor}
                onChange={(e) => handleValorChange(e.target.value)}
                placeholder="R$ 0,00"
                className="bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-seguranca-yellow"><CalendarDays className="h-4 w-4" />Data de Vencimento *</Label>
              <DatePicker
                selected={formData.dataVencimento}
                onChange={(date: Date | null) => handleInputChange('dataVencimento', date || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white !text-black !placeholder:text-gray-500 font-medium"
                {...DEFAULT_DATE_PICKER_PROPS}
                required
              />
            </div>
          </div>

          {/* Forma de Pagamento e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="px-3 py-2 text-xs text-gray-500">Ações rápidas</div>
                  <SelectItem value="__nova_categoria__" className="text-seguranca-yellow" onClick={(e) => { e.preventDefault(); setNewCategoryModalOpen(true); }}>
                    + Nova Categoria
                  </SelectItem>
                  <Separator className="my-1" />
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Número do Documento e Centro de Custo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Número do Documento</Label>
              <Input
                id="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                placeholder="Ex: NF-12345"
                className="bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centroCusto">Centro de Custo</Label>
              <Input
                id="centroCusto"
                value={formData.centroCusto}
                onChange={(e) => handleInputChange('centroCusto', e.target.value)}
                placeholder="Ex: CC-001"
                className="bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
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
              className="bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
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
              <Label className="flex items-center gap-2 text-seguranca-yellow"><CalendarDays className="h-4 w-4" />Data do Agendamento *</Label>
                <DatePicker
                  selected={formData.dataAgendamento}
                  onChange={(date: Date | null) => handleInputChange('dataAgendamento', date || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white !text-black !placeholder:text-gray-500 font-medium"
                  {...DEFAULT_DATE_PICKER_PROPS}
                  required
                />

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
      {/* Modal Novo Fornecedor */}
      <SupplierFormModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSave={async (payload) => {
          await contasAPagarService.createFornecedor(payload);
          setSupplierModalOpen(false);
        }}
      />
      {/* Modal Nova Categoria */}
      <Dialog open={newCategoryModalOpen} onOpenChange={setNewCategoryModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>Crie uma categoria para o pagamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da categoria" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewCategoryModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => { if (newCategoryName.trim()) { setCategories(prev => Array.from(new Set([newCategoryName.trim(), ...prev]))); handleInputChange('categoria', newCategoryName.trim()); } setNewCategoryModalOpen(false); setNewCategoryName(''); }}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
