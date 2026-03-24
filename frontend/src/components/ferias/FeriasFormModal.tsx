import React, { useState, useEffect } from 'react';
import { feriasService } from '../../services/feriasService';
import { employeeService, Employee } from '../../services/employeeService';
import { FeriasTipo, CreateFeriasRequest, UpdateFeriasRequest } from '../../types/ferias';
import { X, Calendar, User, FileText } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  editingId?: string; // ID do registro sendo editado (se houver, é edição; caso contrário, é criação)
  initialData?: CreateFeriasRequest;
}

const tipoOptions = [
  { value: 'FERIAS_NORMAIS', label: 'Férias Normais (30 dias)' },
  { value: 'FERIAS_VENDIDAS', label: 'Férias Vendidas (até 10 dias)' },
  { value: 'ABONO_PECUNIARIO', label: 'Abono Pecuniário' },
];

const FeriasFormModal: React.FC<Props> = ({ onSuccess, onClose, editingId, initialData }) => {
  const [form, setForm] = useState<CreateFeriasRequest>({
    employeeId: '',
    periodoAquisitivo: '',
    dataInicio: '',
    dataFim: '',
    tipo: 'FERIAS_NORMAIS',
    observacoes: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // Se estiver editando, buscar dados completos do backend
    if (editingId) {
      feriasService.getFeriasById(editingId).then((ferias) => {
        setForm({
          employeeId: ferias.employeeId || '',
          periodoAquisitivo: ferias.periodoAquisitivo || '',
          dataInicio: ferias.dataInicio,
          dataFim: ferias.dataFim,
          tipo: ferias.tipo,
          observacoes: ferias.observacoes || ''
        });
        setStatus(ferias.status);
      }).catch((error) => {
        console.error('Erro ao carregar dados das férias:', error);
        setError('Erro ao carregar dados das férias');
      });
    } else if (initialData) {
      setForm(initialData);
    }
    // Buscar funcionários
    employeeService.getAllEmployees().then(setEmployees);
  }, [editingId, initialData]);

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
      if (!form.periodoAquisitivo) throw new Error('Informe o período aquisitivo');
      if (!form.dataInicio) throw new Error('Informe a data de início');
      if (!form.dataFim) throw new Error('Informe a data de fim');
      
      // Se houver editingId, é uma edição - usar updateFerias
      if (editingId) {
        // Converter dados do formulário para o formato esperado pelo backend no update
        const updateData: UpdateFeriasRequest = {
          dataInicio: form.dataInicio,
          dataFim: form.dataFim,
          tipo: form.tipo,
          status: status || undefined, // Incluir status se estiver editando
          observacoes: form.observacoes || undefined
        };
        await feriasService.updateFerias(editingId, updateData);
      } else {
        // É uma criação - usar createFerias
        await feriasService.createFerias(form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || (editingId ? 'Erro ao atualizar solicitação de férias' : 'Erro ao salvar solicitação de férias'));
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const calculateDays = () => {
    if (form.dataInicio && form.dataFim) {
      const startDate = new Date(form.dataInicio);
      const endDate = new Date(form.dataFim);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-seguranca-black border border-seguranca-graphite rounded-lg w-full max-w-sm sm:max-w-md lg:max-w-2xl xl:max-w-3xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-seguranca-graphite sticky top-0 bg-seguranca-black z-10">
          <h2 className="text-base sm:text-lg font-bold text-seguranca-yellow flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingId ? 'Editar Solicitação de Férias' : 'Nova Solicitação de Férias'}
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
            {/* Primeira linha - 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Funcionário
                </label>
                <select 
                  name="employeeId" 
                  value={form.employeeId} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                >
                  <option value="">Selecione o funcionário...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Período Aquisitivo
                </label>
                <input 
                  type="text" 
                  name="periodoAquisitivo" 
                  value={form.periodoAquisitivo} 
                  onChange={handleChange} 
                  placeholder="Ex: 2024/2025"
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required 
                />
              </div>
            </div>

            {/* Segunda linha - 3 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Data de Início
                </label>
                <input 
                  type="date" 
                  name="dataInicio" 
                  value={form.dataInicio} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Data de Fim
                </label>
                <input 
                  type="date" 
                  name="dataFim" 
                  value={form.dataFim} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Total de Dias
                </label>
                <div className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 text-sm flex items-center justify-center">
                  {calculateDays()} dias
                </div>
              </div>
            </div>

            {/* Terceira linha - Tipo de Férias e Status (quando editando) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Tipo de Férias
                </label>
                <select 
                  name="tipo" 
                  value={form.tipo} 
                  onChange={handleChange} 
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  required
                >
                  {tipoOptions.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {/* Campo de Status (editável quando editando) */}
              {editingId && (
                <div>
                  <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                    Status
                  </label>
                  <select 
                    name="status" 
                    value={status || 'PENDENTE'} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="CANCELADO">Cancelado</option>
                    <option value="REJECTED">Rejeitado</option>
                  </select>
                </div>
              )}
            </div>

            {/* Quarta linha - Observações */}
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Observações e Justificativas
              </label>
              <textarea 
                name="observacoes" 
                value={form.observacoes || ''} 
                onChange={handleChange} 
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none resize-none text-sm" 
                rows={4}
                placeholder="Descreva as observações, justificativas ou detalhes adicionais sobre as férias..."
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
              {loading ? (editingId ? 'Atualizando...' : 'Salvando...') : (editingId ? 'Atualizar Férias' : 'Solicitar Férias')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeriasFormModal; 