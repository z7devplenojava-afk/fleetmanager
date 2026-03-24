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
  paymentMethod?: string; // PaymentMethod enum: PIX, BOLETO, TRANSFER, CASH, CARD
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
    status: 'ABERTA',
    baixa: false,
    dataPagamento: undefined,
    observacoes: '',
    categoria: 'INVOICE', // Valor padrão - enum ReceivableCategory
    centroCusto: undefined,
    paymentMethod: 'PIX' // Valor padrão - enum PaymentMethod
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
      console.log('🔍 DEBUG: Carregando empresas...');
      contasAReceberService.getEmpresas()
        .then(data => {
          console.log('🔍 DEBUG: Empresas recebidas:', data);
          const empresasArray = Array.isArray(data) ? data : [];
          console.log('🔍 DEBUG: Empresas processadas:', empresasArray);
          setEmpresas(empresasArray);
        })
        .catch(error => {
          console.error('❌ Erro ao carregar empresas:', error);
          setEmpresas([
            { id: '1', name: 'Empresa Exemplo 1' },
            { id: '2', name: 'Empresa Exemplo 2' }
          ]);
        });

      // Não precisamos mais carregar categorias via API, usando valores fixos do enum
      // setCategories(['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER']);

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
        console.log('📝 Carregando dados para edição:', initialData);
        
        // Mapear dados corretamente, considerando campos alternativos
        const valor = initialData.amount || initialData.valor || 0;
        const vencimento = initialData.dueDate || initialData.vencimento || new Date();
        const dataEmissao = initialData.dataEmissao || new Date();
        const numeroFatura = initialData.invoiceNumber || initialData.numeroFatura || '';
        const clienteId = initialData.clienteId || initialData.client?.id || '';
        const cliente = initialData.client?.name || initialData.cliente || '';
        const empresaId = initialData.empresaId || initialData.unitId || '';
        const empresa = initialData.empresa || initialData.unitSigla || initialData.unitName || '';
        
        // Mapear categoria corretamente (pode vir como enum do backend: INVOICE, NOTE, etc)
        let categoriaMapeada = undefined;
        if (initialData.categoria) {
          const catStr = String(initialData.categoria).toUpperCase();
          // Se for um enum válido, manter como está
          const validCategories = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
          if (validCategories.includes(catStr)) {
            categoriaMapeada = catStr;
          } else {
            categoriaMapeada = initialData.categoria;
          }
        }
        
        setFormData({
          id: initialData.id,
          numeroFatura: numeroFatura,
          dataEmissao: dataEmissao instanceof Date ? dataEmissao : new Date(dataEmissao),
          vencimento: vencimento instanceof Date ? vencimento : new Date(vencimento),
          cliente: cliente,
          clienteId: clienteId,
          empresa: empresa,
          empresaId: empresaId,
          descricao: initialData.descricao || '',
          tipo: initialData.tipo || 'FATURA',
          valor: typeof valor === 'number' ? valor : parseFloat(valor.toString()) || 0,
          codigoBarras: initialData.codigoBarras || '',
          status: initialData.status || 'ABERTA',
          baixa: initialData.baixa || false,
          dataPagamento: initialData.dataPagamento ? (initialData.dataPagamento instanceof Date ? initialData.dataPagamento : new Date(initialData.dataPagamento)) : undefined,
          observacoes: initialData.observacoes || '',
          categoria: categoriaMapeada,
          centroCusto: initialData.centroCusto ? String(initialData.centroCusto).trim() : undefined,
          paymentMethod: initialData.paymentMethod || 'PIX'
        });
        
        console.log('✅ FormData preenchido:', {
          numeroFatura,
          cliente,
          clienteId,
          empresa,
          empresaId,
          descricao: initialData.descricao,
          valor,
          vencimento,
          categoria: categoriaMapeada,
          centroCusto: initialData.centroCusto,
          paymentMethod: initialData.paymentMethod
        });
        console.log('📋 initialData completo:', initialData);
        console.log('📋 Campos de empresa e centro de custo:', {
          empresaId: initialData.empresaId,
          unitId: initialData.unitId,
          empresa: initialData.empresa,
          unitSigla: initialData.unitSigla,
          unitName: initialData.unitName,
          centroCusto: initialData.centroCusto
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
          status: 'ABERTA',
          baixa: false,
          dataPagamento: undefined,
          observacoes: '',
          categoria: undefined,
          centroCusto: undefined,
          paymentMethod: 'PIX'
        });
      }
    }
  }, [editMode, initialData, open]);

  // Atualizar clienteId e empresaId quando clientes e empresas forem carregados (modo edição)
  useEffect(() => {
    if (open && editMode && initialData) {
      // Encontrar cliente por ID ou nome
      if (clientes.length > 0) {
        if (initialData.clienteId) {
          const clienteEncontrado = clientes.find(c => c.id === initialData.clienteId || c.id === String(initialData.clienteId));
          if (clienteEncontrado) {
            console.log('✅ Cliente encontrado por ID:', clienteEncontrado);
            setFormData(prev => ({
              ...prev,
              clienteId: clienteEncontrado.id,
              cliente: clienteEncontrado.name
            }));
          }
        } else if (initialData.cliente || initialData.client?.name) {
          const clienteEncontrado = clientes.find(c => 
            c.name === initialData.cliente || 
            c.name === initialData.client?.name ||
            c.id === initialData.client?.id
          );
          if (clienteEncontrado) {
            console.log('✅ Cliente encontrado por nome:', clienteEncontrado);
            setFormData(prev => ({
              ...prev,
              clienteId: clienteEncontrado.id,
              cliente: clienteEncontrado.name
            }));
          }
        }
      }

      // Encontrar empresa por ID ou nome
      if (empresas.length > 0) {
        console.log('🔍 Procurando empresa. initialData.empresaId:', initialData.empresaId, 'initialData.empresa:', initialData.empresa);
        console.log('🔍 Empresas disponíveis:', empresas.map(e => ({ id: e.id, name: e.name, sigla: e.sigla })));
        
        if (initialData.empresaId || initialData.unitId) {
          const empresaIdToFind = initialData.empresaId || initialData.unitId;
          const empresaEncontrada = empresas.find(e => 
            String(e.id) === String(empresaIdToFind) ||
            e.id === empresaIdToFind
          );
          if (empresaEncontrada) {
            console.log('✅ Empresa encontrada por ID:', empresaEncontrada);
            setFormData(prev => ({
              ...prev,
              empresaId: empresaEncontrada.id,
              empresa: empresaEncontrada.sigla || empresaEncontrada.name
            }));
          } else {
            console.log('⚠️ Empresa não encontrada por ID:', empresaIdToFind);
          }
        } else if (initialData.empresa || initialData.unitSigla || initialData.unitName) {
          const empresaToFind = initialData.empresa || initialData.unitSigla || initialData.unitName;
          const empresaEncontrada = empresas.find(e => 
            e.sigla === empresaToFind || 
            e.name === empresaToFind ||
            e.sigla?.toUpperCase() === empresaToFind?.toUpperCase() ||
            e.name?.toUpperCase() === empresaToFind?.toUpperCase()
          );
          if (empresaEncontrada) {
            console.log('✅ Empresa encontrada por nome/sigla:', empresaEncontrada);
            setFormData(prev => ({
              ...prev,
              empresaId: empresaEncontrada.id,
              empresa: empresaEncontrada.sigla || empresaEncontrada.name
            }));
          } else {
            console.log('⚠️ Empresa não encontrada. Procurando:', empresaToFind, 'empresas disponíveis:', empresas.map(e => ({ id: e.id, name: e.name, sigla: e.sigla })));
          }
        } else {
          console.log('⚠️ Nenhuma informação de empresa encontrada em initialData');
        }
      } else {
        console.log('⚠️ Lista de empresas vazia');
      }
      
      // Atualizar categoria se necessário
      if (initialData.categoria && initialData.categoria !== 'NENHUMA' && initialData.categoria !== '') {
        const catStr = String(initialData.categoria).toUpperCase();
        const validCategories = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
        if (validCategories.includes(catStr)) {
          setFormData(prev => ({
            ...prev,
            categoria: catStr
          }));
          console.log('✅ Categoria atualizada:', catStr);
        }
      }
      
      // Atualizar centro de custo se disponível
      if (initialData.centroCusto && costCenters.length > 0) {
        const centroEncontrado = costCenters.find(c => 
          c === initialData.centroCusto ||
          c.toLowerCase() === String(initialData.centroCusto).toLowerCase()
        );
        if (centroEncontrado) {
          setFormData(prev => ({
            ...prev,
            centroCusto: centroEncontrado
          }));
          console.log('✅ Centro de custo atualizado:', centroEncontrado);
        } else {
          console.log('⚠️ Centro de custo não encontrado na lista. Valor:', initialData.centroCusto, 'Lista:', costCenters);
          // Mesmo que não esteja na lista, manter o valor se existir
          if (initialData.centroCusto && String(initialData.centroCusto).trim()) {
            setFormData(prev => ({
              ...prev,
              centroCusto: String(initialData.centroCusto).trim()
            }));
            console.log('✅ Centro de custo mantido (não está na lista):', initialData.centroCusto);
          }
        }
      } else if (initialData.centroCusto && String(initialData.centroCusto).trim()) {
        // Se não houver lista de centros de custo, mas houver valor, manter
        setFormData(prev => ({
          ...prev,
          centroCusto: String(initialData.centroCusto).trim()
        }));
        console.log('✅ Centro de custo mantido (sem lista):', initialData.centroCusto);
      } else {
        console.log('⚠️ Nenhum centro de custo encontrado em initialData');
      }
    }
  }, [open, editMode, initialData, clientes, empresas, costCenters]);

  const handleInputChange = (field: keyof ContaAReceber, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateCategory = () => {
    const categoryName = newCategoryName.trim();
    if (categoryName) {
      setCategories(prev => {
        const newCategories = Array.from(new Set([categoryName, ...prev]));
        return newCategories;
      });
      handleInputChange('categoria', categoryName);
      setNewCategoryName('');
      setNewCategoryModalOpen(false);
      toast({
        title: "Sucesso",
        description: `Categoria "${categoryName}" criada com sucesso!`
      });
    }
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
                  className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
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
                  className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
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
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <CalendarDays size={14} />
                  Data de Emissão *
                </label>
                <DatePicker
                  selected={formData.dataEmissao}
                  onChange={(date: Date | null) => handleInputChange('dataEmissao', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="dd/mm/aaaa"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white text-black font-medium [&_input]:text-black [&_input]:bg-white [&_input]:placeholder-gray-500"
                  required
                />
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <CalendarDays size={14} />
                  Data de Vencimento *
                </label>
                <DatePicker
                  selected={formData.vencimento}
                  onChange={(date: Date | null) => handleInputChange('vencimento', date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="dd/mm/aaaa"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-seguranca-yellow bg-white text-black font-medium [&_input]:text-black [&_input]:bg-white [&_input]:placeholder-gray-500"
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
                  <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {clientes && Array.isArray(clientes) ? clientes
                      .filter(cliente => cliente && cliente.id && cliente.name)
                      .map((cliente) => (
                        <SelectItem
                          key={cliente.id}
                          value={cliente.id}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          {cliente.name}
                        </SelectItem>
                      )) : null}
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
                    handleInputChange('empresa', empresa?.sigla || empresa?.name || '');
                  }}
                  required
                >
                  <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {empresas.length === 0 ? (
                      <SelectItem value="no-data" disabled className="text-gray-500">
                        Carregando empresas...
                      </SelectItem>
                    ) : (
                      empresas.map((empresa) => (
                        <SelectItem 
                          key={empresa.id} 
                          value={empresa.id}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          {empresa.sigla || empresa.name}
                        </SelectItem>
                      ))
                    )}
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
                  <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
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
                  className="border-green-500 bg-white text-black placeholder:text-gray-500 focus:border-green-400 focus:ring-green-400 font-medium"
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
                <div className="flex gap-2">
                  <Select
                    value={formData.categoria && formData.categoria !== 'NENHUMA' ? formData.categoria : 'NENHUMA'}
                    onValueChange={(value) => handleInputChange('categoria', value === 'NENHUMA' ? undefined : value)}
                    className="flex-1"
                  >
                    <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue placeholder="Selecione uma categoria">
                        {formData.categoria && formData.categoria !== 'NENHUMA' 
                          ? (() => {
                              const categoryMap: { [key: string]: string } = {
                                'INVOICE': 'Fatura',
                                'NOTE': 'Nota Fiscal',
                                'ADVANCE': 'Adiantamento',
                                'SERVICE': 'Serviço',
                                'PRODUCT': 'Produto',
                                'OTHER': 'Outros'
                              };
                              return categoryMap[formData.categoria] || formData.categoria;
                            })()
                          : 'Nenhuma categoria'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem 
                        value="NENHUMA"
                        className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                      >
                        Nenhuma categoria
                      </SelectItem>
                      {/* Categorias padrão do enum */}
                      {[
                        { value: 'INVOICE', label: 'Fatura' },
                        { value: 'NOTE', label: 'Nota Fiscal' },
                        { value: 'ADVANCE', label: 'Adiantamento' },
                        { value: 'SERVICE', label: 'Serviço' },
                        { value: 'PRODUCT', label: 'Produto' },
                        { value: 'OTHER', label: 'Outros' }
                      ].map((cat) => (
                        <SelectItem 
                          key={cat.value} 
                          value={cat.value}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                      {/* Categorias customizadas */}
                      {categories.filter(cat => !['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'].includes(cat)).map((category) => (
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewCategoryModalOpen(true)}
                    className="border-gray-600 bg-white text-black hover:bg-gray-100 shrink-0"
                    title="Cadastrar nova categoria"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                {categories.length === 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Nenhuma categoria cadastrada.{' '}
                    <button 
                      type="button" 
                      className="text-seguranca-yellow underline hover:text-seguranca-yellow/80"
                      onClick={() => setNewCategoryModalOpen(true)}
                    >
                      Cadastrar categoria
                    </button>
                  </div>
                )}
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
                  <DollarSign size={14} />
                  Forma de Pagamento *
                </label>
                <Select
                  value={formData.paymentMethod || 'PIX'}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  required
                >
                  <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="PIX" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      PIX
                    </SelectItem>
                    <SelectItem value="BOLETO" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Boleto
                    </SelectItem>
                    <SelectItem value="TRANSFER" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Transferência
                    </SelectItem>
                    <SelectItem value="CASH" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Dinheiro
                    </SelectItem>
                    <SelectItem value="CARD" className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      Cartão
                    </SelectItem>
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
                  value={formData.centroCusto && formData.centroCusto !== 'NENHUM' ? formData.centroCusto : 'NENHUM'}
                  onValueChange={(value) => handleInputChange('centroCusto', value === 'NENHUM' ? undefined : value)}
                >
                  <SelectTrigger className="border-gray-600 bg-white text-black focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Selecione um centro de custo">
                      {formData.centroCusto && formData.centroCusto !== 'NENHUM' ? formData.centroCusto : 'Nenhum centro de custo'}
                    </SelectValue>
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
            <div className="grid grid-cols-1 gap-6">
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
                  className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
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

        {/* Modal de Nova Categoria */}
        <Dialog open={newCategoryModalOpen} onOpenChange={setNewCategoryModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-seguranca-graphite border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-seguranca-yellow">Nova Categoria</DialogTitle>
              <DialogDescription className="text-gray-300">
                Crie uma categoria para classificar a conta a receber
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nome da categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
                className="border-gray-600 bg-white text-black placeholder:text-gray-500 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewCategoryModalOpen(false);
                    setNewCategoryName('');
                  }}
                  className="border-gray-600 text-white hover:bg-seguranca-black"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  className="bg-seguranca-yellow hover:bg-seguranca-yellow/90 text-black"
                >
                  <Plus size={16} className="mr-2" />
                  Criar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};