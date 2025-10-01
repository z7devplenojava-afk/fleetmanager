import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Upload } from 'lucide-react';
import CurrencyInput from 'react-currency-input-field';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { financialService, FinancialTransaction } from '@/services/financialService';
import { unitService, Unit } from '@/services/unitService';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import api from '@/lib/axios';

interface TransacaoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: FinancialTransaction | null;
}

export const TransacaoFormModal: React.FC<TransacaoFormModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [showNovoFornecedor, setShowNovoFornecedor] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState<CreateSupplierRequest>({ name: '', cnpj: '' });
  const UFS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ] as const;
  const [savingFornecedor, setSavingFornecedor] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [centrosCusto, setCentrosCusto] = useState<string[]>([]);
  const [showNovoCentro, setShowNovoCentro] = useState(false);
  const [novoCentro, setNovoCentro] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataLancamento: new Date(),
    dataVencimento: null as Date | null,
    tipo: 'EXPENSE' as 'EXPENSE', // Sempre despesa para contas a pagar
    tipoDespesa: 'VARIAVEL' as 'FIXA' | 'VARIAVEL',
    categoria: '',
    referencia: '',
    observacao: '',
    status: 'PENDENTE',
    unitId: '',
    centroCusto: '',
    fornecedorId: '',
    codigoBarras: '',
    comprovanteUrl: '',
  });

  React.useEffect(() => {
    if (open) {
      unitService.getAllUnits().then(setUnits).catch(() => setUnits([]));
      contasAPagarService.getFornecedores().then(setFornecedores).catch(() => setFornecedores([]));
      // Carregar categorias a partir das transações existentes (lista única)
      financialService.getTransactions()
        .then((txs) => {
          const unique = Array.from(new Set((txs || []).map((t: any) => t.category).filter(Boolean)));
          setCategorias(unique);
        })
        .catch(() => setCategorias([]));
      // centros de custo via API (apenas ativos), com fallback
      costCenterService
        .list({ status: 'ACTIVE', size: 1000 })
        .then((page) => setCentrosCusto((page.content || []).map((cc: CostCenterDTO) => cc.name)))
        .catch(async () => {
          const txs = await financialService.getTransactions();
          const uniqueCC = Array.from(new Set((txs || []).map((t: any) => t.costCenter).filter(Boolean)));
          setCentrosCusto(uniqueCC);
        });
    }
    if (!open) {
      setFormData({
        descricao: '', valor: '', dataLancamento: new Date(), dataVencimento: null,
        tipo: 'EXPENSE' as 'EXPENSE', tipoDespesa: 'VARIAVEL' as 'FIXA' | 'VARIAVEL', categoria: '', referencia: '', observacao: '', status: 'PENDENTE', unitId: '', centroCusto: '', fornecedorId: '', codigoBarras: '', comprovanteUrl: ''
      });
      setComprovanteFile(null);
      setNovaCategoria('');
      setShowNovaCategoria(false);
      setNovoCentro('');
      setShowNovoCentro(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (open && editMode && initialData && units.length > 0) {
      const statusStr = typeof initialData.status === 'string' ? initialData.status : '';
      setFormData({
        descricao: initialData.description || '',
        valor: initialData.amount?.toString() || '',
        dataLancamento: initialData.date ? new Date(initialData.date) : new Date(),
        dataVencimento: initialData.dueDate ? new Date(initialData.dueDate) : null,
        tipo: (initialData.type === 'INCOME' || initialData.type === 'EXPENSE') ? initialData.type : '',
        categoria: initialData.category || '',
        referencia: initialData.reference || '',
        observacao: initialData.notes || '',
        status: statusStr === 'PENDING' ? 'PENDENTE' :
               statusStr === 'CONFIRMED' ? 'PAGO' :
               statusStr === 'CANCELLED' ? 'CANCELADO' :
               (statusStr && typeof statusStr === 'string' ? statusStr.toUpperCase() : 'PENDENTE'),
        unitId: initialData.unitId ? String(initialData.unitId) : (initialData.unit?.id ? String(initialData.unit.id) : ''),
      });
    }
  }, [open, editMode, initialData, units]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComprovanteFile(e.target.files[0]);
    }
  };

  const handleSalvarFornecedor = async () => {
    if (!novoFornecedor.name || !novoFornecedor.cnpj) {
      toast({ title: 'Atenção', description: 'Informe nome e CNPJ do fornecedor.', variant: 'destructive' });
      return;
    }
    try {
      setSavingFornecedor(true);
      const onlyDigits = (novoFornecedor.cnpj || '').replace(/\D/g, '');
      if (onlyDigits.length !== 14) {
        toast({ title: 'CNPJ inválido', description: 'O CNPJ deve conter 14 dígitos.', variant: 'destructive' });
        setSavingFornecedor(false);
        return;
      }
      // Validar UF
      const uf = (novoFornecedor.state || '').trim().toUpperCase();
      if (uf && !UFS.includes(uf as any)) {
        toast({ title: 'UF inválida', description: 'Selecione uma UF válida (ex.: MG, SP).', variant: 'destructive' });
        setSavingFornecedor(false);
        return;
      }
      const formattedCnpj = `${onlyDigits.substring(0,2)}.${onlyDigits.substring(2,5)}.${onlyDigits.substring(5,8)}/${onlyDigits.substring(8,12)}-${onlyDigits.substring(12,14)}`;
      const payload: CreateSupplierRequest = {
        ...novoFornecedor,
        cnpj: formattedCnpj,
        state: uf || undefined
      };
      let created: Supplier;
      try {
        created = await contasAPagarService.createFornecedor(payload);
      } catch (err: any) {
        const msg = err?.response?.data?.message || '';
        if (err?.response?.status === 409) {
          toast({ title: 'CNPJ duplicado', description: msg || 'Já existe um fornecedor com este CNPJ.', variant: 'destructive' });
        } else if (err?.response?.status === 400) {
          toast({ title: 'Dados inválidos', description: msg || 'Verifique os campos informados.', variant: 'destructive' });
        } else {
          toast({ title: 'Erro ao criar fornecedor', description: msg || 'Tente novamente.', variant: 'destructive' });
        }
        setSavingFornecedor(false);
        return;
      }
      const lista = await contasAPagarService.getFornecedores();
      setFornecedores(lista);
      handleInputChange('fornecedorId', created.id);
      toast({ title: 'Fornecedor criado', description: 'Fornecedor cadastrado com sucesso.' });
      setShowNovoFornecedor(false);
      setNovoFornecedor({ name: '', cnpj: '' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível criar o fornecedor.', variant: 'destructive' });
    } finally {
      setSavingFornecedor(false);
    }
  };

  const handleSalvarCategoria = () => {
    const nome = (novaCategoria || '').trim();
    if (!nome) {
      toast({ title: 'Atenção', description: 'Informe o nome da categoria.', variant: 'destructive' });
      return;
    }
    const novaLista = Array.from(new Set([nome, ...categorias]));
    setCategorias(novaLista);
    handleInputChange('categoria', nome);
    setShowNovaCategoria(false);
    setNovaCategoria('');
    toast({ title: 'Categoria adicionada', description: 'Categoria disponível para seleção.' });
  };

  const handleSalvarCentro = () => {
    const nome = (novoCentro || '').trim();
    if (!nome) {
      toast({ title: 'Atenção', description: 'Informe o nome do centro de custo.', variant: 'destructive' });
      return;
    }
    const novaLista = Array.from(new Set([nome, ...centrosCusto]));
    setCentrosCusto(novaLista);
    handleInputChange('centroCusto', nome);
    setShowNovoCentro(false);
    setNovoCentro('');
    toast({ title: 'Centro de custo adicionado', description: 'Centro de custo disponível para seleção.' });
  };

  const uploadComprovante = async (): Promise<string> => {
    if (!comprovanteFile) return '';
    const formData = new FormData();
    formData.append('file', comprovanteFile);
    const response = await api.post('/uploads/comprovantes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor || !formData.unitId || !formData.dataVencimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios: Descrição, Valor, Unidade e Data de Vencimento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let comprovanteUrl = formData.comprovanteUrl;
      if (comprovanteFile) {
        comprovanteUrl = await uploadComprovante();
      }
      const statusMap: Record<string, 'PENDING' | 'CONFIRMED' | 'CANCELLED'> = {
        pendente: 'PENDING',
        pago: 'CONFIRMED',
        recebido: 'CONFIRMED',
        vencido: 'PENDING',
        cancelado: 'CANCELLED'
      };
      const payload = {
        description: formData.descricao,
        amount: parseFloat(formData.valor),
        date: format(formData.dataLancamento, 'yyyy-MM-dd'),
        dueDate: formData.dataVencimento ? format(formData.dataVencimento, 'yyyy-MM-dd') : undefined,
        type: formData.tipo as 'INCOME' | 'EXPENSE',
        expenseType: formData.tipo === 'EXPENSE' ? formData.tipoDespesa : undefined,
        category: formData.categoria,
        notes: formData.observacao,
        unitId: formData.unitId,
        status: statusMap[formData.status] || 'PENDING',
        costCenter: formData.centroCusto,
        supplierId: formData.tipo === 'EXPENSE' && formData.fornecedorId ? formData.fornecedorId : undefined,
        barcode: formData.codigoBarras,
        receiptUrl: comprovanteUrl,
      };
      if (editMode && initialData) {
        await financialService.updateTransaction(initialData.id, formData.unitId, payload);
        toast({
          title: "Sucesso",
          description: "Transação editada com sucesso!",
        });
      } else {
        await financialService.createTransaction(payload);
        toast({
          title: "Sucesso",
          description: "Transação cadastrada com sucesso!",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar transação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] sm:w-[90vw] md:w-auto max-w-[620px] sm:max-w-[720px] md:max-w-[860px] lg:max-w-[980px] xl:max-w-[1080px] p-3 md:p-5 bg-seguranca-graphite border-gray-600 overflow-y-auto max-h-[85vh] rounded-lg shadow-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <DollarSign className="text-seguranca-red" size={20} />
            {editMode ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Linha 1 - Descrição (largura total) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Descrição *
            </label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da despesa"
              className="form-input"
              rows={2}
              required
            />
          </div>

          {/* Linha 2 - Tipo e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Tipo *
              </label>
              <Select 
                value={formData.tipoDespesa} 
                onValueChange={(value) => {
                  handleInputChange('tipoDespesa', value);
                  handleInputChange('tipo', 'EXPENSE'); // Sempre despesa para contas a pagar
                }}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Despesa Variável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VARIAVEL">Despesa Variável</SelectItem>
                  <SelectItem value="FIXA">Despesa Fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  placeholder="0,00"
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Linha 3 - Status e Unidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Status
              </label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Aberta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Aberta</SelectItem>
                  <SelectItem value="PAGO">Paga</SelectItem>
                  <SelectItem value="VENCIDO">Vencida</SelectItem>
                  <SelectItem value="CANCELADO">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Unidade *
              </label>
              <Select value={formData.unitId} onValueChange={(value) => handleInputChange('unitId', value)}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={String(unit.id)}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 4 - Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data de Vencimento *</label>
              <DatePicker
                selected={formData.dataVencimento}
                onChange={(date: Date) => handleInputChange('dataVencimento', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data do Lançamento *</label>
              <DatePicker
                selected={formData.dataLancamento}
                onChange={(date: Date) => handleInputChange('dataLancamento', date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="form-input w-full"
                placeholderText="dd/mm/aaaa"
                required
              />
            </div>
          </div>

          {/* Linha 5 - Fornecedor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Fornecedor *</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={formData.fornecedorId} onValueChange={(value) => handleInputChange('fornecedorId', value === '__NONE__' ? '' : value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Sem fornecedor</SelectItem>
                    {fornecedores.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowNovoFornecedor(true)} title="Cadastrar fornecedor" className="shrink-0">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Linha 6 - Categoria e Centro de Custo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Categoria</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.categoria || ''}
                    onValueChange={(value) => handleInputChange('categoria', value === '__NONE__' ? '' : value)}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="Ex: Manutenção, Material, Serviços" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Sem categoria</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" onClick={() => setShowNovaCategoria(true)} title="Cadastrar categoria" className="shrink-0">
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Centro de Custo</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.centroCusto || ''}
                    onValueChange={(value) => handleInputChange('centroCusto', value === '__NONE_CC__' ? '' : value)}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="Ex: Operacional, Administrativo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE_CC__">Sem centro de custo</SelectItem>
                      {centrosCusto.map((cc) => (
                        <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" onClick={() => setShowNovoCentro(true)} title="Cadastrar centro de custo" className="shrink-0">
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Linha 7 - Código de Barras */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Código de Barras</label>
            <Input 
              value={formData.codigoBarras} 
              onChange={e => handleInputChange('codigoBarras', e.target.value)} 
              placeholder="Código de barras do boleto" 
              className="form-input" 
            />
          </div>

          {/* Observações - Largura total */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Observações
            </label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => handleInputChange('observacao', e.target.value)}
              placeholder="Observações sobre a transação"
              className="form-input"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Upload de Comprovante - Largura total */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">Comprovante
              <Upload size={16} />
            </label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="form-input" />
            {comprovanteFile && <span className="text-xs text-gray-400">{comprovanteFile.name}</span>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-600">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading || !formData.descricao || !formData.valor || !formData.unitId || !formData.dataVencimento}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Salvando...' : (editMode ? 'Salvar Alterações' : 'Salvar Conta')}
            </Button>
          </div>
        </form>
        {showNovoFornecedor && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-md">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Novo fornecedor</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm text-seguranca-lightgray">Nome</label>
                  <Input value={novoFornecedor.name} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, name: e.target.value })} placeholder="Nome do fornecedor" className="form-input" />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">CNPJ</label>
                  <Input value={novoFornecedor.cnpj} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, cnpj: e.target.value })} placeholder="00.000.000/0000-00" className="form-input" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-seguranca-lightgray">Email</label>
                    <Input value={novoFornecedor.email || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, email: e.target.value })} placeholder="email@fornecedor.com" className="form-input" />
                  </div>
                  <div>
                    <label className="text-sm text-seguranca-lightgray">Telefone</label>
                    <Input value={novoFornecedor.phone || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, phone: e.target.value })} placeholder="(00) 00000-0000" className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Endereço</label>
                  <Input value={novoFornecedor.address || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, address: e.target.value })} placeholder="Rua, número, complemento" className="form-input" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-seguranca-lightgray">Cidade</label>
                    <Input value={novoFornecedor.city || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, city: e.target.value })} placeholder="Cidade" className="form-input" />
                  </div>
                  <div>
                    <label className="text-sm text-seguranca-lightgray">UF</label>
                    <select value={(novoFornecedor.state || '').toUpperCase()} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, state: e.target.value })} className="form-input">
                      <option value="">Selecione</option>
                      {UFS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-seguranca-lightgray">CEP</label>
                    <Input value={novoFornecedor.zipCode || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, zipCode: e.target.value })} placeholder="00000-000" className="form-input" />
                  </div>
                  <div>
                    <label className="text-sm text-seguranca-lightgray">Categoria</label>
                    <Input value={novoFornecedor.category || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, category: e.target.value })} placeholder="Categoria" className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Observações</label>
                  <Textarea value={novoFornecedor.notes || ''} onChange={(e) => setNovoFornecedor({ ...novoFornecedor, notes: e.target.value })} rows={3} className="form-input" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNovoFornecedor(false)} disabled={savingFornecedor}>Cancelar</Button>
                <Button onClick={handleSalvarFornecedor} disabled={savingFornecedor} className="bg-seguranca-red hover:bg-seguranca-darkred">{savingFornecedor ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </div>
          </div>
        )}
        {showNovaCategoria && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-md">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Nova categoria</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm text-seguranca-lightgray">Nome</label>
                  <Input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} placeholder="Ex.: Manutenção, Materiais" className="form-input" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNovaCategoria(false)}>Cancelar</Button>
                <Button onClick={handleSalvarCategoria} className="bg-seguranca-red hover:bg-seguranca-darkred">Salvar</Button>
              </div>
            </div>
          </div>
        )}
        {showNovoCentro && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-md">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Novo centro de custo</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm text-seguranca-lightgray">Nome</label>
                  <Input value={novoCentro} onChange={(e) => setNovoCentro(e.target.value)} placeholder="Ex.: Administrativo, Operacional" className="form-input" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNovoCentro(false)}>Cancelar</Button>
                <Button onClick={handleSalvarCentro} className="bg-seguranca-red hover:bg-seguranca-darkred">Salvar</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
