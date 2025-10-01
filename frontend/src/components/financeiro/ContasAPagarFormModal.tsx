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
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';

export interface ContaAPagar {
  id?: string;
  dataEmissao?: Date;
  vencimento: Date;
  fornecedor: string;
  fornecedorId?: string;
  empresa?: string;
  empresaId?: string;
  descricao: string;
  tipo: 'FIXA' | 'VARIAVEL';
  valor: number;
  codigoBarras?: string;
  status: 'ABERTA' | 'PAGA' | 'ATRASADA' | 'CANCELADA' | 'VENCIDA';
  baixa: boolean;
  dataPagamento?: Date;
  observacoes?: string;
  comprovante?: File;
  categoria?: string | undefined;
  centroCusto?: string | undefined;
  createdAt?: Date;
}

interface ContasAPagarFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: ContaAPagar | null;
}

export const ContasAPagarFormModal: React.FC<ContasAPagarFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ContaAPagar>({
    dataEmissao: new Date(),
    vencimento: new Date(),
    fornecedor: '',
    fornecedorId: '',
    empresa: '',
    empresaId: '',
    descricao: '',
    tipo: 'VARIAVEL',
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
      // Carregar fornecedores
      contasAPagarService.getFornecedores()
        .then(data => {
          const fornecedoresArray = Array.isArray(data) ? data : [];
          setFornecedores(fornecedoresArray);
        })
        .catch(error => {
          console.error('Erro ao carregar fornecedores:', error);
          setFornecedores([
            { id: '1', name: 'Fornecedor Exemplo 1', isActive: true },
            { id: '2', name: 'Fornecedor Exemplo 2', isActive: true }
          ]);
        });

      // Carregar empresas
      contasAPagarService.getEmpresas()
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
      contasAPagarService.getCategories()
        .then(data => {
          const categoriasArray = Array.isArray(data) ? data : [];
          setCategories(categoriasArray);
        })
        .catch(error => {
          console.error('Erro ao carregar categorias:', error);
          setCategories([
            'Aluguel',
            'Energia Elétrica',
            'Telefone/Internet',
            'Material de Escritório',
            'Manutenção',
            'Outros'
          ]);
        });

      // Carregar centros de custo
      contasAPagarService.getCostCenters()
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
          dataEmissao: new Date(),
          vencimento: new Date(),
          fornecedor: '',
          fornecedorId: '',
          empresa: '',
          empresaId: '',
          descricao: '',
          tipo: 'VARIAVEL',
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

  const handleInputChange = (field: keyof ContaAPagar, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fornecedor || !formData.descricao || !formData.valor || !formData.vencimento) {
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
        await contasAPagarService.updateContaAPagar(initialData.id, formData);
        toast({
          title: "Sucesso",
          description: "Conta a pagar atualizada com sucesso!"
        });
      } else {
        await contasAPagarService.createContaAPagar(formData);
        toast({
          title: "Sucesso",
          description: "Conta a pagar criada com sucesso!"
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta a pagar. Tente novamente.",
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
          <DialogTitle className="text-xl font-bold text-seguranca-yellow flex items-center gap-2">
            <Plus size={20} />
            {editMode ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            {editMode ? 'Atualize as informações da conta a pagar' : 'Preencha os dados da nova conta a pagar'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="text-sm font-medium text-red-400 flex items-center gap-2">
                <CalendarDays size={14} />
                Data de Vencimento *
              </label>
              <DatePicker
                selected={formData.vencimento}
                onChange={(date) => handleInputChange('vencimento', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                  className="w-full px-3 py-2 border border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white text-black font-medium [&>input]:text-black [&>input]:bg-white"
                {...DEFAULT_DATE_PICKER_PROPS}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Descrição *</label>
              <Input
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição da despesa"
                className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                required
              />
            </div>

            {/* Fornecedor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Fornecedor *</label>
              <Select
                value={formData.fornecedorId}
                onValueChange={(value) => {
                  const fornecedor = fornecedores.find(f => f.id === value);
                  handleInputChange('fornecedorId', value);
                  handleInputChange('fornecedor', fornecedor?.name || '');
                }}
                required
              >
                <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {fornecedores.map((fornecedor) => (
                    <SelectItem 
                      key={fornecedor.id} 
                      value={fornecedor.id}
                      className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                    >
                      {fornecedor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Empresa *</label>
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

            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Tipo *</label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange('tipo', value)}
                required
              >
                <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="FIXA" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                    Fixa
                  </SelectItem>
                  <SelectItem value="VARIAVEL" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                    Variável
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-400 flex items-center gap-2">
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
                className="border-red-500 bg-seguranca-black text-red-300 placeholder:text-red-400/60 focus:border-red-400 focus:ring-red-400 font-medium"
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Categoria</label>
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
              <label className="text-sm font-medium text-seguranca-lightgray">Centro de Custo</label>
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

            {/* Código de Barras */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Código de Barras</label>
              <Input
                value={formData.codigoBarras}
                onChange={(e) => handleInputChange('codigoBarras', e.target.value)}
                placeholder="Código de barras (opcional)"
                className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
              />
            </div>

            {/* Observações */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Observações</label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                rows={3}
              />
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
              className="bg-seguranca-red hover:bg-seguranca-darkred"
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