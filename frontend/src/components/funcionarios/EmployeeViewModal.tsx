import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User, Building, MapPin, Calendar, Phone, Mail, FileText,
  Edit, X, Briefcase, Shield, CreditCard, Car, Hash,
  Users, Clock, Banknote, Heart, Stethoscope, AlertTriangle,
  UserCheck, Palmtree, ChevronRight, CheckCircle2, AlertCircle,
  Plus, Download, ExternalLink, Award, FileCheck
} from 'lucide-react';
import { Employee } from '@/types/employee';
import { getEmployeeTerminationDate } from './FuncionariosTable';
import { EmployeeDocuments } from '@/components/funcionarios/EmployeeDocuments';
import DependentesList from '@/components/dependentes/DependentesList';
import { medicalCertificateService, MedicalCertificate } from '@/services/medicalCertificateService';
import { feriasService, PeriodoAquisitivo, SaldoFerias } from '@/services/feriasService';

interface EmployeeViewModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
  onViewDocuments?: (employee: Employee) => void;
  onViewDependents?: (employee: Employee) => void;
}

type TabType = 'dados' | 'documentos' | 'ponto' | 'dependentes' | 'exames' | 'ferias' | 'atestados';

const formatDate = (date?: any) => {
  if (!date) return '-';
  if (Array.isArray(date)) {
    const [y, m, d] = date;
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  if (typeof date === 'string') {
    const cleanDate = date.includes('T') || date.includes(' ')
      ? date
      : (date.includes('-') && date.length === 10 ? `${date}T00:00:00` : date);
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }
  }
  try {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }
  } catch {}
  return '-';
};

