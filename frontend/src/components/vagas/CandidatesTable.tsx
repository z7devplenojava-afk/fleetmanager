import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserPlus,
  Search,
  Filter,
  Calendar,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  Clock,
  FileText,
  User
} from 'lucide-react';
import { JobCandidate, CandidateStatus, CandidateStatusLabels, CandidateStatusColors } from '../../types/candidate';
import { candidateService } from '../../services/candidateService';
import { useToast } from '../../hooks/use-toast';

interface CandidatesTableProps {
  vacancyId?: string;
  vacancyTitle?: string;
}

export function CandidatesTable({ vacancyId, vacancyTitle }: CandidatesTableProps) {
  console.log('[DEBUG] CandidatesTable montado', { vacancyId, vacancyTitle });
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<JobCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'ALL'>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<{ status: CandidateStatus; notes: string }>({
    status: CandidateStatus.PENDING,
    notes: ''
  });
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; open: boolean }>({ type: 'approve', open: false });
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    console.log('[DEBUG] Modal de candidatos aberto para vacancyId:', vacancyId);
    if (vacancyId && !isValidUUID(vacancyId)) {
      setLoadError(true);
      toast({
        title: 'Erro',
        description: 'ID da vaga inválido. Não foi possível buscar candidatos.',
        variant: 'destructive'
      });
      return;
    }
    loadCandidates();
  }, [vacancyId]);

  // Função utilitária para validar UUID
  function isValidUUID(uuid: string) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  }

  useEffect(() => {
    filterCandidates();
  }, [candidates, searchTerm, statusFilter]);

  const loadCandidates = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      let data: JobCandidate[];
      
      if (vacancyId) {
        data = await candidateService.getCandidatesByVacancy(vacancyId);
        console.log('[DEBUG] Candidatos por vaga:', data);
      } else {
        data = await candidateService.getAllCandidates();
        console.log('[DEBUG] Todos os candidatos:', data);
      }
      
      setCandidates(data);
    } catch (error: any) {
      setLoadError(true);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar candidatos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCandidates = () => {
    let filtered = candidates;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.cpf.includes(searchTerm) ||
        candidate.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(candidate => candidate.status === statusFilter);
    }

    setFilteredCandidates(filtered);
  };

  const handleViewCandidate = (candidate: JobCandidate) => {
    setSelectedCandidate(candidate);
    setIsViewModalOpen(true);
  };

  const handleStatusUpdate = (candidate: JobCandidate) => {
    setSelectedCandidate(candidate);
    setStatusUpdate({ status: candidate.status, notes: candidate.notes || '' });
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedCandidate) return;

    try {
      await candidateService.updateCandidateStatus(selectedCandidate.id, statusUpdate);
      
      toast({
        title: 'Sucesso',
        description: 'Status do candidato atualizado com sucesso',
      });

      loadCandidates();
      setIsStatusModalOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do candidato',
        variant: 'destructive'
      });
    }
  };

  const handleQuickAction = async (candidate: JobCandidate, action: 'approve' | 'reject' | 'interview' | 'hire') => {
    try {
      switch (action) {
        case 'approve':
          await candidateService.approveCandidate(candidate.id);
          break;
        case 'reject':
          await candidateService.rejectCandidate(candidate.id);
          break;
        case 'interview':
          await candidateService.markAsInterviewed(candidate.id);
          break;
        case 'hire':
          await candidateService.hireCandidate(candidate.id);
          break;
      }

      toast({
        title: 'Sucesso',
        description: 'Ação realizada com sucesso',
      });

      loadCandidates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao realizar ação',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadCurriculum = async (candidate: JobCandidate) => {
    try {
      const blob = await candidateService.downloadCurriculum(candidate.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = candidate.curriculumFileName || 'curriculum.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao baixar currículo',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleConfirmAction = async () => {
    if (!selectedCandidate) return;
    try {
      if (actionModal.type === 'approve') {
        await candidateService.updateCandidateStatus(selectedCandidate.id, { status: CandidateStatus.APPROVED, notes: actionNotes });
        toast({ title: 'Sucesso', description: 'Candidato aprovado com sucesso!' });
      } else {
        await candidateService.updateCandidateStatus(selectedCandidate.id, { status: CandidateStatus.REJECTED, notes: actionNotes });
        toast({ title: 'Sucesso', description: 'Candidato reprovado com sucesso!' });
      }
      setActionModal({ ...actionModal, open: false });
      setActionNotes('');
      setIsViewModalOpen(false);
      loadCandidates();
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status do candidato', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (vacancyId && !isValidUUID(vacancyId)) {
    return (
      <div className="text-center text-gray-400 py-8">
        ID da vaga inválido. Não foi possível buscar candidatos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {vacancyTitle ? `Candidatos - ${vacancyTitle}` : 'Todos os Candidatos'}
          </h2>
          <p className="text-gray-400">
            {filteredCandidates.length} candidato(s) encontrado(s)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-white">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Nome, email, CPF ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-600 text-white"
              style={{ backgroundColor: '#1a1a1a' }}
            />
          </div>
        </div>

        <div className="sm:w-48">
          <Label htmlFor="status-filter" className="text-white">Status</Label>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CandidateStatus | 'ALL')}>
            <SelectTrigger className="border-gray-600 text-white" style={{ backgroundColor: '#1a1a1a' }}>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(CandidateStatusLabels).map(([status, label]) => (
                <SelectItem key={status} value={status}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-gray-600 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800">
              <TableHead className="text-white">Candidato</TableHead>
              <TableHead className="text-white">Vaga</TableHead>
              <TableHead className="text-white">Contato</TableHead>
              <TableHead className="text-white">Experiência</TableHead>
              <TableHead className="text-white">Pretensão</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Data</TableHead>
              <TableHead className="text-white">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-400 py-8">
                  Erro ao carregar candidatos. Tente novamente mais tarde.
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  Nenhum candidato cadastrado para esta vaga.
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id} className="border-gray-600 hover:bg-gray-800">
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-white">{candidate.name}</div>
                    <div className="text-sm text-gray-400">{candidate.cpf}</div>
                    {candidate.city && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {candidate.city}, {candidate.state}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-white">
                    {candidate.jobVacancyTitle}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm text-white flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {candidate.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {candidate.experienceYears !== undefined && (
                      <div className="text-sm text-white flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {candidate.experienceYears} anos
                      </div>
                    )}
                    {candidate.educationLevel && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {candidate.educationLevel}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {candidate.expectedSalary ? (
                    <div className="text-sm text-white flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(candidate.expectedSalary)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <Badge className={CandidateStatusColors[candidate.status]}>
                    {CandidateStatusLabels[candidate.status]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(candidate.createdAt)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCandidate(candidate)}
                      className="h-8 w-8 p-0 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {candidate.curriculumFileName && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadCurriculum(candidate)}
                        className="h-8 w-8 p-0 border-gray-600 text-white hover:bg-gray-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(candidate)}
                      className="h-8 w-8 p-0 border-gray-600 text-white hover:bg-gray-700"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-4xl sm:rounded-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6 border-gray-700">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-400" />
              Detalhes do Candidato
            </DialogTitle>
            <p className="text-sm text-gray-400">
              Informações completas da candidatura
            </p>
          </DialogHeader>
          
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-400" />
                  Informações Pessoais
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Nome</Label>
                    <p className="text-sm sm:text-base text-white font-medium break-words">{selectedCandidate.name}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">CPF</Label>
                    <p className="text-sm sm:text-base text-white font-mono">{selectedCandidate.cpf}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    <p className="text-sm sm:text-base text-white break-all">{selectedCandidate.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telefone
                    </Label>
                    <p className="text-sm sm:text-base text-white">{selectedCandidate.phone || '-'}</p>
                  </div>
                  
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Endereço
                    </Label>
                    <p className="text-sm sm:text-base text-white break-words">
                      {selectedCandidate.address || '-'}
                      {selectedCandidate.city && `, ${selectedCandidate.city} - ${selectedCandidate.state}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                  Informações Profissionais
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Vaga</Label>
                    <p className="text-sm sm:text-base text-white font-medium break-words">{selectedCandidate.jobVacancyTitle}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      Escolaridade
                    </Label>
                    <p className="text-sm sm:text-base text-white">{selectedCandidate.educationLevel || '-'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Experiência</Label>
                    <p className="text-sm sm:text-base text-white">{selectedCandidate.experienceYears || 0} anos</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Cargo Atual</Label>
                    <p className="text-sm sm:text-base text-white break-words">{selectedCandidate.currentPosition || '-'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Empresa Atual</Label>
                    <p className="text-sm sm:text-base text-white break-words">{selectedCandidate.currentCompany || '-'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Pretensão Salarial
                    </Label>
                    <p className="text-sm sm:text-base text-white font-medium">
                      {selectedCandidate.expectedSalary ? formatCurrency(selectedCandidate.expectedSalary) : '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Disponibilidade
                    </Label>
                    <p className="text-sm sm:text-base text-white">{selectedCandidate.availability || '-'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Status</Label>
                    <Badge className={`${CandidateStatusColors[selectedCandidate.status]} text-xs sm:text-sm`}>
                      {CandidateStatusLabels[selectedCandidate.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Currículo */}
              {selectedCandidate.curriculumFileName && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-400" />
                    Currículo
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base text-white font-medium truncate">{selectedCandidate.curriculumFileName}</p>
                        <p className="text-xs sm:text-sm text-gray-400">
                          {selectedCandidate.curriculumFileSize ? 
                            `${(selectedCandidate.curriculumFileSize / 1024 / 1024).toFixed(2)} MB` : 
                            'Tamanho não disponível'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleDownloadCurriculum(selectedCandidate)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Baixar
                    </Button>
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedCandidate.notes && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2">
                    Observações
                  </h3>
                  
                  <div className="p-3 sm:p-4 border border-gray-600 rounded-lg bg-gray-800/30">
                    <p className="text-sm sm:text-base text-white whitespace-pre-wrap break-words">{selectedCandidate.notes}</p>
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  Datas
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Data de Candidatura</Label>
                    <p className="text-sm sm:text-base text-white">{formatDate(selectedCandidate.createdAt)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm text-gray-400 font-medium">Última Atualização</Label>
                    <p className="text-sm sm:text-base text-white">{formatDate(selectedCandidate.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Ações de Aprovação/Reprovação */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  onClick={() => setActionModal({ type: 'approve', open: true })}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  Aprovar
                </Button>
                <Button
                  onClick={() => setActionModal({ type: 'reject', open: true })}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Reprovar
                </Button>
                <Button
                  disabled
                  className="bg-gray-600 text-white flex-1 opacity-50 cursor-not-allowed"
                  title="Em breve: Standby"
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Standby
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Atualização de Status */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-md sm:rounded-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6 border-gray-700">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-400" />
              Atualizar Status
            </DialogTitle>
            <p className="text-sm text-gray-400">
              Altere o status e adicione observações sobre o candidato
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm sm:text-base text-white font-medium">Status</Label>
              <Select 
                value={statusUpdate.status} 
                onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value as CandidateStatus }))}
              >
                <SelectTrigger className="border-gray-600 text-white text-sm sm:text-base" style={{ backgroundColor: '#1a1a1a' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CandidateStatusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm sm:text-base text-white font-medium">Observações</Label>
              <Textarea
                id="notes"
                value={statusUpdate.notes}
                onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                className="border-gray-600 text-white"
                style={{ backgroundColor: '#1a1a1a' }}
                rows={3}
                placeholder="Adicione observações sobre o candidato..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                className="border-gray-600 text-white hover:bg-gray-700 text-sm sm:text-base px-4 py-2 h-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStatusSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 py-2 h-auto order-1 sm:order-2"
              >
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ação (Aprovar/Reprovar) */}
      <Dialog open={actionModal.open} onOpenChange={() => setActionModal({ ...actionModal, open: false })}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-md sm:rounded-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6 border-gray-700">
          <DialogHeader className="pb-4">
            <DialogTitle>{actionModal.type === 'approve' ? 'Aprovar Candidato' : 'Reprovar Candidato'}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={actionNotes}
            onChange={e => setActionNotes(e.target.value)}
            placeholder="Digite uma observação (obrigatório)"
            className="mb-4"
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal({ ...actionModal, open: false })}>Cancelar</Button>
            <Button
              onClick={handleConfirmAction}
              disabled={!actionNotes.trim()}
              className={actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 