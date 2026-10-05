import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { feriasService } from '../../services/feriasService';
import { employeeService, Employee } from '../../services/employeeService';
import {
  FeriasTipo,
  CreateFeriasRequest,
  UpdateFeriasRequest,
  PeriodoAquisitivo,
  SaldoFerias,
  ValidacaoFerias
} from '../../types/ferias';
import { X, Calendar, User, FileText, Plus, Trash2, AlertTriangle, CheckCircle2, Scissors } from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  editingId?: string; // ID do registro sendo editado (se houver, é edição; caso contrário, é criação)
  initialData?: CreateFeriasRequest;
}

interface Bloco {
  inicio: string;
  fim: string;
}

const tipoOptions = [
  { value: 'FERIAS_NORMAIS', label: 'Férias Normais (30 dias)' },
  { value: 'FERIAS_VENDIDAS', label: 'Férias Vendidas (até 10 dias)' },
  { value: 'ABONO_PECUNIARIO', label: 'Abono Pecuniário' },
];

const diasEntre = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;
  const start = new Date(inicio + 'T00:00:00');
  const end = new Date(fim + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const FeriasFormModal: React.FC<Props> = ({ onSuccess, onClose, editingId, initialData }) => {
  const [form, setForm] = useState<CreateFeriasRequest>({
    employeeId: '',
    periodoAquisitivo: '',
    periodoAquisitivoId: undefined,
    dataInicio: '',
    dataFim: '',
    tipo: 'FERIAS_NORMAIS',
    observacoes: '',
    diasAbono: 0
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Período aquisitivo / saldo
  const [periodos, setPeriodos] = useState<PeriodoAquisitivo[]>([]);
  const [saldo, setSaldo] = useState<SaldoFerias | null>(null);
  const [paLoading, setPaLoading] = useState(false);

  // Blocos fracionados (Art. 134 §1º)
  const [fracionar, setFracionar] = useState(false);
  const [blocos, setBlocos] = useState<Bloco[]>([{ inicio: '', fim: '' }]);

  // Validação em tempo real
  const [validacao, setValidacao] = useState<ValidacaoFerias | null>(null);
  const [validando, setValidando] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingId) {
      feriasService.getFeriasById(editingId).then((ferias) => {
        setForm({
          employeeId: ferias.employeeId || '',
          periodoAquisitivo: ferias.periodoAquisitivo || '',
          periodoAquisitivoId: ferias.periodoAquisitivoId || undefined,
          dataInicio: ferias.dataInicio,
          dataFim: ferias.dataFim,
          tipo: ferias.tipo,
          observacoes: ferias.observacoes || '',
          diasAbono: ferias.diasAbono || 0
        });
        const blocosExistentes = ferias.blocos;
        if (blocosExistentes && blocosExistentes.length > 1) {
          setFracionar(true);
          setBlocos(blocosExistentes.map(b => ({ inicio: b.inicio, fim: b.fim })));
        } else {
          setBlocos([{ inicio: ferias.dataInicio, fim: ferias.dataFim }]);
        }
        setStatus(ferias.status);
      }).catch((err) => {
        console.error('Erro ao carregar dados das férias:', err);
        setError('Erro ao carregar dados das férias');
      });
    } else if (initialData) {
      setForm(initialData);
      if (initialData.dataInicio && initialData.dataFim) {
        setBlocos([{ inicio: initialData.dataInicio, fim: initialData.dataFim }]);
      }
    }
    employeeService.getAllEmployees().then(setEmployees);
  }, [editingId, initialData]);

  // Carrega PAs e saldo quando o colaborador muda
  useEffect(() => {
    if (!form.employeeId) {
      setPeriodos([]);
      setSaldo(null);
      return;
    }
    let cancelled = false;
    setPaLoading(true);
    Promise.all([
      feriasService.getPeriodosAquisitivos(form.employeeId),
      feriasService.getSaldoFerias(form.employeeId).catch(() => null)
    ]).then(([ps, sd]) => {
      if (cancelled) return;
      setPeriodos(ps);
      setSaldo(sd);
      // Seleciona automaticamente o PA vigente (status CONCESSIVO/EM_ANDAMENTO)
      if (!form.periodoAquisitivoId) {
        const vigente = ps.find(p => p.status === 'CONCESSIVO')
          || ps.find(p => p.status === 'EM_ANDAMENTO')
          || ps[0];
        if (vigente) {
          setForm(f => ({
            ...f,
            periodoAquisitivoId: vigente.id,
            periodoAquisitivo: `${new Date(vigente.dataInicio).getFullYear()}/${new Date(vigente.dataFim).getFullYear()}`
          }));
        }
      }
    }).catch((err) => {
      console.error('Erro ao carregar períodos aquisitivos:', err);
    }).finally(() => {
      if (!cancelled) setPaLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.employeeId]);

  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value } as CreateFeriasRequest;
      // Mantém o primeiro bloco em sincronia com as datas quando não está fracionado
      if (!fracionar && (name === 'dataInicio' || name === 'dataFim')) {
        setBlocos([{ inicio: next.dataInicio || '', fim: next.dataFim || '' }]);
      }
      return next;
    });
  };

  const handleBlocoChange = (index: number, field: keyof Bloco, value: string) => {
    setBlocos(prev => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const addBloco = () => {
    if (blocos.length >= 3) return; // Art. 134 §1º - máximo 3 blocos
    const ultimo = blocos[blocos.length - 1];
    const novoInicio = ultimo?.fim ? addDias(ultimo.fim, 1) : '';
    setBlocos(prev => [...prev, { inicio: novoInicio, fim: '' }]);
  };

  const removeBloco = (index: number) => {
    if (blocos.length <= 1) return;
    setBlocos(prev => prev.filter((_, i) => i !== index));
  };

  const addDias = (data: string, dias: number): string => {
    const d = new Date(data + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
  };

  const toggleFracionar = (ativo: boolean) => {
    setFracionar(ativo);
    if (ativo) {
      setBlocos([{ inicio: form.dataInicio || '', fim: form.dataFim || '' }]);
    } else {
      setBlocos([{ inicio: form.dataInicio || '', fim: form.dataFim || '' }]);
    }
  };

  // Datas consolidadas (primeiro início / último fim)
  const datasConsolidadas = useMemo(() => {
    const validos = blocos.filter(b => b.inicio && b.fim);
    if (validos.length === 0) return { inicio: form.dataInicio, fim: form.dataFim };
    const inicio = validos.map(b => b.inicio).sort()[0];
    const fim = validos.map(b => b.fim).sort().reverse()[0];
    return { inicio, fim };
  }, [blocos, form.dataInicio, form.dataFim]);

  const totalDiasGozo = useMemo(
    () => blocos.reduce((acc, b) => acc + diasEntre(b.inicio, b.fim), 0),
    [blocos]
  );

  const maxAbono = useMemo(() => {
    if (!saldo) return 0;
    return saldo.maximoAbonoPecuniario ?? 0;
  }, [saldo]);

  // Validação em tempo real (RF-02 / RF-03 / RF-05)
  const payloadValidacao = useMemo(() => {
    if (!form.employeeId || !datasConsolidadas.inicio) return null;
    return {
      employeeId: form.employeeId,
      dataInicio: datasConsolidadas.inicio,
      blocos: blocos
        .filter(b => b.inicio && b.fim)
        .map(b => ({ inicio: b.inicio, fim: b.fim, dias: diasEntre(b.inicio, b.fim) })),
      diasAbono: Number(form.diasAbono) || 0,
      periodoAquisitivoId: form.periodoAquisitivoId
    };
  }, [form.employeeId, form.periodoAquisitivoId, form.diasAbono, blocos, datasConsolidadas]);

  const executarValidacao = useCallback(async () => {
    if (!payloadValidacao) return;
    setValidando(true);
    try {
      const resultado = await feriasService.validarSolicitacao(payloadValidacao);
      setValidacao(resultado);
    } catch (err) {
      console.error('Erro na validação de férias:', err);
      setValidacao(null);
    } finally {
      setValidando(false);
    }
  }, [payloadValidacao]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!payloadValidacao) {
      setValidacao(null);
      return;
    }
    debounceRef.current = setTimeout(executarValidacao, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [payloadValidacao, executarValidacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!form.employeeId) throw new Error('Selecione o funcionário');
      if (!form.periodoAquisitivo) throw new Error('Informe o período aquisitivo');
      if (fracionar) {
        const validos = blocos.filter(b => b.inicio && b.fim);
        if (validos.length === 0) throw new Error('Informe ao menos um bloco de férias');
        if (validos.length > 3) throw new Error('Máximo de 3 blocos (Art. 134 §1º da CLT)');
        if (validos.some(b => diasEntre(b.inicio, b.fim) < 5)) {
          throw new Error('Todos os blocos devem ter no mínimo 5 dias corridos (Art. 134 §1º da CLT)');
        }
        const maior = Math.max(...validos.map(b => diasEntre(b.inicio, b.fim)));
        if (maior < 14) {
          throw new Error('Ao menos um bloco deve ter 14 dias ou mais (Art. 134 §1º da CLT)');
        }
      } else {
        if (!form.dataInicio) throw new Error('Informe a data de início');
        if (!form.dataFim) throw new Error('Informe a data de fim');
      }

      // Bloqueia o envio se o motor de validação apontou violações
      if (validacao && !validacao.aprovado && validacao.violacoes.length > 0) {
        throw new Error(validacao.violacoes.join(' '));
      }

      const payload: CreateFeriasRequest = {
        ...form,
        dataInicio: datasConsolidadas.inicio,
        dataFim: datasConsolidadas.fim,
        blocos: fracionar
          ? blocos.filter(b => b.inicio && b.fim).map(b => ({ ...b, dias: diasEntre(b.inicio, b.fim) }))
          : undefined,
        diasAbono: Number(form.diasAbono) || 0
      };

      if (editingId) {
        const updateData: UpdateFeriasRequest = {
          dataInicio: payload.dataInicio,
          dataFim: payload.dataFim,
          tipo: payload.tipo,
          status: status || undefined,
          observacoes: payload.observacoes || undefined
        };
        await feriasService.updateFerias(editingId, updateData);
      } else {
        await feriasService.createFerias(payload);
      }
      onSuccess();
    } catch (err: unknown) {
      const mensagem = err instanceof Error
        ? err.message
        : (editingId ? 'Erro ao atualizar solicitação de férias' : 'Erro ao salvar solicitação de férias');
      setError(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
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
                <select
                  name="periodoAquisitivoId"
                  value={form.periodoAquisitivoId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const pa = periodos.find(p => p.id === id);
                    setForm(prev => ({
                      ...prev,
                      periodoAquisitivoId: id || undefined,
                      periodoAquisitivo: pa
                        ? `${new Date(pa.dataInicio).getFullYear()}/${new Date(pa.dataFim).getFullYear()}`
                        : prev.periodoAquisitivo
                    }));
                  }}
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm"
                  disabled={paLoading || periodos.length === 0}
                  required
                >
                  <option value="">
                    {paLoading ? 'Carregando...' : periodos.length === 0 ? 'Nenhum PA encontrado' : 'Selecione o período...'}
                  </option>
                  {periodos.map(pa => (
                    <option key={pa.id} value={pa.id}>
                      {new Date(pa.dataInicio).getFullYear()}/{new Date(pa.dataFim).getFullYear()}
                      {' — '}saldo {pa.diasSaldo}d ({pa.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Painel de saldo do PA */}
            {saldo && (
              <div className="bg-seguranca-graphite border border-gray-600 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Saldo disponível</p>
                  <p className="text-seguranca-yellow font-bold text-lg">{saldo.diasSaldo ?? 0} dias</p>
                </div>
                <div>
                  <p className="text-gray-400">Já utilizados</p>
                  <p className="text-seguranca-lightgray font-bold text-lg">{saldo.diasUtilizados ?? 0} dias</p>
                </div>
                <div>
                  <p className="text-gray-400">Faltas injustificadas</p>
                  <p className="text-seguranca-lightgray font-bold text-lg">{saldo.faltasInjustificadas ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Limite concessivo</p>
                  <p className="text-seguranca-lightgray font-bold text-lg">
                    {saldo.limiteConcessivo ? new Date(saldo.limiteConcessivo).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Segunda linha - datas */}
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
                  disabled={fracionar}
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm disabled:opacity-50"
                  required={!fracionar}
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
                  disabled={fracionar}
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm disabled:opacity-50"
                  required={!fracionar}
                />
              </div>
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Total de Dias de Gozo
                </label>
                <div className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 text-sm flex items-center justify-center">
                  {totalDiasGozo} dias
                </div>
              </div>
            </div>

            {/* Fracionamento em blocos - RF-02 */}
            <div className="bg-seguranca-graphite border border-gray-600 rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-seguranca-lightgray text-sm font-medium flex items-center gap-1">
                  <Scissors className="h-4 w-4" />
                  Fracionar em blocos
                  <span className="text-gray-400 font-normal">(máx. 3 — Art. 134 §1º)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fracionar}
                    onChange={(e) => toggleFracionar(e.target.checked)}
                    className="accent-seguranca-yellow"
                  />
                  {fracionar ? 'Ativado' : 'Desativado'}
                </label>
              </div>

              {fracionar && (
                <div className="space-y-2">
                  {blocos.map((bloco, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="text-gray-400 text-xs">Bloco {index + 1} — Início</label>
                        <input
                          type="date"
                          value={bloco.inicio}
                          onChange={(e) => handleBlocoChange(index, 'inicio', e.target.value)}
                          className="w-full p-2 rounded bg-seguranca-black text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-xs"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-gray-400 text-xs">Bloco {index + 1} — Fim</label>
                        <input
                          type="date"
                          value={bloco.fim}
                          onChange={(e) => handleBlocoChange(index, 'fim', e.target.value)}
                          className="w-full p-2 rounded bg-seguranca-black text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-xs"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <span className="text-seguranca-yellow text-xs font-bold">
                          {diasEntre(bloco.inicio, bloco.fim)}d
                        </span>
                        {blocos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBloco(index)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remover bloco"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {blocos.length < 3 && (
                    <button
                      type="button"
                      onClick={addBloco}
                      className="flex items-center gap-1 text-xs text-seguranca-yellow hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Adicionar bloco
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Terceira linha - Tipo de Férias, abono e Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
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
              <div>
                <label className="block text-seguranca-lightgray mb-1 text-sm font-medium">
                  Abono Pecuniário (dias)
                </label>
                <input
                  type="number"
                  name="diasAbono"
                  min={0}
                  max={maxAbono}
                  value={form.diasAbono ?? 0}
                  onChange={handleChange}
                  className="w-full p-2 rounded bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 focus:border-seguranca-yellow focus:outline-none text-sm"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Máximo: {maxAbono} dias (1/3 do saldo — Art. 143 §1º)
                </p>
              </div>
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

            {/* Validação em tempo real - RF-02 / RF-03 / RF-05 */}
            {validacao && (validacao.violacoes.length > 0 || validacao.alertas.length > 0) && (
              <div className="space-y-2">
                {validacao.violacoes.map((v, i) => (
                  <div key={`v-${i}`} className="text-red-300 bg-red-900/20 border border-red-500 rounded p-2 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{v}</span>
                  </div>
                ))}
                {validacao.alertas.map((a, i) => (
                  <div key={`a-${i}`} className="text-yellow-200 bg-yellow-900/20 border border-yellow-600 rounded p-2 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
            {validacao && validacao.aprovado && validacao.violacoes.length === 0 && validacao.alertas.length === 0 && (
              <div className="text-green-300 bg-green-900/20 border border-green-600 rounded p-2 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Solicitação válida conforme a CLT. Saldo disponível: {validacao.saldoDisponivel} dias.</span>
              </div>
            )}
            {validando && (
              <p className="text-gray-400 text-xs flex items-center gap-2">
                <span className="animate-spin inline-block h-3 w-3 border-b-2 border-seguranca-yellow rounded-full" />
                Validando regras de férias...
              </p>
            )}

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
              disabled={loading || (validacao !== null && !validacao.aprovado)}
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
