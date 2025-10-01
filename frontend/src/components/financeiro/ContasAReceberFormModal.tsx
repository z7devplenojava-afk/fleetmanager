import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, DollarSign, FileText, Upload, Plus, Users, Building2, Tag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { formatDateForBackend, parseDateFromBackend, DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { contasAReceberService, Client } from '@/services/contasAReceberService';

export interface ContaAReceber {
  id?: string;
  numeroFatura?: string;
  dataEmissao?: Date;
  vencimento: Date;
  cliente: string;
  clienteId?: string;
  empresa?: string;
  empresaId?: string;
  descricao: string;
  tipo: 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO';
  valor: number;
  codigoBarras?: string;
  status: 'ABERTA' | 'RECEBIDA' | 'VENCIDA' | 'CANCELADA';
  baixa: boolean;
  dataPagamento?: Date;
  observacoes?: string;
  comprovante?: File;
  categoria?: string | undefined;
  centroCusto?: string | undefined;
  createdAt?: Date;
}

interface ContasAReceberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: ContaAReceber | null;
}

export const ContasAReceberFormModal: React.FC<ContasAReceberFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ContaAReceber>({
    numeroFatura: '',
    dataEmissao: new Date(),
    vencimento: new Date(),
    cliente: '',
    clienteId: '',
    empresa: '',
    empresaId: '',
    descricao: '',
    tipo: 'FATURA',
    valor: 0,
    codigoBarras: '',
    status: 'ABERTA',
    baixa: false,
    dataPagamento: undefined,
    observacoes: '',
    categoria: undefined,
    centroCusto: undefined
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<string[]>([]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open) {
      // Carregar clientes
      contasAReceberService.getClientes()
        .then(data => {
          const clientesArray = Array.isArray(data) ? data : [];
          setClientes(clientesArray);
        })
        .catch(error => {
          console.error('Erro ao carregar clientes:', error);
          setClientes([
            { id: '1', name: 'Cliente Exemplo 1', isActive: true },
            { id: '2', name: 'Cliente Exemplo 2', isActive: true }
          ]);
        });

      // Carregar empresas
      contasAReceberService.getEmpresas()
        .then(data => {
          const empresasArray = Array.isArray(data) ? data : [];
          setEmpresas(empresasArray);
        })
        .catch(error => {
          console.error('Erro ao carregar empresas:', error);
          setEmpresas([
            { id: '1', name: 'Empresa Exemplo 1' },
            { id: '2', name: 'Empresa Exemplo 2' }
          ]);
        });

      // Carregar categorias
      contasAReceberService.getCategories()
        .then(data => {
          const categoriasArray = Array.isArray(data) ? data : [];
          setCategories(categoriasArray);
        })
        .catch(error => {
          console.error('Erro ao carregar categorias:', error);
          setCategories([
            'Serviços de Segurança',
            'Consultoria',
            'Manutenção',
            'Equipamentos',
            'Treinamento',
            'Auditoria',
            'Outros'
          ]);
        });

      // Carregar centros de custo
      contasAReceberService.getCostCenters()
        .then(data => {
          const centrosArray = Array.isArray(data) ? data : [];
          setCostCenters(centrosArray);
        })
        .catch(error => {
          console.error('Erro ao carregar centros de custo:', error);
          setCostCenters([
            'Administrativo',
            'Operacional',
            'Comercial',
            'Financeiro',
            'Recursos Humanos',
            'Tecnologia da Informação',
            'Marketing',
            'Vendas',
            'Produção',
            'Logística'
          ]);
        });
    }
  }, [open]);

  // Atualizar dados do formulário quando initialData mudar
  useEffect(() => {
    if (open) {
      if (editMode && initialData) {
        setFormData({
          ...initialData,
          dataEmissao: initialData.dataEmissao || new Date(),
          vencimento: initialData.vencimento || new Date(),
          dataPagamento: initialData.dataPagamento || undefined,
          observacoes: initialData.observacoes || '',
          categoria: initialData.categoria || '',
          centroCusto: initialData.centroCusto || ''
        });
      } else {
        // Resetar formulário para modo de criação
        setFormData({
          numeroFatura: '',
          dataEmissao: new Date(),
          vencimento: new Date(),
          cliente: '',
          clienteId: '',
          empresa: '',
          empresaId: '',
          descricao: '',
          tipo: 'FATURA',
          valor: 0,
          codigoBarras: '',
          status: 'ABERTA',
          baixa: false,
          dataPagamento: undefined,
          observacoes: '',
          categoria: undefined,
          centroCusto: undefined
        });
      }
    }
  }, [editMode, initialData, open]);

  const handleInputChange = (field: keyof ContaAReceber, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente || !formData.descricao || !formData.valor || !formData.vencimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (editMode && initialData?.id) {
        await contasAReceberService.updateContaAReceber(initialData.id, formData);
        toast({
          title: "Sucesso",
          description: "Conta a receber atualizada com sucesso!"
        });
      } else {
        await contasAReceberService.createContaAReceber(formData);
        toast({
          title: "Sucesso",
          description: "Conta a receber criada com sucesso!"
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta a receber. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-500 flex items-center gap-2">
            <Plus size={20} />
            {editMode ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {editMode ? 'Atualize as informações da conta a receber' : 'Preencha os dados da nova conta a receber'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <FileText size={18} />
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número da Fatura */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <FileText size={14} />
                  Número da Fatura
                </label>
                <Input
                  value={formData.numeroFatura}
                  onChange={(e) => handleInputChange('numeroFatura', e.target.value)}
                  placeholder="Ex: FAT-2024-001"
                  className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <FileText size={14} />
                  Descrição *
                </label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição do serviço/produto"
                  className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Datas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <CalendarDays size={18} />
              Datas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data de Emissão */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-400 flex items-center gap-2">
                  <CalendarDays size={14} />
                  Data de Emissão *
                </label>
                <DatePicker
                  selected={formData.dataEmissao}
                  onChange={(date) => handleInputChange('dataEmissao', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white text-black font-medium [&>input]:text-black [&>input]:bg-white"
                  {...DEFAULT_DATE_PICKER_PROPS}
                  required
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-400 flex items-center gap-2">
                  <CalendarDays size={14} />
                  Data de Vencimento *
                </label>
                <DatePicker
                  selected={formData.vencimento}
                  onChange={(date) => handleInputChange('vencimento', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="w-full px-3 py-2 border border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white text-black font-medium [&>input]:text-black [&>input]:bg-white"
                  {...DEFAULT_DATE_PICKER_PROPS}
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Cliente e Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <Users size={18} />
              Cliente e Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <Users size={14} />
                  Cliente *
                </label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => {
                    const cliente = clientes.find(c => c.id === value);
                    handleInputChange('clienteId', value);
                    handleInputChange('cliente', cliente?.name || '');
                  }}
                  required
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {clientes.map((cliente) => (
                      <SelectItem 
                        key={cliente.id} 
                        value={cliente.id}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {cliente.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <Building2 size={14} />
                  Empresa *
                </label>
                <Select
                  value={formData.empresaId}
                  onValueChange={(value) => {
                    const empresa = empresas.find(e => e.id === value);
                    handleInputChange('empresaId', value);
                    handleInputChange('empresa', empresa?.name || '');
                  }}
                  required
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {empresas.map((empresa) => (
                      <SelectItem 
                        key={empresa.id} 
                        value={empresa.id}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {empresa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 4: Informações Financeiras */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <DollarSign size={18} />
              Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <Tag size={14} />
                  Tipo *
                </label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleInputChange('tipo', value)}
                  required
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="FATURA" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Fatura
                    </SelectItem>
                    <SelectItem value="MEDICAO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Medição
                    </SelectItem>
                    <SelectItem value="SERVICO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Serviço
                    </SelectItem>
                    <SelectItem value="PRODUTO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Produto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-400 flex items-center gap-2">
                  <DollarSign size={14} />
                  Valor *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="border-green-500 bg-seguranca-black text-green-300 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 5: Classificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <Tag size={18} />
              Classificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <Tag size={14} />
                  Categoria
                </label>
                <Select
                  value={formData.categoria || 'NENHUMA'}
                  onValueChange={(value) => handleInputChange('categoria', value)}
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem 
                      value="NENHUMA"
                      className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                    >
                      Nenhuma categoria
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category} 
                        value={category}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Centro de Custo */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <Tag size={14} />
                  Centro de Custo
                </label>
                <Select
                  value={formData.centroCusto || 'NENHUM'}
                  onValueChange={(value) => handleInputChange('centroCusto', value)}
                >
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione um centro de custo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem 
                      value="NENHUM"
                      className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                    >
                      Nenhum centro de custo
                    </SelectItem>
                    {costCenters.map((center) => (
                      <SelectItem 
                        key={center} 
                        value={center}
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        {center}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 6: Informações Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-seguranca-yellow flex items-center gap-2">
              <FileText size={18} />
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Código de Barras */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <FileText size={14} />
                  Código de Barras
                </label>
                <Input
                  value={formData.codigoBarras}
                  onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                  placeholder="Código de barras (opcional)"
                  className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <FileText size={14} />
                  Observações
                </label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais (opcional)"
                  className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-white hover:bg-seguranca-black"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  {editMode ? 'Atualizar' : 'Criar'} Conta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};