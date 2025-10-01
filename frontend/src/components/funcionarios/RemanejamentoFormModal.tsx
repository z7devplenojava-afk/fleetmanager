import React, { useState, useEffect } from 'react';
import { createRemanejamento, Remanejamento } from '../../services/remanejamentoService';
import { unitService, Unit } from '../../services/unitService';
import { employeeService, Employee } from '../../services/employeeService';
import { workPostService, WorkPost } from '../../services/workPostService';
import type { RemanejamentoTipo } from '../../types/remanejamento';
import { X } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  initialRemanejamento?: Remanejamento;
}

interface FormData {
  employeeId: string;
  tipo: string;
  origem: string;
  destino: string;
  dataRemanejamento: string;
  observacao?: string;
  sourceWorkPostId?: string;
  destinationWorkPostId?: string;
  notifyRH?: boolean;
  notifyOperacional?: boolean;
  notifyDepartamentoPessoal?: boolean;
}

const tipos: { value: RemanejamentoTipo; label: string }[] = [
  { value: 'TRANSFERENCIA_UNIDADE', label: 'Transferência de Unidade' },
  { value: 'TRANSFERENCIA_POSTO_TRABALHO', label: 'Transferência de Posto Trabalho' },
  { value: 'TROCA_FUNCAO', label: 'Troca de Função' },
  { value: 'PROMOCAO', label: 'Promoção' },
  { value: 'COBRIR_FERIAS', label: 'Cobrir Férias' },
  { value: 'COBRIR_FALTA', label: 'Cobrir Falta' },
  { value: 'PLANTAO', label: 'Plantão' },
  { value: 'OUTROS', label: 'Outros' },
];

