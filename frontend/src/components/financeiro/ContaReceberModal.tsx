import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Upload } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { financialService, FinancialTransaction } from '@/services/financialService';
import { unitService, Unit } from '@/services/unitService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { clientService } from '@/services/clientService';

interface ContaReceberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: FinancialTransaction | null;
}

export const ContaReceberModal: React.FC<ContaReceberModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  initialData = null
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ name: '', email: '', phone: '' });
  const [categorias, setCategorias] = useState<string[]>([]);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataLancamento: new Date(),
    dataVencimento: null as Date | null,
    tipo: 'INCOME' as 'INCOME', // Sempre receita para contas a receber
    tipoReceita: 'SERVICO' as 'SERVICO' | 'PRODUTO' | 'CONSULTORIA' | 'MANUTENCAO',
    categoria: '',
    observacao: '',
    status: 'PENDENTE',
    unitId: '',
    clienteId: '',
    numeroFatura: '',
    numeroContrato: '',
    comprovanteUrl: '',
  });

  React.useEffect(() => {
    if (open) {
      unitService.getAllUnits().then(setUnits).catch(() => setUnits([]));
      clientService.getClients().then((res: any) => {
        const clientesData = Array.isArray(res) ? res : res?.content || [];
        setClientes(clientesData);
      }).catch(() => setClientes([]));
      
      // Carregar categorias específicas para receitas
      const categoriasReceita = ['Prestação de Serviços', 'Venda de Produtos', 'Consultoria', 'Manutenção', 'Vigilância', 'Segurança'];
      setCategorias(categoriasReceita);
    }
    if (!open) {
      setFormData({
        descricao: '', valor: '', dataLancamento: new Date(), dataVencimento: null,
        tipo: 'INCOME' as 'INCOME', tipoReceita: 'SERVICO' as 'SERVICO' | 'PRODUTO' | 'CONSULTORIA' | 'MANUTENCAO',
        categoria: '', observacao: '', status: 'PENDENTE', unitId: '', clienteId: '', numeroFatura: '', numeroContrato: '', comprovanteUrl: ''
      });
      setComprovanteFile(null);
      setNovaCategoria('');
      setShowNovaCategoria(false);
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
        tipo: 'INCOME' as 'INCOME',
        tipoReceita: 'SERVICO' as 'SERVICO' | 'PRODUTO' | 'CONSULTORIA' | 'MANUTENCAO',
        categoria: initialData.category || '',
        observacao: initialData.notes || '',
        status: statusStr === 'PENDING' ? 'PENDENTE' :
               statusStr === 'CONFIRMED' ? 'RECEBIDO' :
               statusStr === 'CANCELLED' ? 'CANCELADO' :
               (statusStr && typeof statusStr === 'string' ? statusStr.toUpperCase() : 'PENDENTE'),
        unitId: initialData.unitId ? String(initialData.unitId) : (initialData.unit?.id ? String(initialData.unit.id) : ''),
        clienteId: initialData.supplierId || '',
        numeroFatura: '',
        numeroContrato: '',
        comprovanteUrl: initialData.receiptUrl || '',
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

  const handleSalvarCliente = async () => {
    if (!novoCliente.name) {
      toast({ title: 'Atenção', description: 'Informe o nome do cliente.', variant: 'destructive' });
      return;
    }
    try {
      // Simular criação de cliente (implementar quando houver endpoint)
      const novoClienteData = { id: Date.now().toString(), name: novoCliente.name, ...novoCliente };
      setClientes(prev => [...prev, novoClienteData]);
      handleInputChange('clienteId', novoClienteData.id);
      toast({ title: 'Cliente adicionado', description: 'Cliente disponível para seleção.' });
      setShowNovoCliente(false);
      setNovoCliente({ name: '', email: '', phone: '' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Não foi possível adicionar o cliente.', variant: 'destructive' });
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
      const statusMap: Record<string, 'PENDING' | 'CONFIRMED' | 'CANCELLED'> = {
        'PENDENTE': 'PENDING',
        'RECEBIDO': 'CONFIRMED',
        'CANCELADO': 'CANCELLED'
      };
      
      const payload = {
        description: formData.descricao,
        amount: parseFloat(formData.valor),
        date: format(formData.dataLancamento, 'yyyy-MM-dd'),
        dueDate: formData.dataVencimento ? format(formData.dataVencimento, 'yyyy-MM-dd') : undefined,
        type: 'INCOME' as 'INCOME',
        category: formData.categoria,
        notes: formData.observacao,
        unitId: formData.unitId,
        status: statusMap[formData.status] || 'PENDING',
        supplierId: formData.clienteId || undefined,
        receiptUrl: formData.comprovanteUrl,
      };
      
      if (editMode && initialData) {
        await financialService.updateTransaction(initialData.id, formData.unitId, payload);
        toast({
          title: "Sucesso",
          description: "Conta a receber editada com sucesso!",
        });
      } else {
        await financialService.createTransaction(payload);
        toast({
          title: "Sucesso",
          description: "Conta a receber cadastrada com sucesso!",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar conta a receber:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta a receber. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] sm:w-[90vw] md:w-auto max-w-[620px] sm:max-w-[720px] md:max-w-[860px] p-3 md:p-5 bg-seguranca-graphite border-gray-600 overflow-y-auto max-h-[85vh] rounded-lg shadow-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <TrendingUp className="text-seguranca-green" size={20} />
            {editMode ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Linha 1 - Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Descrição *
            </label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da receita/serviço"
              className="form-input"
              rows={2}
              required
            />
          </div>

          {/* Linha 2 - Tipo e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">
                Tipo de Receita *
              </label>
              <Select 
                value={formData.tipoReceita} 
                onValueChange={(value) => handleInputChange('tipoReceita', value)}
              >
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICO">Prestação de Serviços</SelectItem>
                  <SelectItem value="PRODUTO">Venda de Produtos</SelectItem>
                  <SelectItem value="CONSULTORIA">Consultoria</SelectItem>
                  <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
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
                  <SelectValue placeholder="Pendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="RECEBIDO">Recebido</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
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

          {/* Linha 5 - Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Cliente *</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value === '__NONE__' ? '' : value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Sem cliente</SelectItem>
                    {clientes && Array.isArray(clientes) ? clientes
                      .filter(c => c && c.id && c.name)
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      )) : null}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowNovoCliente(true)} title="Cadastrar cliente" className="shrink-0">
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Linha 6 - Categoria e Números */}
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
                      <SelectValue placeholder="Ex: Prestação de Serviços" />
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
              <label className="text-sm font-medium text-seguranca-lightgray">Número da Fatura</label>
              <Input 
                value={formData.numeroFatura} 
                onChange={e => handleInputChange('numeroFatura', e.target.value)} 
                placeholder="Ex: NF-2025-001" 
                className="form-input" 
              />
            </div>
          </div>

          {/* Linha 7 - Contrato */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">Número do Contrato</label>
            <Input 
              value={formData.numeroContrato} 
              onChange={e => handleInputChange('numeroContrato', e.target.value)} 
              placeholder="Número do contrato relacionado" 
              className="form-input" 
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray">
              Observações
            </label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => handleInputChange('observacao', e.target.value)}
              placeholder="Observações sobre a conta a receber"
              className="form-input"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Upload de Comprovante */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
              Comprovante
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

        {/* Modal Novo Cliente */}
        {showNovoCliente && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-md">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Novo Cliente</h3>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm text-seguranca-lightgray">Nome *</label>
                  <Input 
                    value={novoCliente.name} 
                    onChange={(e) => setNovoCliente({ ...novoCliente, name: e.target.value })} 
                    placeholder="Nome do cliente" 
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Email</label>
                  <Input 
                    value={novoCliente.email} 
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })} 
                    placeholder="email@cliente.com" 
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="text-sm text-seguranca-lightgray">Telefone</label>
                  <Input 
                    value={novoCliente.phone} 
                    onChange={(e) => setNovoCliente({ ...novoCliente, phone: e.target.value })} 
                    placeholder="(00) 00000-0000" 
                    className="form-input" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowNovoCliente(false)}>Cancelar</Button>
                <Button onClick={handleSalvarCliente} className="bg-seguranca-red hover:bg-seguranca-darkred">Salvar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nova Categoria */}
        {showNovaCategoria && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 w-[95vw] max-w-md">
              <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">Nova Categoria</h3>
              <div>
                <label className="text-sm text-seguranca-lightgray">Nome da Categoria</label>
                <Input 
                  value={novaCategoria} 
                  onChange={(e) => setNovaCategoria(e.target.value)} 
                  placeholder="Ex: Prestação de Serviços" 
                  className="form-input" 
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowNovaCategoria(false)}>Cancelar</Button>
                <Button onClick={handleSalvarCategoria} className="bg-seguranca-red hover:bg-seguranca-darkred">Salvar</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
