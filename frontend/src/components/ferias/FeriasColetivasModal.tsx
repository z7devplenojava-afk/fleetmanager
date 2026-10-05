import React, { useState, useEffect } from 'react';
import { feriasService } from '../../services/feriasService';
import { departmentService, Department } from '../../services/departmentService';
import { FeriasColetiva, CreateFeriasColetivaRequest } from '../../types/ferias';
import { X, Users, Calendar, FileText, Loader2 } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  editingId?: string;
  initialData?: FeriasColetiva;
}

const FeriasColetivasModal: React.FC<Props> = ({ onSuccess, onClose, editingId, initialData }) => {
  const [form, setForm] = useState<CreateFeriasColetivaRequest>({
    titulo: '',
    dataInicio: '',
    dataFim: '',
    abrangeTodaEmpresa: true,
    departamentoIds: [],
    observacoes: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Planejado');

  useEffect(() => {
    if (initialData) {
      setForm({
        titulo: initialData.titulo,
        dataInicio: initialData.dataInicio,
        dataFim: initialData.dataFim,
        abrangeTodaEmpresa: initialData.abrangeTodaEmpresa ?? true,
        departamentoIds: initialData.departamentoIds || [],
        observacoes: initialData.observacoes || ''
      });
      setStatus(initialData.status);
    }
    departmentService.listActive().then(setDepartments).catch(() => setDepartments([]));
  }, [initialData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const toggleDepartamento = (id: string) => {
    setForm(prev => {
      const atual = prev.departamentoIds || [];
      return {
        ...prev,
        departamentoIds: atual.includes(id)
          ? atual.filter(d => d !== id)
          : [...atual, id]
      };
    });
  };

  const diasCalculados = (() => {
    if (!form.dataInicio || !form.dataFim) return 0;
    const diff = new Date(form.dataFim).getTime() - new Date(form.dataInicio).getTime();
    if (diff < 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.titulo.trim()) throw new Error('Informe o titulo das ferias coletivas');
      if (!form.dataInicio || !form.dataFim) throw new Error('Informe as datas de inicio e fim');
      if (diasCalculados <= 0) throw new Error('A data final deve ser posterior a data inicial');
      if (!form.abrangeTodaEmpresa && (form.departamentoIds || []).length === 0) {
        throw new Error('Selecione ao menos um departamento ou marque "Toda a empresa"');
      }

      const payload: CreateFeriasColetivaRequest = {
        ...form,
        abrangeTodaEmpresa: form.abrangeTodaEmpresa,
        departamentoIds: form.abrangeTodaEmpresa ? [] : form.departamentoIds
      };

      if (editingId) {
        await feriasService.updateColetiva(editingId, payload);
      } else {
        await feriasService.createColetiva(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ferias coletivas');
    } finally {
      setLoading(false);
    }
  };

  const bloqueado = status === 'Em Andamento' || status === 'Concluido' || status === 'Cancelado';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-seguranca-black border border-seguranca-graphite rounded-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-seguranca-graphite sticky top-0 bg-seguranca-black z-10">
          <h2 className="text-base sm:text-lg font-bold text-seguranca-yellow flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingId ? 'Editar Ferias Coletivas' : 'Nova Feria Coletiva'}
          </h2>
          <button
            onClick={onClose}
            className="text-seguranca-lightgray hover:text-seguranca-yellow transition-colors p-1"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {bloqueado && (
            <div className="text-yellow-200 bg-yellow-900/20 border border-yellow-600 rounded p-2 text-xs">
              Coletiva com status <strong>{status}</strong>: os campos abaixo ficam somente para consulta.
            </div>
          )}

          <div>
            <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
              Titulo
            </label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ex: Ferias coletivas de julho"
              className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm"
              required
              disabled={bloqueado}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Inicio</label>
              <input
                type="date"
                name="dataInicio"
                value={form.dataInicio}
                onChange={handleChange}
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm"
                required
                disabled={bloqueado}
              />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Fim</label>
              <input
                type="date"
                name="dataFim"
                value={form.dataFim}
                onChange={handleChange}
                className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm"
                required
                disabled={bloqueado}
              />
            </div>
            <div>
              <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">Duracao</label>
              <div className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 text-sm flex items-center justify-center">
                {diasCalculados} dias
              </div>
            </div>
          </div>

          <div className="bg-seguranca-graphite border border-gray-600 rounded p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-seguranca-lightgray cursor-pointer">
              <input
                type="checkbox"
                name="abrangeTodaEmpresa"
                checked={form.abrangeTodaEmpresa}
                onChange={handleChange}
                className="accent-seguranca-yellow"
                disabled={bloqueado}
              />
              <Users className="h-4 w-4" />
              Toda a empresa
            </label>

            {!form.abrangeTodaEmpresa && (
              <div>
                <p className="text-gray-400 text-xs mb-2">Selecione os departamentos abrangidos:</p>
                {departments.length === 0 ? (
                  <p className="text-gray-500 text-xs">Nenhum departamento cadastrado.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {departments.map(dep => (
                      <label
                        key={dep.id}
                        className="flex items-center gap-2 text-xs text-seguranca-lightgray cursor-pointer bg-seguranca-black rounded p-2 border border-gray-700 hover:border-seguranca-yellow"
                      >
                        <input
                          type="checkbox"
                          checked={(form.departamentoIds || []).includes(dep.id)}
                          onChange={() => toggleDepartamento(dep.id)}
                          className="accent-seguranca-yellow"
                          disabled={bloqueado}
                        />
                        {dep.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-seguranca-lightgray mb-1 text-sm font-medium flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Observacoes
            </label>
            <textarea
              name="observacoes"
              value={form.observacoes || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Detalhes sobre o periodo de ferias coletivas..."
              className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none resize-none text-sm"
              disabled={bloqueado}
            />
          </div>

          {error && (
            <div className="text-red-400 bg-red-900/20 border border-red-500 rounded p-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-seguranca-graphite">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-seguranca-graphite text-seguranca-lightgray rounded hover:bg-gray-600 transition-colors text-sm"
            >
              {bloqueado ? 'Fechar' : 'Cancelar'}
            </button>
            {!bloqueado && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-seguranca-yellow text-black font-bold rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar Coletiva'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeriasColetivasModal;