const RemanejamentoFormModal: React.FC<Props> = ({ onSuccess, onClose, initialRemanejamento }) => {
  const [form, setForm] = useState<FormData>({
    employeeId: initialRemanejamento?.employeeId || '',
    tipo: initialRemanejamento?.status || '',
    origem: '',
    destino: '',
    dataRemanejamento: initialRemanejamento?.remanejamentoDate || '',
    observacao: initialRemanejamento?.notes || '',
    sourceWorkPostId: '',
    destinationWorkPostId: '',
    notifyRH: true, // Por padrão, RH sempre é notificado
    notifyOperacional: false,
    notifyDepartamentoPessoal: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);

  // Carregar postos de trabalho
  const loadWorkPosts = async () => {
    setLoadingWorkPosts(true);
    try {
      const data = await workPostService.getWorkPosts();
      setWorkPosts(data);
    } catch (error) {
      console.warn('Erro ao carregar postos de trabalho, usando dados estáticos:', error);
      // Dados estáticos como fallback
      setWorkPosts([
        { id: '1', postCode: 'P001', name: 'Portaria Principal', address: 'Entrada Principal', type: 'POSTO_24H', status: 'ATIVO', clientId: '1', requiredVigilantes: 2, workSchedule: '24h', shiftStart: '00:00', shiftEnd: '23:59' },
        { id: '2', postCode: 'P002', name: 'Ronda Perimetral', address: 'Área Externa', type: 'POSTO_12H_DIURNO', status: 'ATIVO', clientId: '1', requiredVigilantes: 1, workSchedule: '12h', shiftStart: '06:00', shiftEnd: '18:00' },
        { id: '3', postCode: 'P003', name: 'Central de Monitoramento', address: 'Sala de Controle', type: 'POSTO_24H', status: 'ATIVO', clientId: '1', requiredVigilantes: 1, workSchedule: '24h', shiftStart: '00:00', shiftEnd: '23:59' },
        { id: '4', postCode: 'P004', name: 'Acesso Veicular', address: 'Garagem', type: 'POSTO_8H', status: 'ATIVO', clientId: '1', requiredVigilantes: 1, workSchedule: '8h', shiftStart: '08:00', shiftEnd: '16:00' },
        { id: '5', postCode: 'P005', name: 'Recepção', address: 'Hall Principal', type: 'POSTO_8H', status: 'ATIVO', clientId: '1', requiredVigilantes: 1, workSchedule: '8h', shiftStart: '08:00', shiftEnd: '18:00' }
      ] as WorkPost[]);
    } finally {
      setLoadingWorkPosts(false);
    }
  };

  // Carregar funcionários
  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await employeeService.getEmployees({ status: 'ACTIVE' });
      setEmployees(data);
    } catch (error) {
      console.warn('Erro ao carregar funcionários, usando dados estáticos:', error);
      // Dados estáticos como fallback
      setEmployees([
        { id: '1', name: 'João Silva', cpf: '123.456.789-00', rg: '12.345.678-9', email: 'joao.silva@empresa.com', phone: '(11) 99999-9999', address: 'Rua das Flores, 123', birthDate: '1985-03-15', maritalStatus: 'CASADO', nationality: 'Brasileira', registrationNumber: 'EMP001', hireDate: '2020-01-15', status: 'ACTIVE', position: { id: '1', name: 'Vigilante' }, createdAt: '2020-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
        { id: '2', name: 'Maria Santos', cpf: '987.654.321-00', rg: '98.765.432-1', email: 'maria.santos@empresa.com', phone: '(11) 88888-8888', address: 'Av. Paulista, 456', birthDate: '1990-07-22', maritalStatus: 'SOLTEIRO', nationality: 'Brasileira', registrationNumber: 'EMP002', hireDate: '2021-03-10', status: 'ACTIVE', position: { id: '2', name: 'Supervisor' }, createdAt: '2021-03-10T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
        { id: '3', name: 'Carlos Oliveira', cpf: '456.789.123-00', rg: '45.678.912-3', email: 'carlos.oliveira@empresa.com', phone: '(11) 77777-7777', address: 'Rua Central, 789', birthDate: '1988-12-05', maritalStatus: 'CASADO', nationality: 'Brasileira', registrationNumber: 'EMP003', hireDate: '2019-06-20', status: 'ACTIVE', position: { id: '1', name: 'Vigilante' }, createdAt: '2019-06-20T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
        { id: '4', name: 'Ana Costa', cpf: '789.123.456-00', rg: '78.912.345-6', email: 'ana.costa@empresa.com', phone: '(11) 66666-6666', address: 'Av. Norte, 321', birthDate: '1992-04-18', maritalStatus: 'SOLTEIRO', nationality: 'Brasileira', registrationNumber: 'EMP004', hireDate: '2022-02-10', status: 'ACTIVE', position: { id: '3', name: 'Porteiro' }, createdAt: '2022-02-10T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' }
      ]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Carregar unidades
  const loadUnits = async () => {
    setLoadingUnits(true);
    try {
      const data = await unitService.getAllUnits();
      setUnits(data);
    } catch (error) {
      console.warn('Erro ao carregar unidades, usando dados estáticos:', error);
      // Dados estáticos como fallback
      setUnits([
        { id: '1', name: 'Unidade Central', address: 'Av. Principal, 123', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '2', name: 'Unidade Norte', address: 'Rua Norte, 456', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '3', name: 'Unidade Sul', address: 'Rua Sul, 789', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '4', name: 'Unidade Leste', address: 'Av. Leste, 321', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: '5', name: 'Unidade Oeste', address: 'Rua Oeste, 654', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
      ]);
    } finally {
      setLoadingUnits(false);
    }
  };

  // Carregar unidades, funcionários e postos de trabalho ao montar o componente
  useEffect(() => {
    loadUnits();
    loadEmployees();
    loadWorkPosts();
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!form.employeeId) throw new Error('Selecione o funcionário');
      
      // Converter para CreateRemanejamentoDTO
      const remanejamentoData = {
        employeeId: form.employeeId,
        originWorkstationId: form.origem,
        destinationWorkstationId: form.destino,
        remanejamentoDate: form.dataRemanejamento,
        notes: form.observacao
      };
      
      await createRemanejamento(remanejamentoData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar remanejamento');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-seguranca-black border border-seguranca-graphite rounded-lg w-full max-w-sm sm:max-w-md lg:max-w-2xl xl:max-w-3xl relative max-h-[90vh] overflow-y-auto">
        {/* Header com título e botão X */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-seguranca-graphite sticky top-0 bg-seguranca-black z-10">
          <h2 className="text-base sm:text-lg font-bold text-seguranca-yellow">
            {initialRemanejamento ? 'Editar Remanejamento' : 'Novo Remanejamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-seguranca-lightgray hover:text-seguranca-yellow transition-colors p-1"
            type="button"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {/* Primeira linha - 3 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Nome do funcionário</label>
                <select 
                  name="employeeId" 
                  value={form.employeeId} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                  disabled={loadingEmployees}
                >
                  <option value="">
                    {loadingEmployees ? 'Carregando funcionários...' : 'Selecione o funcionário'}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Tipo de Remanejamento</label>
                <select 
                  name="tipo" 
                  value={form.tipo} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                >
                  <option value="">Selecione o tipo...</option>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Data do Remanejamento</label>
                <input 
                  type="date" 
                  name="dataRemanejamento" 
                  value={form.dataRemanejamento} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required 
                />
              </div>
            </div>

            {/* Segunda linha - 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Unidade de Origem</label>
                <select 
                  name="origem" 
                  value={form.origem} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                  disabled={loadingUnits}
                >
                  <option value="">
                    {loadingUnits ? 'Carregando unidades...' : 'Selecione a unidade de origem'}
                  </option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Unidade de Destino</label>
                <select 
                  name="destino" 
                  value={form.destino} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                  disabled={loadingUnits}
                >
                  <option value="">
                    {loadingUnits ? 'Carregando unidades...' : 'Selecione a unidade de destino'}
                  </option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terceira linha - Postos de Trabalho - 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Posto de Trabalho de Origem</label>
                <select 
                  name="sourceWorkPostId" 
                  value={form.sourceWorkPostId || ''} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  disabled={loadingWorkPosts}
                >
                  <option value="">
                    {loadingWorkPosts ? 'Carregando postos...' : 'Selecione o posto de origem'}
                  </option>
                  {workPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.postCode} - {post.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Posto de Trabalho de Destino</label>
                <select 
                  name="destinationWorkPostId" 
                  value={form.destinationWorkPostId || ''} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  disabled={loadingWorkPosts}
                >
                  <option value="">
                    {loadingWorkPosts ? 'Carregando postos...' : 'Selecione o posto de destino'}
                  </option>
                  {workPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.postCode} - {post.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quarta linha - Notificações */}
            <div>
              <label className="block text-seguranca-lightgray mb-2 text-sm font-medium">Notificar Remanejamento</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-seguranca-graphite p-3 rounded border border-gray-600">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyRH"
                    name="notifyRH"
                    checked={form.notifyRH || false}
                    onChange={(e) => setForm(prev => ({ ...prev, notifyRH: e.target.checked }))}
                    className="w-4 h-4 text-seguranca-yellow bg-seguranca-black border-gray-600 rounded focus:ring-seguranca-yellow focus:ring-2"
                  />
                  <label htmlFor="notifyRH" className="text-sm text-seguranca-lightgray cursor-pointer">
                    Recursos Humanos
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyOperacional"
                    name="notifyOperacional"
                    checked={form.notifyOperacional || false}
                    onChange={(e) => setForm(prev => ({ ...prev, notifyOperacional: e.target.checked }))}
                    className="w-4 h-4 text-seguranca-yellow bg-seguranca-black border-gray-600 rounded focus:ring-seguranca-yellow focus:ring-2"
                  />
                  <label htmlFor="notifyOperacional" className="text-sm text-seguranca-lightgray cursor-pointer">
                    Operacional
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifyDepartamentoPessoal"
                    name="notifyDepartamentoPessoal"
                    checked={form.notifyDepartamentoPessoal || false}
                    onChange={(e) => setForm(prev => ({ ...prev, notifyDepartamentoPessoal: e.target.checked }))}
                    className="w-4 h-4 text-seguranca-yellow bg-seguranca-black border-gray-600 rounded focus:ring-seguranca-yellow focus:ring-2"
                  />
                  <label htmlFor="notifyDepartamentoPessoal" className="text-sm text-seguranca-lightgray cursor-pointer">
                    Departamento Pessoal
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Selecione os departamentos que devem ser notificados sobre este remanejamento
              </p>
            </div>

            {/* Quinta linha - Observação em largura total */}
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Observações e Justificativas</label>
              <textarea 
                name="observacao" 
                value={form.observacao || ''} 
                onChange={handleChange} 
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none resize-none text-sm" 
                rows={4}
                placeholder="Descreva as observações, justificativas ou detalhes adicionais sobre o remanejamento..."
              />
            </div>
            
            {error && (
              <div className="text-red-400 bg-red-900/20 border border-red-500 rounded p-2 text-xs sm:text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer com botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-seguranca-graphite">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-2 sm:px-4 sm:py-2 bg-seguranca-graphite text-seguranca-lightgray rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-3 py-2 sm:px-4 sm:py-2 bg-seguranca-yellow text-black font-bold rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Salvando...' : (initialRemanejamento ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemanejamentoFormModal; 