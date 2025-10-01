import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Building,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { ordemServicoPDFGenerator } from '@/utils/ordemServicoPDFGenerator';
import { mockAPIData } from '@/utils/mockAPIData';

// Interfaces
interface Position {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  document: string;
  position?: Position;
  unit?: Unit;
}

interface Client {
  id: string;
  name: string;
  document: string;
}

interface Company {
  id: string;
  name: string;
  document: string;
}

interface Unit {
  id: string;
  name: string;
  code: string;
  client?: Client;
}

interface OrdemServico {
  id?: string;
  numero: string;
  funcionarioId: string;
  clienteId: string;
  empresaId: string;
  unidadeId: string;
  cargoId: string;
  modelo: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  status: 'ATIVA' | 'CONCLUIDA' | 'CANCELADA';
  createdAt?: string;
  updatedAt?: string;
}

// Mock data para demonstração
const mockPositions: Position[] = [
  { id: '1', name: 'Porteiro' },
  { id: '2', name: 'Vigia' },
  { id: '3', name: 'Auxiliar Administrativo' },
  { id: '4', name: 'ASG' },
  { id: '5', name: 'Recepcionista' },
];

const mockEmployees: Employee[] = [
  { id: '1', name: 'João Silva', document: '123.456.789-00', position: mockPositions[0], unit: { id: '1', name: 'Unidade Centro', code: 'UC001' } },
  { id: '2', name: 'Maria Santos', document: '987.654.321-00', position: mockPositions[1], unit: { id: '2', name: 'Unidade Norte', code: 'UN001' } },
  { id: '3', name: 'Pedro Costa', document: '456.789.123-00', position: mockPositions[2], unit: { id: '3', name: 'Unidade Sul', code: 'US001' } },
];

const mockClients: Client[] = [
  { id: '1', name: 'CSN - Companhia Siderúrgica Nacional', document: '33.592.510/0001-54' },
  { id: '2', name: 'ATERPA - Agência de Transporte do Estado do Pará', document: '05.859.397/0001-00' },
  { id: '3', name: 'TRANSPES - Transportadora Pesada Ltda', document: '12.345.678/0001-90' },
];

const mockCompanies: Company[] = [
  { id: '1', name: 'Promover Vigilância Patrimonial Ltda', document: '43.576.260/0001-12' },
  { id: '2', name: 'Segurança Total Ltda', document: '98.765.432/0001-10' },
];

const mockUnits: Unit[] = [
  { id: '1', name: 'Unidade Centro', code: 'UC001', client: mockClients[0] },
  { id: '2', name: 'Unidade Norte', code: 'UN001', client: mockClients[1] },
  { id: '3', name: 'Unidade Sul', code: 'US001', client: mockClients[2] },
];

const modelosOrdemServico = [
  { key: 'CSN', label: 'CSN - Companhia Siderúrgica Nacional' },
  { key: 'ATERPA', label: 'ATERPA - Agência de Transporte do Estado do Pará' },
  { key: 'TRANSPES', label: 'TRANSPES - Transportadora Pesada Ltda' },
  { key: 'ASG_ATERPA', label: 'ASG ATERPA' },
  { key: 'ASG_TRANSPES', label: 'ASG TRANSPES' },
];

