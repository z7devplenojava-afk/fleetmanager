import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  RefreshCw, 
  Plus, 
  User, 
  Building2, 
  Stethoscope, 
  GraduationCap, 
  Printer, 
  FileDown, 
  CheckCircle2, 
  AlertCircle,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { sstService, MedicalExam } from '@/services/sstService';
import { medicalExamPDFGenerator } from '@/utils/medicalExamPdfGenerator';
import { useAuth } from '@/contexts/AuthContext';
import MedicalExamFormModal from '@/components/sst/MedicalExamFormModal';

export const SstAgendamentosTab: React.FC = () => {
  const { toast } = useToast();
  const { empresa } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sstService.getMedicalExams();
      setExams(data || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Filtrar apenas agendamentos (status PENDENTE ou exames com data agendada)
  const scheduledExams = useMemo(() => {
    return exams.filter((e) => {
      // Priorizar os agendados / pendentes de realização
      return e.scheduledDate != null;
    });
  }, [exams]);

  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let admissionals = 0;
    let periodics = 0;

    scheduledExams.forEach((e) => {
      if (e.status === 'PENDENTE' || !e.status) pending++;
      else if (e.status === 'REALIZADO') completed++;

      const cat = String(e.examCategory || '').toUpperCase();
      if (cat.includes('ADMISSIONAL')) admissionals++;
      else if (cat.includes('PERIODICO')) periodics++;
    });

    return { total: scheduledExams.length, pending, completed, admissionals, periodics };
  }, [scheduledExams]);

  const filteredExams = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return scheduledExams.filter((e) => {
      if (term) {
        const matches =
          (e.employeeName || '').toLowerCase().includes(term) ||
          (e.examType || '').toLowerCase().includes(term) ||
          (e.clinicName || '').toLowerCase().includes(term) ||
          (e.doctorName || '').toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (categoryFilter !== 'ALL') {
        const cat = String(e.examCategory || '').toUpperCase();
        if (categoryFilter === 'ADMISSIONAL' && !cat.includes('ADMISSIONAL')) return false;
        if (categoryFilter === 'PERIODICO' && !cat.includes('PERIODICO')) return false;
        if (categoryFilter === 'RETORNO' && !cat.includes('RETORNO')) return false;
        if (categoryFilter === 'DEMISSIONAL' && !cat.includes('DEMISSIONAL')) return false;
      }

      return true;
    });
  }, [scheduledExams, searchTerm, categoryFilter]);

  const handlePrintPdf = async (exam: MedicalExam) => {
    try {
      setGeneratingPdfId(exam.id);
      await medicalExamPDFGenerator.generateAndDownload(
        {
          exam: {
            id: exam.id,
            employeeName: exam.employeeName,
            employeeRegistrationNumber: exam.employeeRegistrationNumber,
            employeeCpf: exam.employeeCpf,
            employeeRole: exam.employeeRole,
            employeeDepartment: exam.employeeDepartment,
            examType: exam.examType,
            examCategory: exam.examCategory,
            scheduledDate: exam.scheduledDate,
            clinicName: exam.clinicName,
            clinicAddress: exam.clinicAddress,
            clinicPhone: exam.clinicPhone,
            clinicCnpj: exam.clinicCnpj,
            doctorName: exam.doctorName,
            doctorCrm: exam.doctorCrm,
            notes: exam.notes,
            additionalExams: exam.additionalExams,
          },
          company: empresa
            ? {
                name: empresa.nome || 'Viação São Silvestre S.A.',
                cnpj: empresa.cnpj,
                address: empresa.endereco,
                phone: empresa.telefone,
                email: empresa.email,
                logoUrl: empresa.logoUrl,
              }
            : undefined,
        },
        `Encaminhamento_ASO_${exam.employeeName.replace(/\s+/g, '_')}.pdf`
      );
      toast({
        title: 'Encaminhamento Gerado',
        description: 'Guia de encaminhamento baixada em PDF.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar guia',
        description: err?.message || 'Falha na geração do PDF.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  function renderCategoryBadge(cat?: string) {
    const c = String(cat || '').toUpperCase();
    if (c.includes('ADMISSIONAL')) {
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">Admissional</Badge>;
    }
    if (c.includes('PERIODICO')) {
      return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Periódico</Badge>;
    }
    if (c.includes('RETORNO')) {
      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">Retorno ao Trabalho</Badge>;
    }
    if (c.includes('DEMISSIONAL')) {
      return <Badge className="bg-red-500/20 text-red-300 border-red-500/40">Demissional</Badge>;
    }
    return <Badge variant="outline">{cat || 'Ocupacional'}</Badge>;
  }

  return (
    <div className="space-y-4">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total de Agendamentos</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
              <p className="text-[11px] text-slate-500">Exames programados</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium">Aguardando Realização</p>
              <h3 className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</h3>
              <p className="text-[11px] text-slate-500">Encaminhados à clínica</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 font-medium">Admissões em Curso</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{stats.admissionals}</h3>
              <p className="text-[11px] text-slate-500">Exames admissionais</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-medium">Periódicos de Rotina</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.periodics}</h3>
              <p className="text-[11px] text-slate-500">Renovação de ASO</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Novo Agendamento */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por colaborador, clínica médica ou médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadExams}
                disabled={loading}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Novo Agendamento
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 whitespace-nowrap">Tipo de Exame:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-slate-950/60 border-slate-700 text-slate-200 h-9 max-w-xs">
                <SelectValue placeholder="Tipo de Exame" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="ADMISSIONAL">Admissional</SelectItem>
                <SelectItem value="PERIODICO">Periódico</SelectItem>
                <SelectItem value="RETORNO">Retorno ao Trabalho</SelectItem>
                <SelectItem value="DEMISSIONAL">Demissional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Agendamentos */}
      <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/80 border-b border-slate-800">
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-300 font-semibold">Data & Horário</TableHead>
                <TableHead className="text-slate-300 font-semibold">Colaborador</TableHead>
                <TableHead className="text-slate-300 font-semibold">Tipo / Procedimento</TableHead>
                <TableHead className="text-slate-300 font-semibold">Clínica / Médico</TableHead>
                <TableHead className="text-slate-300 font-semibold text-center">Status</TableHead>
                <TableHead className="text-slate-300 font-semibold text-right">Encaminhamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="border-slate-800/60">
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-28" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-36" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-36" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-20 mx-auto" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-800 rounded animate-pulse w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Calendar className="h-10 w-10 text-slate-500 mb-2" />
                      <p className="font-semibold text-slate-200">Nenhum agendamento encontrado</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchTerm || categoryFilter !== 'ALL'
                          ? 'Ajuste os filtros para visualizar outros agendamentos.'
                          : 'Clique em "Novo Agendamento" para programar um exame ocupacional.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExams.map((exam) => (
                  <TableRow key={exam.id} className="border-slate-800/60 hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs text-white">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {exam.scheduledDate
                            ? new Date(exam.scheduledDate).toLocaleDateString('pt-BR')
                            : 'A definir'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-white">
                      <div>
                        <span>{exam.employeeName}</span>
                        {exam.employeeRegistrationNumber && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            Mat: {exam.employeeRegistrationNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div>{renderCategoryBadge(exam.examCategory)}</div>
                        <p className="text-[11px] text-slate-400">{exam.examType}</p>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-300">
                      <div>
                        <p className="font-medium">{exam.clinicName || 'Clínica Externa'}</p>
                        {exam.doctorName && (
                          <p className="text-[11px] text-slate-400">Dr(a): {exam.doctorName}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={exam.status === 'REALIZADO' ? 'default' : 'outline'}
                        className={
                          exam.status === 'REALIZADO'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }
                      >
                        {exam.status === 'REALIZADO' ? 'Realizado' : 'Agendado'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={generatingPdfId === exam.id}
                        onClick={() => handlePrintPdf(exam)}
                        className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 text-xs"
                      >
                        {generatingPdfId === exam.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Printer className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        )}
                        Guia PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Agendamento */}
      <MedicalExamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadExams();
        }}
      />
    </div>
  );
};
