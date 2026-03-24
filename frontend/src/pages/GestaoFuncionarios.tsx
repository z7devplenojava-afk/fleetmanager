import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Users, UserPlus, UserMinus, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { employeeService } from '@/services/employeeService';
import { unitService } from '@/services/unitService';
import { positionService } from '@/services/positionService';
import { MaritalStatus, EmployeeStatus } from '@/types/hr';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const maritalStatusOptions = [
  { value: 'SINGLE', label: 'Solteiro(a)' },
  { value: 'MARRIED', label: 'Casado(a)' },
  { value: 'DIVORCED', label: 'Divorciado(a)' },
  { value: 'WIDOWED', label: 'Viúvo(a)' },
];
const statusOptions = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'VACATION', label: 'Férias' },
  { value: 'MATERNITY_LEAVE', label: 'Licença Maternidade' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Atestado' },
  { value: 'TERMINATED', label: 'Demitido' },
  { value: 'SUSPENDED', label: 'Suspenso' },
];

const GestaoFuncionarios: React.FC = () => {
  const [cadastroModalOpen, setCadastroModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    birthDate: '',
    maritalStatus: 'SINGLE',
    nationality: '',
    registrationNumber: '',
    address: '',
    unitId: '',
    positionId: '',
    status: 'ACTIVE',
    hireDate: '',
  });
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    registrationNumber: '',
    positionId: '',
    positionDescription: '',
    unitId: '',
    status: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (cadastroModalOpen) {
      unitService.getAllUnits().then(setUnits);
      positionService.getPositions().then(setPositions);
    }
  }, [cadastroModalOpen]);

  useEffect(() => {
    console.log('[GestaoFuncionarios] Carregando funcionários, filtros:', filters);
    console.log('[GestaoFuncionarios] employeeService disponível:', !!employeeService);
    console.log('[GestaoFuncionarios] Métodos disponíveis:', Object.keys(employeeService));
    
    const params: any = {};
    if (filters.registrationNumber) params.registrationNumber = filters.registrationNumber;
    if (filters.positionId) params.positionId = filters.positionId;
    if (filters.positionDescription) params.positionDescription = filters.positionDescription;
    if (filters.unitId) params.unitId = filters.unitId;
    if (filters.status) params.status = filters.status;
    
    // Se não há filtros, buscar todos os funcionários
    if (Object.keys(params).length === 0) {
      console.log('[GestaoFuncionarios] Buscando todos os funcionários (sem filtros)');
      employeeService.getAllEmployees().then(setEmployees).catch(err => {
        console.error('[GestaoFuncionarios] Erro ao buscar todos os funcionários:', err);
        setEmployees([]);
      });
    } else {
      console.log('[GestaoFuncionarios] Buscando funcionários com filtros:', params);
      console.log('[GestaoFuncionarios] Método getEmployees disponível:', typeof employeeService.getEmployees);
      // Verificar se o método existe antes de chamar
      if (typeof employeeService.getEmployees === 'function') {
        employeeService.getEmployees(params).then(setEmployees).catch(err => {
          console.error('[GestaoFuncionarios] Erro ao buscar funcionários com filtros:', err);
          setEmployees([]);
        });
      } else {
        console.warn('[GestaoFuncionarios] Método getEmployees não encontrado, usando getAllEmployees');
        employeeService.getAllEmployees().then(setEmployees).catch(err => {
          console.error('[GestaoFuncionarios] Erro ao buscar funcionários:', err);
          setEmployees([]);
        });
      }
    }
  }, [filters, cadastroModalOpen]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await employeeService.createEmployee({
        name: form.name,
        cpf: form.cpf,
        rg: form.rg,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate,
        maritalStatus: form.maritalStatus as MaritalStatus,
        nationality: form.nationality,
        registrationNumber: form.registrationNumber,
        address: form.address,
        hireDate: form.hireDate,
        status: form.status as EmployeeStatus,
        position: { id: form.positionId },
        unit: form.unitId ? { id: form.unitId } : undefined,
      });
      toast({ title: 'Sucesso', description: 'Funcionário cadastrado com sucesso!' });
      setCadastroModalOpen(false);
      setForm({ name: '', cpf: '', rg: '', email: '', phone: '', birthDate: '', maritalStatus: 'SINGLE', nationality: '', registrationNumber: '', address: '', unitId: '', positionId: '', status: 'ACTIVE', hireDate: '' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao cadastrar funcionário.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (employee: any) => {
    toast({ title: 'Visualizar', description: `Visualizar dados de ${employee.name}` });
  };

  const handleEdit = (employee: any) => {
    toast({ title: 'Editar', description: `Editar dados de ${employee.name}` });
  };

  const handleDelete = async (employee: any) => {
    if (window.confirm(`Deseja realmente excluir ${employee.name}?`)) {
      await employeeService.deleteEmployee(employee.id);
      setEmployees(employees.filter((e: any) => e.id !== employee.id));
      toast({ title: 'Excluído', description: 'Funcionário excluído com sucesso.' });
    }
  };

  const handlePrint = (employee: any) => {
    toast({ title: 'Imprimir PDF', description: `Imprimir dados de ${employee.name}` });
  };

  return (
    <StandardLayout
      title="Gestão de Funcionários"
      subtitle="Dashboard completo para cadastro, admissão, demissão e gestão da vida funcional"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mb-8">
        <div
          className="bg-seguranca-graphite rounded-xl p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700"
          onClick={() => setCadastroModalOpen(true)}
          tabIndex={0}
          role="button"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setCadastroModalOpen(true); }}
          aria-label="Abrir modal de cadastro de funcionário"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-seguranca-yellow" size={28} />
            <span className="text-lg font-bold text-seguranca-lightgray">Cadastro</span>
          </div>
          <span className="text-seguranca-lightgray text-sm">Cadastrar novo funcionário no sistema</span>
        </div>
        <div
          className="bg-seguranca-graphite rounded-xl p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700"
          onClick={() => navigate('/rh/admissao-funcionarios')}
          tabIndex={0}
          role="button"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/rh/admissao-funcionarios'); }}
          aria-label="Ir para admissão de funcionários"
        >
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="text-green-400" size={28} />
            <span className="text-lg font-bold text-seguranca-lightgray">Admissão</span>
          </div>
          <span className="text-seguranca-lightgray text-sm">Processo de admissão de novos colaboradores</span>
        </div>
        <div className="bg-seguranca-graphite rounded-xl p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <UserMinus className="text-red-400" size={28} />
            <span className="text-lg font-bold text-seguranca-lightgray">Demissão</span>
          </div>
          <span className="text-seguranca-lightgray text-sm">Gestão de desligamentos e rescisões</span>
        </div>
        <div className="bg-seguranca-graphite rounded-xl p-6 flex flex-col gap-2 shadow hover:shadow-lg transition cursor-pointer border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-blue-400" size={28} />
            <span className="text-lg font-bold text-seguranca-lightgray">Vida Funcional</span>
          </div>
          <span className="text-seguranca-lightgray text-sm">Histórico completo e documentos do colaborador</span>
        </div>
      </div>
      {/* Espaço para integrações futuras, gráficos, relatórios, etc. */}
      <Dialog open={cadastroModalOpen} onOpenChange={setCadastroModalOpen}>
        <DialogContent className="w-full max-w-[98vw] md:max-w-2xl lg:max-w-3xl bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Cadastro de Novo Funcionário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input className="col-span-1 md:col-span-2 lg:col-span-3" placeholder="Nome completo" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
            <Input className="col-span-1" placeholder="CPF" value={form.cpf} onChange={e => handleChange('cpf', e.target.value)} required />
            <Input className="col-span-1" placeholder="RG" value={form.rg} onChange={e => handleChange('rg', e.target.value)} required />
            <Input className="col-span-1" placeholder="E-mail" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
            <Input className="col-span-1" placeholder="Telefone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required />
            <Input className="col-span-1" type="date" placeholder="Data de nascimento" value={form.birthDate} onChange={e => handleChange('birthDate', e.target.value)} required />
            <Select value={form.maritalStatus} onValueChange={v => handleChange('maritalStatus', v)}>
              <SelectTrigger><SelectValue placeholder="Estado civil" /></SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="col-span-1" placeholder="Nacionalidade" value={form.nationality} onChange={e => handleChange('nationality', e.target.value)} required />
            <Input className="col-span-1" placeholder="Matrícula/Registro" value={form.registrationNumber} onChange={e => handleChange('registrationNumber', e.target.value)} required />
            <Input className="col-span-1 md:col-span-2 lg:col-span-3" placeholder="Endereço" value={form.address} onChange={e => handleChange('address', e.target.value)} required />
            <Select value={form.unitId} onValueChange={v => handleChange('unitId', v)}>
              <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.positionId} onValueChange={v => handleChange('positionId', v)}>
              <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
              <SelectContent>
                {positions.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={v => handleChange('status', v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="col-span-1" type="date" placeholder="Data de admissão" value={form.hireDate} onChange={e => handleChange('hireDate', e.target.value)} required />
            <Button type="submit" className="w-full col-span-1 md:col-span-2 lg:col-span-3 bg-seguranca-yellow text-black" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Filtros de Funcionários */}
      <div className="mb-6 bg-seguranca-graphite rounded-xl p-4 shadow border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            placeholder="Matrícula"
            value={filters.registrationNumber}
            onChange={e => setFilters(f => ({ ...f, registrationNumber: e.target.value }))}
            className="col-span-1"
          />
          <Select value={filters.positionId || 'all'} onValueChange={v => setFilters(f => ({ ...f, positionId: v === 'all' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Cargo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {positions.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            placeholder="Posto de Trabalho"
            value={filters.positionDescription}
            onChange={e => setFilters(f => ({ ...f, positionDescription: e.target.value }))}
            className="col-span-1"
          />
          <Select value={filters.unitId || 'all'} onValueChange={v => setFilters(f => ({ ...f, unitId: v === 'all' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status || 'all'} onValueChange={v => setFilters(f => ({ ...f, status: v === 'all' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Tabela de Funcionários */}
      <div className="mt-8 bg-seguranca-graphite rounded-xl p-4 shadow border border-gray-700 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-seguranca-yellow text-xs uppercase">
              <th className="px-4 py-2">Nome do Funcionário</th>
              <th className="px-4 py-2">Matrícula</th>
              <th className="px-4 py-2">Cargo</th>
              <th className="px-4 py-2">Posto de Trabalho</th>
              <th className="px-4 py-2">Unidade</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter(emp =>
              (!filters.registrationNumber || (emp.registrationNumber || '').toLowerCase().includes(filters.registrationNumber.toLowerCase())) &&
              (!filters.positionId || emp.position?.id === filters.positionId) &&
              (!filters.positionDescription || (emp.position?.description || '').toLowerCase().includes(filters.positionDescription.toLowerCase())) &&
              (!filters.unitId || emp.unit?.id === filters.unitId) &&
              (!filters.status || emp.status === filters.status)
            ).length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-seguranca-lightgray py-8">Nenhum funcionário cadastrado.</td>
              </tr>
            ) : (
              employees.filter(emp =>
                (!filters.registrationNumber || (emp.registrationNumber || '').toLowerCase().includes(filters.registrationNumber.toLowerCase())) &&
                (!filters.positionId || emp.position?.id === filters.positionId) &&
                (!filters.positionDescription || (emp.position?.description || '').toLowerCase().includes(filters.positionDescription.toLowerCase())) &&
                (!filters.unitId || emp.unit?.id === filters.unitId) &&
                (!filters.status || emp.status === filters.status)
              ).map((emp: any) => (
                <tr key={emp.id} className="border-b border-gray-700 hover:bg-seguranca-black transition">
                  <td className="px-4 py-2 text-seguranca-lightgray font-medium">{emp.name}</td>
                  <td className="px-4 py-2 text-seguranca-lightgray">{emp.registrationNumber || '-'}</td>
                  <td className="px-4 py-2 text-seguranca-lightgray">{emp.position?.name || '-'}</td>
                  <td className="px-4 py-2 text-seguranca-lightgray">{emp.position?.description || '-'}</td>
                  <td className="px-4 py-2 text-seguranca-lightgray">{emp.unit?.name || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-gray-800 text-seguranca-yellow">{emp.status}</span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => handleView(emp)} className="p-1 rounded hover:bg-gray-800" title="Visualizar"><Eye size={18} /></button>
                    <button onClick={() => handleEdit(emp)} className="p-1 rounded hover:bg-gray-800" title="Editar"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(emp)} className="p-1 rounded hover:bg-gray-800 text-red-400" title="Excluir"><Trash2 size={18} /></button>
                    <button onClick={() => handlePrint(emp)} className="p-1 rounded hover:bg-gray-800 text-blue-400" title="Imprimir PDF"><FileText size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StandardLayout>
  );
};

export default GestaoFuncionarios; 