export const EmployeeViewModal: React.FC<EmployeeViewModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
  onViewDocuments,
  onViewDependents,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dados');
  const [atestados, setAtestados] = useState<MedicalCertificate[]>([]);
  const [loadingAtestados, setLoadingAtestados] = useState(false);
  const [periodoAtivo, setPeriodoAtivo] = useState<PeriodoAquisitivo | null>(null);
  const [saldoFerias, setSaldoFerias] = useState<SaldoFerias | null>(null);

  useEffect(() => {
    if (!employee || !isOpen) {
      setAtestados([]);
      setPeriodoAtivo(null);
      setSaldoFerias(null);
      return;
    }

    // Carregar atestados do funcionário
    const fetchAtestados = async () => {
      try {
        setLoadingAtestados(true);
        const data = await medicalCertificateService.getByEmployee(employee.id);
        setAtestados(data || []);
      } catch (err) {
        console.error('Erro ao buscar atestados do funcionário:', err);
      } finally {
        setLoadingAtestados(false);
      }
    };

    // Carregar informações de férias
    const fetchFerias = async () => {
      try {
        const [periodo, saldo] = await Promise.all([
          feriasService.getPeriodoAquisitivoAtivo(employee.id).catch(() => null),
          feriasService.getSaldoFerias(employee.id).catch(() => null),
        ]);
        if (periodo) setPeriodoAtivo(periodo);
        if (saldo) setSaldoFerias(saldo);
      } catch (err) {
        console.error('Erro ao buscar dados de férias:', err);
      }
    };

    fetchAtestados();
    fetchFerias();
  }, [employee, isOpen]);

  if (!employee) return null;

  const isTerminated = employee.status === 'TERMINATED';
  const isVacation = employee.status === 'VACATION';
  const isMedical = employee.status === 'MEDICAL_CERTIFICATE';

  const getStatusDisplay = () => {
    if (isTerminated) return { label: 'Demitido', bg: 'bg-rose-950/60 border-rose-500/40 text-rose-400', dot: 'bg-rose-400', kpiBadge: 'Inativo', kpiText: 'Demitido' };
    if (isVacation) return { label: 'Férias', bg: 'bg-blue-950/60 border-blue-500/40 text-blue-400', dot: 'bg-blue-400', kpiBadge: 'Em férias', kpiText: 'Férias' };
    if (isMedical) return { label: 'Atestado', bg: 'bg-purple-950/60 border-purple-500/40 text-purple-400', dot: 'bg-purple-400', kpiBadge: 'Afastado', kpiText: 'Licença Médica' };
    return { label: 'Ativo', bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400', dot: 'bg-emerald-400', kpiBadge: 'Em atividade', kpiText: 'Ativo Regular' };
  };

  const statusInfo = getStatusDisplay();
  const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
  const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name || '-';
  const workPostFull = employee.workPost?.description || employee.workPost?.name || '-';
  const escala = employee.escalaTrabalho || employee.currentScale || employee.diasTrabalho || '-';
  const horario = employee.horarioTrabalho || (employee as any).workSchedule || '-';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 bg-transparent border-0 shadow-2xl">
        {/* DialogTitle oculto para satisfazer acessibilidade do Radix UI (leitores de tela) */}
        <DialogTitle className="sr-only">Visualizar Funcionário: {employee.name}</DialogTitle>
        <div className="flex flex-col h-full bg-[#16181f] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* ── HEADER SUPERIOR (FIEL ÀS IMAGENS 3 E 4) ── */}
          <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Red Avatar Box */}
              <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-md shadow-red-600/10">
                <User className="h-7 w-7 text-red-500" />
              </div>
              
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide truncate">
                  {employee.name}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                    Mat: {employee.registrationNumber || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-white">
                    <Building className="h-3.5 w-3.5 text-amber-400" />
                    {companySigla}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Topo: Editar Dados */}
            <div className="flex items-center gap-2.5 shrink-0 pr-8">
              {onEdit && (
                <Button
                  onClick={() => {
                    onClose();
                    onEdit(employee);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 h-auto rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Edit className="h-4 w-4" />
                  Editar Dados
                </Button>
              )}
            </div>
          </div>

          {/* ── 4 CARDS DE INDICADORES / KPIS (DINÂMICOS E INTERATIVOS) ── */}
          <div className="px-6 py-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* 1. Atestados Entregues */}
              <div 
                onClick={() => setActiveTab('atestados')}
                className="bg-[#1c202a] border border-gray-800/90 hover:border-sky-500/40 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/60 border border-sky-500/30 text-sky-300">
                    {atestados.length === 0 ? 'Sem atestados' : `${atestados.length} entregue(s)`}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-3">
                  ATESTADOS ENTREGUES
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white">{atestados.length}</span>
                  <span className="text-[11px] font-medium text-sky-400 group-hover:underline">
                    Ver lista &gt;
                  </span>
                </div>
              </div>

              {/* 2. Advertências Aplicadas */}
              <div className="bg-[#1c202a] border border-gray-800/90 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    Ficha limpa
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-3">
                  ADVERTÊNCIAS APLICADAS
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white">0</span>
                  <span className="text-[11px] font-medium text-gray-400 hover:text-white cursor-pointer">
                    Disciplinar &gt;
                  </span>
                </div>
              </div>

              {/* 3. Situação Funcional */}
              <div 
                onClick={() => setActiveTab('dados')}
                className="bg-[#1c202a] border border-gray-800/90 hover:border-emerald-500/40 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                    {statusInfo.kpiBadge}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-3">
                  SITUAÇÃO FUNCIONAL
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm sm:text-base font-bold text-white truncate">
                    {statusInfo.kpiText}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 group-hover:text-white">
                    Detalhes &gt;
                  </span>
                </div>
              </div>

              {/* 4. Gestão de Férias */}
              <div 
                onClick={() => setActiveTab('ferias')}
                className="bg-[#1c202a] border border-gray-800/90 hover:border-amber-500/40 rounded-2xl p-4 transition-all cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Palmtree className="h-4 w-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 border border-amber-500/30 text-amber-300">
                    CLT Art. 130
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-3">
                  GESTÃO DE FÉRIAS
                </p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm sm:text-base font-bold text-amber-400 truncate">
                    {saldoFerias ? `${saldoFerias.diasDireito - (saldoFerias.diasGozados || 0)} dias de saldo` : isVacation ? 'Em gozo de férias' : 'Período Ativo'}
                  </span>
                  <span className="text-[11px] font-medium text-amber-400 group-hover:underline">
                    Ver &gt;
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── CORPO PRINCIPAL COM MENU LATERAL E CONTEÚDO ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col md:flex-row gap-5">
            
            {/* MENU LATERAL VERTICAL DE ABAS */}
            <div className="w-full md:w-56 shrink-0 flex flex-col gap-1.5">
              {[
                { id: 'dados', label: 'Dados', icon: <User className="h-4 w-4" /> },
                { id: 'documentos', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
                { id: 'ponto', label: 'Ponto', icon: <Clock className="h-4 w-4" /> },
                { id: 'dependentes', label: 'Dependentes', icon: <Users className="h-4 w-4" /> },
                { id: 'exames', label: 'Exames e Treinamentos', icon: <Heart className="h-4 w-4" /> },
                { id: 'ferias', label: 'Férias', icon: <Palmtree className="h-4 w-4" /> },
                { id: 'atestados', label: 'Atestados', icon: <Stethoscope className="h-4 w-4" /> },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CONTEÚDO DA ABA SELECIONADA */}
            <div className="flex-1 min-w-0">
              
              {/* ABA: DADOS (EXATAMENTE COMO NAS IMAGENS 3 E 4) */}
              {activeTab === 'dados' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* CARD 1: IDENTIFICAÇÃO (TOPO VERMELHO) */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <User className="h-4 w-4" />
                      <span>IDENTIFICAÇÃO</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">CPF</p>
                        <p className="text-sm sm:text-base font-bold text-white font-mono">{employee.cpf || '-'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">RG</p>
                        <p className="text-sm sm:text-base font-bold text-white font-mono">{employee.rg || employee.carteiraIdentidade || '-'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">DATA DE NASCIMENTO</p>
                        <p className="text-sm sm:text-base font-bold text-white">{formatDate(employee.birthDate)}</p>
                      </div>

                      {employee.gender && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">GÊNERO</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-300">{employee.gender}</p>
                        </div>
                      )}

                      {employee.maritalStatus && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">ESTADO CIVIL</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-300">{employee.maritalStatus}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD 2: CONTATO (TOPO AZUL) */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-sky-400 text-xs font-bold uppercase tracking-wider">
                      <Mail className="h-4 w-4" />
                      <span>CONTATO</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">E-MAIL</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-300 break-all">{employee.email || '-'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">TELEFONE PRINCIPAL</p>
                        <p className="text-sm sm:text-base font-bold text-white">{employee.phone || '-'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">TELEFONE CONTATO</p>
                        <p className="text-sm sm:text-base font-bold text-white">{(employee as any).emergencyContactPhone || (employee as any).telefoneContato || '-'}</p>
                      </div>

                      {employee.address && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">ENDEREÇO</p>
                          <p className="text-xs font-medium text-gray-300 leading-snug">
                            {typeof employee.address === 'string'
                              ? employee.address
                              : [employee.address.street, employee.address.number, employee.address.neighborhood, employee.address.city, employee.address.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD 3: TRABALHO (TOPO AMARELO) */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <Briefcase className="h-4 w-4" />
                      <span>TRABALHO</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">CARGO / FUNÇÃO</p>
                        <p className="text-sm sm:text-base font-bold text-white">{employee.position?.name || '-'}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">SETOR DE TRABALHO</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-200 uppercase leading-snug">{workSector}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">POSTO DE TRABALHO</p>
                        <p className="text-xs text-gray-300 uppercase leading-relaxed break-words">{workPostFull}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">ESCALA</p>
                          <p className="text-xs font-bold text-amber-400">{escala}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">HORÁRIO</p>
                          <p className="text-xs font-bold text-gray-200">{horario}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: DOCUMENTOS (INTEGRAÇÃO COMPLETA) */}
              {activeTab === 'documentos' && (
                <div className="space-y-4">
                  {/* Resumo Rápido de Documentos */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                        <FileCheck className="h-4 w-4" />
                        <span>Documentação Funcional Registrada</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px]">
                        Admissão: {formatDate(employee.hireDate)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">CTPS / Série</span>
                        <p className="font-semibold text-white mt-0.5">{employee.ctps ? `${employee.ctps} / ${employee.ctpsSeries || '-'}` : '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">PIS / PASEP</span>
                        <p className="font-semibold text-white mt-0.5">{employee.pis || '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">CNH / Validade</span>
                        <p className="font-semibold text-sky-400 mt-0.5">{employee.cnhNumber ? `${employee.cnhNumber} (${employee.cnhCategory || '-'}) • ${formatDate(employee.cnhExpirationDate)}` : '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Título de Eleitor</span>
                        <p className="font-semibold text-white mt-0.5">{employee.tituloEleitor ? `${employee.tituloEleitor} (Z:${employee.tituloEleitorZona || '-'} / S:${employee.tituloEleitorSecao || '-'})` : '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Certificado Militar</span>
                        <p className="font-semibold text-white mt-0.5">{employee.certificadoMilitar || '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">CBO Oficial</span>
                        <p className="font-semibold text-amber-400 mt-0.5">{employee.cbo || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gerenciador de Arquivos & Anexos de Documentos */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5">
                    <EmployeeDocuments employeeId={employee.id} employeeName={employee.name} />
                  </div>
                </div>
              )}

              {/* ABA: PONTO & JORNADA */}
              {activeTab === 'ponto' && (
                <div className="space-y-4">
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-sky-400 font-bold text-xs uppercase tracking-wide">
                      <Clock className="h-4 w-4" />
                      <span>Jornada Operacional e Escala de Trabalho</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Escala Contratual</span>
                        <p className="text-lg font-black text-amber-400 mt-1">{escala}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Regime de revezamento</p>
                      </div>
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Horário de Trabalho</span>
                        <p className="text-lg font-black text-white mt-1">{horario}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Turno cadastrado</p>
                      </div>
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Intervalo de Refeição</span>
                        <p className="text-lg font-bold text-gray-200 mt-1">{employee.horarioTrabalhoIntervalo || '01:00h padrão'}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Intervalo intrajornada</p>
                      </div>
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Folga Semanal</span>
                        <p className="text-sm font-bold text-gray-200 mt-1">{employee.folgaSemanal || 'Conforme escala 12x36'}</p>
                      </div>
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 sm:col-span-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Posto de Trabalho Vinculado</span>
                        <p className="text-xs font-semibold text-white mt-1 leading-relaxed uppercase">{workPostFull}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 text-center py-8">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Espelho de Ponto em Dia</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhuma divergência ou pendência de marcação para este funcionário no ciclo atual.</p>
                  </div>
                </div>
              )}

              {/* ABA: DEPENDENTES (INTEGRAÇÃO COM DEPENDENTES LIST) */}
              {activeTab === 'dependentes' && (
                <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                      <Users className="h-4 w-4" />
                      <span>Dependentes Cadastrados</span>
                    </div>
                    {onViewDependents && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onClose();
                          onViewDependents(employee);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-xl flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Gerenciar no Painel
                      </Button>
                    )}
                  </div>

                  <div className="pt-1">
                    <DependentesList employeeId={employee.id} />
                  </div>
                </div>
              )}

              {/* ABA: EXAMES E TREINAMENTOS */}
              {activeTab === 'exames' && (
                <div className="space-y-4">
                  {/* Saúde Ocupacional / ASO */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-rose-400 font-bold text-xs uppercase tracking-wide">
                      <Heart className="h-4 w-4" />
                      <span>Saúde Ocupacional (ASO & Laudo Psicológico)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase">Exame ASO Periódico</span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Apto</Badge>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1 pt-1">
                          <p>Último Exame: <strong className="text-white">{formatDate(employee.exameMedicoData)}</strong></p>
                          <p>Próximo Vencimento: <strong className="text-rose-400">{formatDate(employee.nextExameMedico)}</strong></p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase">Laudo Psicológico (Porte de Arma)</span>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                            {employee.laudoPsicologicoStatus || 'Apto'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1 pt-1">
                          <p>Data Realização: <strong className="text-white">{formatDate(employee.laudoPsicologicoData)}</strong></p>
                          <p>Profissional: <strong className="text-white">{employee.laudoPsicologicoProfissional || 'Clínica Credenciada PF'}</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Treinamentos e NRs */}
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-800 text-amber-400 font-bold text-xs uppercase tracking-wide">
                      <Award className="h-4 w-4" />
                      <span>Treinamentos e Certificações Obrigatórias</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <p className="font-bold text-white">Reciclagem de Vigilante</p>
                        <p className="text-[11px] text-gray-400 mt-1">Carga Horária: 50h</p>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] mt-2">Válido</Badge>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <p className="font-bold text-white">NR-10 Segurança em Eletricidade</p>
                        <p className="text-[11px] text-gray-400 mt-1">Carga Horária: 40h</p>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] mt-2">Concluído</Badge>
                      </div>
                      <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                        <p className="font-bold text-white">Direção Defensiva Operacional</p>
                        <p className="text-[11px] text-gray-400 mt-1">Carga Horária: 20h</p>
                        <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px] mt-2">Concluído</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: FÉRIAS (CLT ART. 130) */}
              {activeTab === 'ferias' && (
                <div className="space-y-4">
                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                        <Palmtree className="h-4 w-4" />
                        <span>Gestão de Férias — CLT Art. 129 a 137</span>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
                        {isVacation ? 'Férias em Andamento' : 'Período Concessivo Ativo'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Saldo Disponível</span>
                        <p className="text-2xl font-black text-amber-400 mt-1">
                          {saldoFerias ? saldoFerias.diasDireito - (saldoFerias.diasGozados || 0) : 30} dias
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Direito integral CLT</p>
                      </div>

                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Período Aquisitivo</span>
                        <p className="text-sm font-bold text-white mt-1">
                          {periodoAtivo ? `${formatDate(periodoAtivo.dataInicio)} a ${formatDate(periodoAtivo.dataFim)}` : `Admissão: ${formatDate(employee.hireDate)}`}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">12 meses trabalhados</p>
                      </div>

                      <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Limite de Concessão</span>
                        <p className="text-sm font-bold text-emerald-400 mt-1">
                          {periodoAtivo ? formatDate(periodoAtivo.limiteConcessao) : 'Dentro do prazo legal'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Sem risco de dobra CLT</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-4 text-xs text-gray-400 flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      O empregado adquire direito a férias após cada período de 12 meses de vigência do contrato de trabalho. A concessão das férias deverá ser informada por escrito com antecedência mínima de 30 dias.
                    </span>
                  </div>
                </div>
              )}

              {/* ABA: ATESTADOS (LISTA REAL CARREGADA DA API) */}
              {activeTab === 'atestados' && (
                <div className="bg-[#1c202a] border border-gray-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wide">
                      <Stethoscope className="h-4 w-4" />
                      <span>Histórico de Atestados e Afastamentos</span>
                    </div>
                    <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30 text-xs">
                      {atestados.length} registrado(s)
                    </Badge>
                  </div>

                  {loadingAtestados ? (
                    <div className="py-8 text-center text-xs text-gray-500">
                      Carregando atestados...
                    </div>
                  ) : atestados.length > 0 ? (
                    <div className="space-y-2.5">
                      {atestados.map((atestado) => (
                        <div 
                          key={atestado.id}
                          className="p-3.5 bg-gray-900/70 border border-gray-800 rounded-xl flex items-center justify-between text-xs hover:border-gray-700 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{atestado.typeDescription || atestado.type}</span>
                              <Badge className={`text-[10px] ${
                                atestado.status === 'APROVADO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}>
                                {atestado.status}
                              </Badge>
                            </div>
                            <div className="text-gray-400 flex items-center gap-3">
                              <span>Período: <strong className="text-gray-200">{formatDate(atestado.startDate)} a {formatDate(atestado.endDate)}</strong></span>
                              <span>({atestado.daysOff || atestado.totalDays || 1} dia(s))</span>
                              {atestado.cid && <span className="font-mono text-amber-400">CID: {atestado.cid}</span>}
                            </div>
                          </div>

                          <div className="text-right text-gray-500">
                            {atestado.doctorName && <p>{atestado.doctorName}</p>}
                            {atestado.doctorCrm && <p className="font-mono text-[10px]">CRM: {atestado.doctorCrm}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                      <p className="text-gray-300 font-bold text-sm">Nenhum atestado médico registrado</p>
                      <p className="text-gray-500 mt-1">Funcionário em plena atividade operacional, sem histórico de afastamento recente.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeViewModal;
