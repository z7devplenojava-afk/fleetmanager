import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';
import { employeeService, Employee } from '@/services/employeeService';
import {
  UserCheck,
  UserPlus,
  Search,
  Building2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  User as UserIcon,
  Briefcase,
  Hash,
  ArrowRight
} from 'lucide-react';

interface SuggestedEmployee {
  id: string;
  name: string;
  document?: string;
  registrationNumber?: string;
  positionName?: string;
  departmentName?: string;
  companyId?: string;
}

interface VincularFuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employeeId: string, employeeName: string) => void;
  user: any;
}

export const VincularFuncionarioModal: React.FC<VincularFuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'sugestao' | 'lista' | 'cpf'>('sugestao');
  
  // Estados para sugestão automática
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestedEmployee, setSuggestedEmployee] = useState<SuggestedEmployee | null>(null);
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [detectedCpf, setDetectedCpf] = useState('');

  // Estados para busca na lista
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Estados para atualização de CPF
  const [inputCpf, setInputCpf] = useState('');
  const [updatingCpf, setUpdatingCpf] = useState(false);

  // Estado geral de ação
  const [submitting, setSubmitting] = useState(false);

  // Formatar CPF 000.000.000-00
  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  // Carregar sugestão ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchMatch = async () => {
      setLoadingSuggestion(true);
      try {
        const res = await api.get('/api/users/current/match-employee');
        if (!isMounted) return;

        if (res.data?.linked && res.data?.employeeId) {
          // Já está vinculado
          onSuccess(res.data.employeeId, res.data.employeeName);
          onClose();
          return;
        }

        if (res.data?.hasSuggestion && res.data?.suggestedEmployee) {
          setSuggestedEmployee(res.data.suggestedEmployee);
          setHasSuggestion(true);
          setActiveTab('sugestao');
        } else {
          setHasSuggestion(false);
          setActiveTab('lista');
        }

        if (res.data?.userCpf) {
          setDetectedCpf(res.data.userCpf);
          setInputCpf(formatCpf(res.data.userCpf));
        } else if (user?.username) {
          const rawDigits = user.username.replace(/\D/g, '');
          if (rawDigits.length === 11) {
            setDetectedCpf(rawDigits);
            setInputCpf(formatCpf(rawDigits));
          }
        }
      } catch (err) {
        console.warn('Não foi possível verificar sugestão automática:', err);
        setActiveTab('lista');
      } finally {
        if (isMounted) setLoadingSuggestion(false);
      }
    };

    fetchMatch();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Carregar lista de colaboradores quando entrar na aba lista
  useEffect(() => {
    if (!isOpen || activeTab !== 'lista') return;
    if (allEmployees.length > 0) return;

    const loadEmployees = async () => {
      setSearchingEmployees(true);
      try {
        const emps = await employeeService.getAllEmployees();
        setAllEmployees(emps || []);
      } catch (err) {
        console.error('Erro ao carregar colaboradores:', err);
      } finally {
        setSearchingEmployees(false);
      }
    };

    loadEmployees();
  }, [isOpen, activeTab]);

  // Filtragem local inteligente da lista
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return allEmployees.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/\D/g, '');
    return allEmployees.filter((emp) => {
      const nameMatch = emp.name?.toLowerCase().includes(q);
      const regMatch = emp.registrationNumber?.toLowerCase().includes(q);
      const docClean = emp.document ? emp.document.replace(/\D/g, '') : '';
      const docMatch = cleanDigits && docClean.includes(cleanDigits);
      const posMatch = (emp as any)?.positionName?.toLowerCase()?.includes(q) || (emp as any)?.position?.name?.toLowerCase()?.includes(q);
      return nameMatch || regMatch || docMatch || posMatch;
    }).slice(0, 20);
  }, [allEmployees, searchQuery]);

  // Vincular funcionário selecionado ou sugerido
  const handleLinkEmployee = async (empId: string, empName: string) => {
    try {
      setSubmitting(true);
      const res = await api.post('/api/users/link-employee', { employeeId: empId });
      if (res.data?.success) {
        toast({
          title: '✅ Vínculo Realizado com Sucesso!',
          description: `Seu usuário foi vinculado a ${empName}. O ponto agora pode ser registrado normalmente.`,
        });
        onSuccess(empId, empName);
        onClose();
      } else {
        throw new Error(res.data?.error || 'Erro ao vincular colaborador.');
      }
    } catch (err: any) {
      console.error('Erro ao vincular:', err);
      toast({
        title: '❌ Falha ao Vincular',
        description: err.response?.data?.error || err.message || 'Não foi possível vincular o colaborador.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Salvar CPF e tentar auto-vínculo
  const handleUpdateCpfAndMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCpf.replace(/\D/g, '');
    if (clean.length !== 11) {
      toast({
        title: '⚠️ CPF Inválido',
        description: 'Por favor, digite os 11 dígitos do seu CPF.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdatingCpf(true);
      const res = await api.post('/api/users/update-cpf-and-match', { cpf: clean });
      if (res.data?.success) {
        if (res.data.matched && res.data.employeeId) {
          toast({
            title: '✅ Sucesso!',
            description: res.data.message || `Funcionário ${res.data.employeeName} vinculado!`,
          });
          onSuccess(res.data.employeeId, res.data.employeeName);
          onClose();
        } else {
          toast({
            title: 'ℹ️ CPF Atualizado',
            description: 'CPF salvo no seu usuário. Selecione seu funcionário na lista abaixo para finalizar a vinculação.',
          });
          setActiveTab('lista');
          // Atualiza lista
          const emps = await employeeService.getAllEmployees();
          setAllEmployees(emps || []);
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar CPF:', err);
      toast({
        title: '❌ Erro ao Salvar CPF',
        description: err.response?.data?.error || err.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingCpf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl bg-seguranca-darkgray/95 border border-gray-800 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-900 to-gray-800/80 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-seguranca-yellow/10 border border-seguranca-yellow/30 text-seguranca-yellow">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Identificação do Colaborador para Registro de Ponto
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-0.5">
                Para registrar o ponto, seu usuário precisa estar vinculado ao seu cadastro de funcionário.
              </DialogDescription>
            </div>
          </div>

          {/* Abas de navegação */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-800/80">
            {hasSuggestion && (
              <button
                type="button"
                onClick={() => setActiveTab('sugestao')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'sugestao'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sugestão Encontrada
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'lista'
                  ? 'bg-seguranca-yellow text-seguranca-black shadow-md'
                  : 'bg-gray-800/70 text-gray-400 hover:text-white'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              Selecionar da Lista
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cpf')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'cpf'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-800/70 text-gray-400 hover:text-white'
              }`}
            >
              <Hash className="h-3.5 w-3.5" />
              Informar / Atualizar CPF
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {/* ABA 1: SUGESTÃO POR CPF */}
          {activeTab === 'sugestao' && (
            <div className="space-y-4">
              {loadingSuggestion ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                  <p className="text-sm">Buscando correspondência de CPF na base de funcionários...</p>
                </div>
              ) : suggestedEmployee ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-4 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                        {suggestedEmployee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Correspondência Localizada
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">{suggestedEmployee.name}</h4>
                        <p className="text-xs text-gray-400">
                          {suggestedEmployee.positionName || 'Colaborador Operacional'}
                          {suggestedEmployee.departmentName ? ` • ${suggestedEmployee.departmentName}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-500/20 text-xs">
                    <div className="bg-black/30 p-2.5 rounded-lg border border-emerald-500/10">
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">CPF Cadastrado</span>
                      <span className="text-white font-mono font-bold">
                        {suggestedEmployee.document || formatCpf(detectedCpf) || 'Não informado'}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-lg border border-emerald-500/10">
                      <span className="text-gray-400 block text-[10px] uppercase font-semibold">Matrícula</span>
                      <span className="text-white font-mono font-bold">
                        {suggestedEmployee.registrationNumber || 'Sem matrícula'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('lista')}
                      className="border-gray-700 bg-gray-800/80 text-gray-300 hover:text-white text-xs"
                    >
                      Não sou eu (Buscar outro)
                    </Button>
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleLinkEmployee(suggestedEmployee.id, suggestedEmployee.name)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Vinculando...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" /> Confirmar & Registrar Ponto
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 space-y-3">
                  <AlertTriangle className="h-10 w-10 text-seguranca-yellow mx-auto" />
                  <p className="text-sm">Nenhum funcionário encontrado automaticamente para o seu perfil.</p>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('lista')}
                    className="bg-seguranca-yellow text-seguranca-black font-bold text-xs"
                  >
                    Ver Lista de Funcionários
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: LISTA DE COLABORADORES */}
          {activeTab === 'lista' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar funcionário por nome, CPF ou matrícula..."
                  className="pl-9 bg-black/40 border-gray-700 text-white placeholder-gray-500 text-xs rounded-xl focus:border-seguranca-yellow"
                />
              </div>

              {searchingEmployees ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow" />
                  <p className="text-xs">Carregando colaboradores...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-gray-400 space-y-2 border border-dashed border-gray-800 rounded-xl">
                  <UserIcon className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="text-xs">Nenhum colaborador encontrado com esse termo.</p>
                  <Button
                    type="button"
                    onClick={() => setActiveTab('cpf')}
                    variant="link"
                    className="text-xs text-seguranca-yellow"
                  >
                    Tentar buscar ou atualizar por CPF →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedEmpId === emp.id;
                    const empDoc = emp.document || (emp as any)?.cpf || '';
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-seguranca-yellow/15 border-seguranca-yellow shadow-md'
                            : 'bg-gray-900/60 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-seguranca-yellow text-seguranca-black' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs sm:text-sm font-bold text-white truncate">{emp.name}</h5>
                            <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                              {empDoc && <span>CPF: {empDoc}</span>}
                              {emp.registrationNumber && <span>• Matr: {emp.registrationNumber}</span>}
                              {(emp as any).positionName && <span>• {(emp as any).positionName}</span>}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          disabled={submitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkEmployee(emp.id, emp.name);
                          }}
                          className={`text-xs font-bold shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-seguranca-yellow text-seguranca-black hover:bg-yellow-400'
                              : 'bg-gray-800 hover:bg-gray-700 text-white'
                          }`}
                        >
                          {submitting && selectedEmpId === emp.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Vincular'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: INFORMAR / ATUALIZAR CPF */}
          {activeTab === 'cpf' && (
            <form onSubmit={handleUpdateCpfAndMatch} className="space-y-4">
              <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-200">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-blue-400" />
                  Vínculo Automático por CPF
                </p>
                Informe o seu CPF abaixo. O sistema salvará o documento em seu perfil de usuário e buscará automaticamente o seu cadastro correspondente na base de colaboradores da empresa.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase">Seu CPF (11 dígitos):</label>
                <Input
                  type="text"
                  value={inputCpf}
                  onChange={(e) => setInputCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="bg-black/50 border-gray-700 text-white text-sm font-mono tracking-wider focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-700 bg-gray-800/80 text-gray-300 hover:text-white text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updatingCpf || inputCpf.replace(/\D/g, '').length !== 11}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2"
                >
                  {updatingCpf ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando & Buscando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" /> Salvar CPF & Buscar Vínculo
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