const OrdemServicoForm = () => {
  // Estados principais
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);
  const [isEditing, setIsEditing] = useState(true); // Sempre permitir edição no modal de criação
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estados do formulário
  const [form, setForm] = useState<OrdemServico>({
    numero: `OS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    funcionarioId: '',
    clienteId: '',
    empresaId: '',
    unidadeId: '',
    cargoId: '',
    modelo: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias no futuro
    observacoes: '',
    status: 'ATIVA',
  });

  // Estados para busca dinâmica
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Estados de loading
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Carregar dados do banco de dados
  useEffect(() => {
    loadDataFromAPI();
  }, []);

  const loadDataFromAPI = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Carregar cargos
      try {
        const positionsResponse = await fetch('/api/positions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          setPositions(positionsData);
        } else {
          console.warn('Erro ao carregar cargos, usando dados mock');
          setPositions(mockAPIData.positions);
        }
      } catch (error) {
        console.warn('Erro ao carregar cargos, usando dados mock:', error);
        setPositions(mockAPIData.positions);
      }

      // Carregar funcionários
      try {
        const employeesResponse = await fetch('/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          setEmployees(employeesData);
        } else {
          console.warn('Erro ao carregar funcionários, usando dados mock');
          setEmployees(mockAPIData.employees);
        }
      } catch (error) {
        console.warn('Erro ao carregar funcionários, usando dados mock:', error);
        setEmployees(mockAPIData.employees);
      }

      // Carregar clientes
      try {
        const clientsResponse = await fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        } else {
          console.warn('Erro ao carregar clientes, usando dados mock');
          setClients(mockAPIData.clients);
        }
      } catch (error) {
        console.warn('Erro ao carregar clientes, usando dados mock:', error);
        setClients(mockAPIData.clients);
      }

      // Carregar empresas
      try {
        const companiesResponse = await fetch('/api/companies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData);
        } else {
          console.warn('Erro ao carregar empresas, usando dados mock');
          setCompanies(mockAPIData.companies);
        }
      } catch (error) {
        console.warn('Erro ao carregar empresas, usando dados mock:', error);
        setCompanies(mockAPIData.companies);
      }

      // Carregar unidades
      try {
        const unitsResponse = await fetch('/api/units', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (unitsResponse.ok) {
          const unitsData = await unitsResponse.json();
          setUnits(unitsData);
        } else {
          console.warn('Erro ao carregar unidades, usando dados mock');
          setUnits(mockAPIData.units);
        }
      } catch (error) {
        console.warn('Erro ao carregar unidades, usando dados mock:', error);
        setUnits(mockAPIData.units);
      }

    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      // Em caso de erro geral, usar todos os dados mock
      setPositions(mockAPIData.positions);
      setEmployees(mockAPIData.employees);
      setClients(mockAPIData.clients);
      setCompanies(mockAPIData.companies);
      setUnits(mockAPIData.units);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  // Funções CRUD
  const handleCreate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ordem-servico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const newOrdem = await response.json();
        setOrdensServico([...ordensServico, newOrdem]);
        resetForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrdem?.id) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ordem-servico/${selectedOrdem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        const updatedOrdem = await response.json();
        setOrdensServico(ordensServico.map(o => o.id === selectedOrdem.id ? updatedOrdem : o));
        resetForm();
        setIsDialogOpen(false);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ordem-servico/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setOrdensServico(ordensServico.filter(o => o.id !== id));
      }
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ordem: OrdemServico) => {
    setSelectedOrdem(ordem);
    setForm(ordem);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleView = (ordem: OrdemServico) => {
    setSelectedOrdem(ordem);
    setForm(ordem);
    setIsEditing(true); // Permitir edição mesmo na visualização
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      numero: `OS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      funcionarioId: '',
      clienteId: '',
      empresaId: '',
      unidadeId: '',
      cargoId: '',
      modelo: '',
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: '',
      status: 'ATIVA',
    });
    setSelectedOrdem(null);
    setIsEditing(true); // Sempre permitir edição
  };

  const handleGerarPDF = async (ordem: OrdemServico) => {
    try {
      const funcionario = Array.isArray(employees) ? employees.find(e => e.id === ordem.funcionarioId) : null;
      const cliente = Array.isArray(clients) ? clients.find(c => c.id === ordem.clienteId) : null;
      const empresa = Array.isArray(companies) ? companies.find(c => c.id === ordem.empresaId) : null;
      const unidade = Array.isArray(units) ? units.find(u => u.id === ordem.unidadeId) : null;
      const cargo = Array.isArray(positions) ? positions.find(p => p.id === ordem.cargoId) : null;

      if (!funcionario || !cliente || !empresa || !unidade || !cargo) {
        alert('Dados incompletos para gerar o PDF');
        return;
      }

      const pdfData = {
        ordem: {
          numero: ordem.numero,
          dataInicio: ordem.dataInicio,
          dataFim: ordem.dataFim,
          observacoes: ordem.observacoes,
          modelo: ordem.modelo,
          status: ordem.status,
        },
        funcionario: {
          name: funcionario.name,
          document: funcionario.document,
          position: funcionario.position,
          unit: funcionario.unit,
        },
        cliente: {
          name: cliente.name,
          document: cliente.document,
        },
        empresa: {
          name: empresa.name,
          document: empresa.document,
        },
        unidade: {
          name: unidade.name,
          code: unidade.code,
        },
        cargo: {
          name: cargo.name,
        },
      };

      await ordemServicoPDFGenerator.generatePDF(pdfData);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ATIVA': 'default',
      'CONCLUIDA': 'secondary',
      'CANCELADA': 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {loading && !dataLoaded && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!loading && dataLoaded && (
        <>
          {/* Lista de Ordens de Serviço */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ordens de Serviço Cadastradas</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Ordem de Serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-4xl max-h-[90vh] overflow-y-auto"
                    onPointerDownOutside={(e) => {
                      // Permitir fechar clicando fora do modal
                      if (!isEditing) {
                        setIsDialogOpen(false);
                      }
                    }}
                    onEscapeKeyDown={() => setIsDialogOpen(false)}
                  >
                    <DialogHeader>
                      <DialogTitle>
                        {isEditing ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        💡 Dica: Você pode fechar este modal clicando no X, pressionando ESC ou clicando fora da área do formulário
                      </p>
                    </DialogHeader>
                    
                    <div className="grid gap-4">
                      {/* Botão de fechar mais visível */}
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsDialogOpen(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Fechar
                        </Button>
                      </div>
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número da Ordem</Label>
                      <Input
                        id="numero"
                        value={form.numero}
                        onChange={(e) => setForm(prev => ({ ...prev, numero: e.target.value }))}
                        placeholder="Ex: OS-2024-001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Select 
                        value={form.modelo} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, modelo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {modelosOrdemServico.map(modelo => (
                            <SelectItem key={modelo.key} value={modelo.key}>
                              {modelo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seleção de Funcionário e Cargo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="funcionario">Funcionário</Label>
                      <Select 
                        value={form.funcionarioId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(employees) && employees.length > 0 ? employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} - {emp.position?.name || 'Sem cargo'}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-data" disabled>
                              Nenhum funcionário encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Select 
                        value={form.cargoId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, cargoId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(positions) && positions.length > 0 ? positions.map(pos => (
                            <SelectItem key={pos.id} value={pos.id}>
                              {pos.name}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-data" disabled>
                              Nenhum cargo encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seleção de Cliente, Empresa e Unidade */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cliente">Cliente</Label>
                      <Select 
                        value={form.clienteId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, clienteId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(clients) && clients.length > 0 ? clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-data" disabled>
                              Nenhum cliente encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa</Label>
                      <Select 
                        value={form.empresaId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, empresaId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(companies) && companies.length > 0 ? companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-data" disabled>
                              Nenhuma empresa encontrada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade</Label>
                      <Select 
                        value={form.unidadeId} 
                        onValueChange={(value) => setForm(prev => ({ ...prev, unidadeId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(units) && units.length > 0 ? units.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name} ({unit.code})
                            </SelectItem>
                          )) : (
                            <SelectItem value="no-data" disabled>
                              Nenhuma unidade encontrada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataInicio">Data de Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={form.dataInicio}
                        onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dataFim">Data de Fim</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={form.dataFim}
                        onChange={(e) => setForm(prev => ({ ...prev, dataFim: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={form.observacoes}
                      onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={selectedOrdem ? handleUpdate : handleCreate} disabled={loading} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? (selectedOrdem ? 'Salvando...' : 'Criando...') : (selectedOrdem ? 'Salvar Alterações' : 'Criar Ordem de Serviço')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
            </CardHeader>
            <CardContent>
              {ordensServico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ordem de serviço cadastrada</p>
              <p className="text-sm">Clique em "Nova Ordem de Serviço" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(ordensServico) && ordensServico.map((ordem) => {
                const funcionario = Array.isArray(employees) ? employees.find(e => e.id === ordem.funcionarioId) : null;
                const cliente = Array.isArray(clients) ? clients.find(c => c.id === ordem.clienteId) : null;
                const empresa = Array.isArray(companies) ? companies.find(c => c.id === ordem.empresaId) : null;
                const unidade = Array.isArray(units) ? units.find(u => u.id === ordem.unidadeId) : null;
                const cargo = Array.isArray(positions) ? positions.find(p => p.id === ordem.cargoId) : null;

                return (
                  <div key={ordem.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Ordem de Serviço {ordem.numero}</h3>
                        <p className="text-sm text-muted-foreground">
                          Modelo: {ordem.modelo} | Status: {getStatusBadge(ordem.status)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(ordem)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(ordem)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleGerarPDF(ordem)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a Ordem de Serviço {ordem.numero}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => ordem.id && handleDelete(ordem.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Funcionário</Label>
                        <p>{funcionario?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{cargo?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
                        <p>{cliente?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Empresa</Label>
                        <p>{empresa?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Unidade</Label>
                        <p>{unidade?.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{unidade?.code || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Período</Label>
                        <p>{ordem.dataInicio} até {ordem.dataFim}</p>
                      </div>
                    </div>
                    
                    {ordem.observacoes && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
                        <p className="text-sm">{ordem.observacoes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrdemServicoForm;
