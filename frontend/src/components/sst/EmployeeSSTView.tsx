import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  User,
  Users,
  FileText,
  Stethoscope,
  GraduationCap,
  HardHat,
  FileCheck,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Shield,
  Eye,
  Phone,
  Mail,
  CreditCard,
  Building,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import employeeService, { Employee } from '@/services/employeeService';
import { documentService, Document } from '@/services/documentService';
import { sstService, MedicalExam, TrainingParticipation } from '@/services/sstService';
import { epiDeliveryFormService, EPIDeliveryForm } from '@/services/epiDeliveryFormService';
import { EpiDeliveryModal } from './EpiDeliveryModal';

export const EmployeeSSTView: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados de lista e seleção de funcionários
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Sub-aba ativa no perfil do colaborador
  const [activeSubTab, setActiveSubTab] = useState<'docs' | 'exams' | 'trainings' | 'epis' | 'fichas'>('docs');

  // Estados de dados do colaborador selecionado
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [medicalExams, setMedicalExams] = useState<MedicalExam[]>([]);
  const [trainings, setTrainings] = useState<TrainingParticipation[]>([]);
  const [epiForms, setEpiForms] = useState<EPIDeliveryForm[]>([]);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [isEpiDeliveryModalOpen, setIsEpiDeliveryModalOpen] = useState(false);

  // Carregar lista de colaboradores ao montar
  useEffect(() => {
    loadEmployees();
  }, []);

  // Quando o colaborador selecionado mudar, carregar seus registros completos
  useEffect(() => {
    if (selectedEmployee?.id) {
      loadEmployeeSSTData(selectedEmployee.id);
    } else {
      setDocuments([]);
      setMedicalExams([]);
      setTrainings([]);
      setEpiForms([]);
    }
  }, [selectedEmployee?.id]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data || []);
      // Selecionar o primeiro automaticamente se houver e nenhum selecionado
      if (data && data.length > 0 && !selectedEmployee) {
        setSelectedEmployee(data[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de funcionários:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os funcionários.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadEmployeeSSTData = async (employeeId: string) => {
    setLoadingDetails(true);
    try {
      const [docsData, examsData, trainingsData, epiFormsData] = await Promise.all([
        documentService.getDocumentsByEmployee(employeeId).catch(() => []),
        sstService.getMedicalExamsByEmployee(employeeId).catch(() => []),
        sstService.getTrainingParticipationsByEmployee(employeeId).catch(() => []),
        epiDeliveryFormService.getByEmployeeId(employeeId).catch(() => []),
      ]);

      setDocuments(docsData || []);
      setMedicalExams(examsData || []);
      setTrainings(trainingsData || []);
      setEpiForms(epiFormsData || []);
    } catch (err) {
      console.error('Erro ao carregar detalhes de SST do funcionário:', err);
      toast({
        title: 'Aviso',
        description: 'Alguns registros de SST do funcionário não puderam ser carregados.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filtragem dos funcionários
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.cpf && emp.cpf.includes(searchTerm)) ||
        (emp.registrationNumber && emp.registrationNumber.includes(searchTerm)) ||
        (emp.positionDescription && emp.positionDescription.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && (!emp.status || emp.status === 'ACTIVE' || emp.status === 'ATIVO')) ||
        (statusFilter === 'INACTIVE' && (emp.status === 'INACTIVE' || emp.status === 'INATIVO' || emp.status === 'DEMITIDO'));

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  // Consolidar todos os EPIs entregues através das fichas
  const deliveredEPIs = useMemo(() => {
    const list: Array<{
      id: string;
      epiName: string;
      quantity: number;
      ca?: string;
      caName?: string;
      deliveryDate: string;
      validityDate?: string;
      responsible?: string;
      observations?: string;
    }> = [];

    epiForms.forEach((form) => {
      if (form.items && form.items.length > 0) {
        form.items.forEach((item, idx) => {
          list.push({
            id: `${form.id}-${idx}`,
            epiName: item.epiName || 'EPI não especificado',
            quantity: item.quantity || 1,
            ca: item.ca,
            caName: item.caName,
            deliveryDate: form.deliveryDate,
            validityDate: item.validityDate,
            responsible: form.responsibleEmployeeName || form.createdByName,
            observations: item.observations,
          });
        });
      }
    });

    return list;
  }, [epiForms]);

  // Download do PDF da Ficha de EPI
  const handleDownloadEpiPdf = async (formId: string) => {
    try {
      setDownloadingPdfId(formId);
      const blob = await epiDeliveryFormService.downloadPdf(formId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-epi-${selectedEmployee?.name || 'colaborador'}-${formId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.parentNode?.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Download concluído',
        description: 'O PDF da Ficha de EPI foi baixado com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o PDF da ficha de EPI.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Download da Ficha de Registro do Empregado
  const handleDownloadEmployeeRecord = async () => {
    if (!selectedEmployee) return;
    try {
      setDownloadingPdfId('employee-record');
      const blob = await employeeService.generateEmployeeRecordPdf(selectedEmployee.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-registro-${selectedEmployee.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.parentNode?.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Ficha Gerada',
        description: 'A Ficha de Registro do funcionário foi baixada.',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF da ficha de registro.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Layout Mestre - Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Lista de Funcionários com Busca */}
        <Card className="lg:col-span-4 bg-seguranca-graphite border-gray-600 shadow-lg">
          <CardHeader className="pb-3 border-b border-gray-700/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-seguranca-lightgray flex items-center gap-2">
                <Users className="h-5 w-5 text-seguranca-yellow" />
                Funcionários
              </CardTitle>
              <Badge variant="outline" className="border-gray-500 text-xs text-gray-300">
                {filteredEmployees.length} de {employees.length}
              </Badge>
            </div>

            {/* Input de Busca */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF, cargo ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-seguranca-black/60 border-gray-600 text-white text-xs h-9 focus-visible:ring-seguranca-red"
              />
            </div>

            {/* Filtros Rápidos de Status */}
            <div className="flex items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-seguranca-red text-white'
                    : 'bg-seguranca-black/40 text-gray-400 hover:text-white'
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-seguranca-red text-white'
                    : 'bg-seguranca-black/40 text-gray-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-seguranca-red text-white'
                    : 'bg-seguranca-black/40 text-gray-400 hover:text-white'
                }`}
              >
                Inativos
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-2 max-h-[650px] overflow-y-auto space-y-1.5">
            {loadingEmployees ? (
              <div className="py-12 text-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                <span className="text-xs">Carregando colaboradores...</span>
              </div>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-seguranca-red/15 border-seguranca-red text-white shadow-sm'
                        : 'bg-seguranca-black/40 border-gray-700/60 hover:bg-seguranca-black/70 hover:border-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-seguranca-red text-white' : 'bg-gray-700 text-gray-200'
                          }`}
                        >
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate leading-snug">{emp.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {emp.positionDescription || 'Função não informada'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {emp.registrationNumber && (
                          <span className="text-[10px] font-mono text-gray-400 block">
                            #{emp.registrationNumber}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            emp.status === 'INACTIVE' || emp.status === 'INATIVO'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {emp.status === 'INACTIVE' || emp.status === 'INATIVO' ? 'Inativo' : 'Ativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-500 text-xs">
                Nenhum funcionário encontrado com os filtros atuais.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel Direito: Detalhes do Colaborador Selecionado */}
        <div className="lg:col-span-8 space-y-4">
          {selectedEmployee ? (
            <>
              {/* Card de Identificação do Colaborador & Ações Rápidas */}
              <Card className="bg-seguranca-graphite border-gray-600 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-seguranca-red flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0">
                        {selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-white tracking-tight">
                            {selectedEmployee.name}
                          </h2>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                            {selectedEmployee.status === 'INACTIVE' ? 'Inativo' : 'Ativo no SST'}
                          </Badge>
                          {selectedEmployee.registrationNumber && (
                            <Badge variant="outline" className="border-gray-500 text-gray-300 text-[10px]">
                              Matrícula: {selectedEmployee.registrationNumber}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">Cargo: <strong>{selectedEmployee.positionDescription || 'N/D'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>CPF: <strong className="font-mono">{selectedEmployee.cpf || selectedEmployee.document || 'N/D'}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>Admissão: <strong>{selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('pt-BR') : 'N/D'}</strong></span>
                          </div>
                          {selectedEmployee.cnhNumber && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 font-bold text-[10px]">CNH:</span>
                              <span className="font-mono">{selectedEmployee.cnhNumber} ({selectedEmployee.cnhCategory || 'B'})</span>
                            </div>
                          )}
                          {selectedEmployee.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{selectedEmployee.phone}</span>
                            </div>
                          )}
                          {selectedEmployee.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{selectedEmployee.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEpiDeliveryModalOpen(true)}
                        className="text-xs border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 h-8"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5 text-seguranca-yellow" />
                        Ficha Registro (PDF)
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => navigate('/rh/sst/exames')}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                      >
                        <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                        Novo Exame ASO
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => navigate('/rh/sst/epis')}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-8"
                      >
                        <HardHat className="h-3.5 w-3.5 mr-1.5" />
                        Entregar EPI
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-Abas do Colaborador: Documentos, Exames, Treinamentos, EPIs, Ficha de EPI */}
              <Tabs value={activeSubTab} onValueChange={(val: any) => setActiveSubTab(val)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 bg-seguranca-graphite border-gray-600 p-1 rounded-xl">
                  <TabsTrigger
                    value="docs"
                    className="text-xs text-seguranca-lightgray data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex items-center gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Documentos ({documents.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="exams"
                    className="text-xs text-seguranca-lightgray data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex items-center gap-1.5"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    Exames / ASO ({medicalExams.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="trainings"
                    className="text-xs text-seguranca-lightgray data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex items-center gap-1.5"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Treinamentos ({trainings.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="epis"
                    className="text-xs text-seguranca-lightgray data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex items-center gap-1.5"
                  >
                    <HardHat className="h-3.5 w-3.5" />
                    EPIs ({deliveredEPIs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="fichas"
                    className="text-xs text-seguranca-lightgray data-[state='active']:bg-seguranca-red data-[state='active']:text-white flex items-center gap-1.5"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    Fichas de EPI ({epiForms.length})
                  </TabsTrigger>
                </TabsList>

                {/* Sub-Aba 1: Documentos */}
                <TabsContent value="docs" className="mt-4">
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="py-3 px-4 border-b border-gray-700/60 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Documentos Pessoais e Ocupacionais
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Documentação legal cadastrada no prontuário do colaborador
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingDetails ? (
                        <div className="py-12 text-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                          <span className="text-xs">Carregando documentos...</span>
                        </div>
                      ) : documents.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-seguranca-black/40">
                            <TableRow className="border-gray-700">
                              <TableHead className="text-xs text-gray-300">Tipo de Documento</TableHead>
                              <TableHead className="text-xs text-gray-300">Número / Identificador</TableHead>
                              <TableHead className="text-xs text-gray-300">Emissão</TableHead>
                              <TableHead className="text-xs text-gray-300">Validade</TableHead>
                              <TableHead className="text-xs text-gray-300 text-right">Arquivo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((doc) => {
                              const isExpired = doc.expirationDate && new Date(doc.expirationDate) < new Date();
                              return (
                                <TableRow key={doc.id} className="border-gray-700/60 hover:bg-seguranca-black/30">
                                  <TableCell className="text-xs font-semibold text-white">
                                    {doc.type}
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-gray-300">
                                    {doc.number || '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-400">
                                    {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('pt-BR') : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {doc.expirationDate ? (
                                      <Badge
                                        className={
                                          isExpired
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                                        }
                                      >
                                        {new Date(doc.expirationDate).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-500 text-xs">Sem vencimento</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    {doc.fileUrl ? (
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Visualizar
                                      </a>
                                    ) : (
                                      <span className="text-gray-500 text-xs">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          Nenhum documento anexado ao prontuário deste colaborador.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-Aba 2: Exames Médicos / ASO */}
                <TabsContent value="exams" className="mt-4">
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="py-3 px-4 border-b border-gray-700/60 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-emerald-400" />
                          Histórico de Exames Ocupacionais (ASO)
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Controle de Atestados de Saúde Ocupacional (NR-07)
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/rh/sst/exames')}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agendar Exame
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingDetails ? (
                        <div className="py-12 text-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                          <span className="text-xs">Carregando exames ASO...</span>
                        </div>
                      ) : medicalExams.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-seguranca-black/40">
                            <TableRow className="border-gray-700">
                              <TableHead className="text-xs text-gray-300">Tipo de Exame</TableHead>
                              <TableHead className="text-xs text-gray-300">Data Realização</TableHead>
                              <TableHead className="text-xs text-gray-300">Validade</TableHead>
                              <TableHead className="text-xs text-gray-300">Clínica / Médico</TableHead>
                              <TableHead className="text-xs text-gray-300 text-right">Resultado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {medicalExams.map((exam) => {
                              const isExpired = exam.expirationDate && new Date(exam.expirationDate) < new Date();
                              return (
                                <TableRow key={exam.id} className="border-gray-700/60 hover:bg-seguranca-black/30">
                                  <TableCell className="text-xs font-semibold text-white">
                                    {exam.examType || 'Exame Periódico'}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-300">
                                    {exam.examDate ? new Date(exam.examDate).toLocaleDateString('pt-BR') : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {exam.expirationDate ? (
                                      <Badge
                                        className={
                                          isExpired
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]'
                                        }
                                      >
                                        {new Date(exam.expirationDate).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    ) : (
                                      '—'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-400">
                                    <div>{exam.clinicName || 'Clínica Ocupacional'}</div>
                                    {exam.doctorName && (
                                      <div className="text-[10px] text-gray-500">Dr(a). {exam.doctorName} {exam.doctorCrm ? `(${exam.doctorCrm})` : ''}</div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    <Badge
                                      className={
                                        exam.result === 'APTO'
                                          ? 'bg-emerald-500 text-white text-[10px]'
                                          : exam.result === 'INAPTO'
                                          ? 'bg-rose-600 text-white text-[10px]'
                                          : 'bg-amber-500 text-white text-[10px]'
                                      }
                                    >
                                      {exam.result || 'APTO'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          Nenhum exame médico ocupacional registrado para este colaborador.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-Aba 3: Treinamentos */}
                <TabsContent value="trainings" className="mt-4">
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="py-3 px-4 border-b border-gray-700/60 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-purple-400" />
                          Treinamentos e Certificações SST
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Normas Regulamentadoras (NR-10, NR-35, CIPA, Brigada de Incêndio, etc.)
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/rh/sst/treinamentos')}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Novo Treinamento
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingDetails ? (
                        <div className="py-12 text-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                          <span className="text-xs">Carregando treinamentos...</span>
                        </div>
                      ) : trainings.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-seguranca-black/40">
                            <TableRow className="border-gray-700">
                              <TableHead className="text-xs text-gray-300">Treinamento / Norma</TableHead>
                              <TableHead className="text-xs text-gray-300">Carga Horária</TableHead>
                              <TableHead className="text-xs text-gray-300">Conclusão</TableHead>
                              <TableHead className="text-xs text-gray-300">Validade</TableHead>
                              <TableHead className="text-xs text-gray-300 text-right">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {trainings.map((t) => {
                              const isExpired = t.expirationDate && new Date(t.expirationDate) < new Date();
                              return (
                                <TableRow key={t.id} className="border-gray-700/60 hover:bg-seguranca-black/30">
                                  <TableCell className="text-xs font-semibold text-white">
                                    {t.trainingName || 'Treinamento SST'}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-300">
                                    {t.hours ? `${t.hours}h` : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-400">
                                    {t.completionDate ? new Date(t.completionDate).toLocaleDateString('pt-BR') : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {t.expirationDate ? (
                                      <Badge
                                        className={
                                          isExpired
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]'
                                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]'
                                        }
                                      >
                                        {new Date(t.expirationDate).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    ) : (
                                      '—'
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-right">
                                    <Badge
                                      className={
                                        t.status === 'COMPLETED' || t.status === 'CONCLUIDO'
                                          ? 'bg-emerald-600 text-white text-[10px]'
                                          : 'bg-amber-600 text-white text-[10px]'
                                      }
                                    >
                                      {t.status === 'COMPLETED' || t.status === 'CONCLUIDO' ? 'Concluído' : t.status || 'Ativo'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          Nenhum treinamento registrado para este funcionário.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-Aba 4: EPIs Entregues */}
                <TabsContent value="epis" className="mt-4">
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="py-3 px-4 border-b border-gray-700/60 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <HardHat className="h-4 w-4 text-blue-400" />
                          Equipamentos de Proteção Individual (EPIs) Entregues
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Controle de itens fornecidos e Certificados de Aprovação (CA)
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/rh/sst/epis')}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Nova Entrega
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingDetails ? (
                        <div className="py-12 text-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                          <span className="text-xs">Carregando EPIs entregues...</span>
                        </div>
                      ) : deliveredEPIs.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-seguranca-black/40">
                            <TableRow className="border-gray-700">
                              <TableHead className="text-xs text-gray-300">Descrição do EPI</TableHead>
                              <TableHead className="text-xs text-gray-300">Certificado de Aprovação (CA)</TableHead>
                              <TableHead className="text-xs text-gray-300">Qtd</TableHead>
                              <TableHead className="text-xs text-gray-300">Data de Entrega</TableHead>
                              <TableHead className="text-xs text-gray-300">Validade do CA</TableHead>
                              <TableHead className="text-xs text-gray-300 text-right">Responsável</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deliveredEPIs.map((epi) => (
                              <TableRow key={epi.id} className="border-gray-700/60 hover:bg-seguranca-black/30">
                                <TableCell className="text-xs font-semibold text-white">
                                  {epi.epiName}
                                  {epi.observations && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">{epi.observations}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {epi.ca ? (
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] font-mono">
                                      CA {epi.ca}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-500 text-xs">Sem CA</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs font-bold text-gray-200">
                                  {epi.quantity}
                                </TableCell>
                                <TableCell className="text-xs text-gray-300">
                                  {epi.deliveryDate ? new Date(epi.deliveryDate).toLocaleDateString('pt-BR') : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-400">
                                  {epi.validityDate ? new Date(epi.validityDate).toLocaleDateString('pt-BR') : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-400 text-right">
                                  {epi.responsible || 'Almoxarifado'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          Nenhum EPI entregue registrado para este funcionário.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sub-Aba 5: Fichas de EPI */}
                <TabsContent value="fichas" className="mt-4">
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader className="py-3 px-4 border-b border-gray-700/60 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-seguranca-yellow" />
                          Fichas Formais de Entrega de EPI
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          Documentos com termo de responsabilidade, lista de itens e assinatura
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsEpiDeliveryModalOpen(true)}
                        className="text-xs bg-seguranca-red hover:bg-seguranca-darkred text-white h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Gerar Nova Ficha
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingDetails ? (
                        <div className="py-12 text-center text-gray-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-seguranca-yellow" />
                          <span className="text-xs">Carregando fichas de EPI...</span>
                        </div>
                      ) : epiForms.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-seguranca-black/40">
                            <TableRow className="border-gray-700">
                              <TableHead className="text-xs text-gray-300">Identificador da Ficha</TableHead>
                              <TableHead className="text-xs text-gray-300">Data de Entrega</TableHead>
                              <TableHead className="text-xs text-gray-300">Itens Fornecidos</TableHead>
                              <TableHead className="text-xs text-gray-300">Responsável pela Entrega</TableHead>
                              <TableHead className="text-xs text-gray-300 text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {epiForms.map((form) => (
                              <TableRow key={form.id} className="border-gray-700/60 hover:bg-seguranca-black/30">
                                <TableCell className="text-xs font-mono font-bold text-white">
                                  #{form.id.substring(0, 8)}
                                </TableCell>
                                <TableCell className="text-xs text-gray-300">
                                  {form.deliveryDate ? new Date(form.deliveryDate).toLocaleDateString('pt-BR') : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-gray-300">
                                  <Badge variant="outline" className="border-gray-500 text-gray-300 text-[10px]">
                                    {form.items ? `${form.items.length} item(ns)` : '0 itens'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-gray-400">
                                  {form.responsibleEmployeeName || form.createdByName || '—'}
                                </TableCell>
                                <TableCell className="text-xs text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadEpiPdf(form.id)}
                                    disabled={downloadingPdfId === form.id}
                                    className="h-7 text-xs border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                                    title="Baixar PDF da Ficha de EPI assinada"
                                  >
                                    {downloadingPdfId === form.id ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <Download className="h-3.5 w-3.5 mr-1 text-seguranca-yellow" />
                                    )}
                                    Baixar PDF
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="py-10 text-center text-gray-400 text-xs">
                          Nenhuma ficha de entrega de EPI registrada para este funcionário.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="bg-seguranca-graphite border-gray-600 p-12 text-center text-gray-400">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">Nenhum funcionário selecionado</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                Selecione um funcionário na lista à esquerda para consultar todo o prontuário de SST, exames ASO, treinamentos e EPIs.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Completo de Ficha de EPI (Preenchida / Manual, Paisagem / Retrato, Assinatura Digital) */}
      <EpiDeliveryModal
        isOpen={isEpiDeliveryModalOpen}
        onClose={() => setIsEpiDeliveryModalOpen(false)}
        employee={selectedEmployee}
        onSuccess={() => {
          if (selectedEmployee?.id) {
            loadEmployeeSSTData(selectedEmployee.id);
          }
        }}
      />
    </div>
  );
};

export default EmployeeSSTView;
