import React, { useState, useEffect } from 'react';
import { feriasService } from '../../services/feriasService';
import { employeeService, Employee } from '../../services/employeeService';
import { AfastamentoTipo, CreateAfastamentoRequest } from '../../types/ferias';
import { X, AlertTriangle, User, FileText, Upload } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  initialData?: CreateAfastamentoRequest;
}

const tipoOptions = [
  { value: 'ATESTADO', label: 'Atestado Médico' },
  { value: 'LICENCA_MEDICA', label: 'Licença Médica' },
  { value: 'LICENCA_MATERNIDADE', label: 'Licença Maternidade' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade' },
  { value: 'SUSPENSAO', label: 'Suspensão' },
  { value: 'OUTROS', label: 'Outros' },
];

const AfastamentoFormModal: React.FC<Props> = ({ onSuccess, onClose, initialData }) => {
  const [form, setForm] = useState<CreateAfastamentoRequest>({
    employeeId: '',
    tipo: 'ATESTADO',
    dataInicio: '',
    dataFim: '',
    motivo: '',
    documento: '',
    observacoes: ''
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
    // Buscar funcionários
    employeeService.getEmployees().then(setEmployees);
  }, [initialData]);

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
      if (!form.dataInicio) throw new Error('Informe a data de início');
      if (!form.dataFim) throw new Error('Informe a data de fim');
      if (!form.motivo) throw new Error('Informe o motivo do afastamento');
      
      await feriasService.createAfastamento(form);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar solicitação de afastamento');
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
            <AlertTriangle className="h-5 w-5" />
            Nova Solicitação de Afastamento
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
                  Tipo de Afastamento
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

            {/* Terceira linha - Motivo */}
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                Motivo do Afastamento
              </label>
              <input 
                type="text" 
                name="motivo" 
                value={form.motivo} 
                onChange={handleChange} 
                placeholder="Ex: Gripe, Cirurgia, etc."
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm" 
                required 
              />
            </div>

            {/* Quarta linha - Documento */}
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Documento (Opcional)
              </label>
              <input 
                type="file" 
                name="documento" 
                onChange={(e) => setForm({ ...form, documento: e.target.files?.[0]?.name || '' })} 
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-seguranca-yellow file:text-black hover:file:bg-yellow-500" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-gray-400 mt-1">
                Aceita: PDF, JPG, PNG, DOC, DOCX (máx. 5MB)
              </p>
            </div>

            {/* Quinta linha - Observações */}
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Observações e Detalhes
              </label>
              <textarea 
                name="observacoes" 
                value={form.observacoes || ''} 
                onChange={handleChange} 
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none resize-none text-sm" 
                rows={4}
                placeholder="Descreva detalhes adicionais sobre o afastamento..."
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
              {loading ? 'Salvando...' : 'Solicitar Afastamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AfastamentoFormModal; 