import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  FileHeart,
  Calendar,
  Clock,
  User,
  Stethoscope,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { employeeService, Employee } from '@/services/employeeService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import medicalCertificateService, {
  MedicalCertificate,
  MedicalCertificateType,
  MedicalCertificateStatus,
  MEDICAL_CERTIFICATE_TYPE_LABELS,
  MEDICAL_CERTIFICATE_TYPE_COLORS,
  Cid10DTO,
} from '@/services/medicalCertificateService';

interface MedicalCertificateModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
  certificate?: MedicalCertificate | null;
}

export const MedicalCertificateModal: React.FC<MedicalCertificateModalProps> = ({
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess,
  certificate,
}) => {
  const isModalOpen = open !== undefined ? open : (isOpen ?? false);
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };
  const { toast } = useToast();
  const isEdit = Boolean(certificate?.id);

  // Estados do formulário
  const [employeeId, setEmployeeId] = useState<string>('');
  const [type, setType] = useState<MedicalCertificateType>('ATESTADO_AFASTAMENTO');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [daysCount, setDaysCount] = useState<number>(1);
  const [isPartialDay, setIsPartialDay] = useState<boolean>(false);
  const [absenceHours, setAbsenceHours] = useState<number>(8);

  // CID
  const [cidQuery, setCidQuery] = useState<string>('');
  const [cidCode, setCidCode] = useState<string>('');
  const [cidDescription, setCidDescription] = useState<string>('');
  const [cidSuggestions, setCidSuggestions] = useState<Cid10DTO[]>([]);
  const [isSearchingCid, setIsSearchingCid] = useState<boolean>(false);
  const [showCidDropdown, setShowCidDropdown] = useState<boolean>(false);
  const cidContainerRef = useRef<HTMLDivElement>(null);

  // Dados Médicos
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctorCrm, setDoctorCrm] = useState<string>('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('');

  // Anexo
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Observações & Status
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<MedicalCertificateStatus>('APROVADO');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Carregar lista de colaboradores para o SearchableSelect
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['employees-all-select'],
    queryFn: () => employeeService.getAllEmployees(),
    staleTime: 60_000,
    enabled: isModalOpen,
  });

  // Mapear colaboradores para opções pesquisáveis (busca a partir de 3 caracteres)
  const employeeOptions = useMemo<SearchableOption[]>(() => {
    return employees.map((emp) => {
      const name = emp.name || emp.fullName || 'Colaborador';
      const cargo = emp.position?.name || emp.positionDescription || emp.cargo || 'Cargo não informado';
      const reg = emp.registrationNumber || emp.matricula || '';
      const doc = emp.cpf || emp.document || '';
      const workPost = emp.workPost?.name || emp.postoTrabalho || '';

      return {
        value: emp.id,
        label: name,
        subtitle: `${cargo}${workPost ? ` • ${workPost}` : ''}${reg ? ` (Matrícula: ${reg})` : ''}`,
        badge: reg ? `#${reg}` : undefined,
        badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        keywords: [name, reg, doc, cargo, workPost].filter(Boolean) as string[],
      };
    });
  }, [employees]);

  // Inicializar dados ao abrir a modal
  useEffect(() => {
    if (certificate) {
      setEmployeeId(certificate.employeeId || '');
      setType(certificate.type || 'ATESTADO_AFASTAMENTO');
      setStartDate(certificate.startDate || '');
      setEndDate(certificate.endDate || '');
      setDaysCount(certificate.daysCount || 1);
      setIsPartialDay(Boolean(certificate.isPartialDay));
      setAbsenceHours(certificate.absenceHours || 8);
      setCidCode(certificate.cidCode || '');
      setCidDescription(certificate.cidDescription || '');
      setCidQuery(certificate.cidCode ? `${certificate.cidCode} - ${certificate.cidDescription || ''}` : '');
      setDoctorName(certificate.doctorName || '');
      setDoctorCrm(certificate.doctorCrm || '');
      setDoctorSpecialty(certificate.doctorSpecialty || '');
      setDocumentUrl(certificate.documentUrl || '');
      setDocumentName(certificate.documentName || '');
      setDocumentType(certificate.documentType || '');
      setNotes(certificate.notes || '');
      setStatus(certificate.status || 'APROVADO');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setEmployeeId('');
      setType('ATESTADO_AFASTAMENTO');
      setStartDate(today);
      setEndDate(today);
      setDaysCount(1);
      setIsPartialDay(false);
      setAbsenceHours(8);
      setCidCode('');
      setCidDescription('');
      setCidQuery('');
      setDoctorName('');
      setDoctorCrm('');
      setDoctorSpecialty('');
      setDocumentUrl('');
      setDocumentName('');
      setDocumentType('');
      setNotes('');
      setStatus('APROVADO');
    }
  }, [certificate, isModalOpen]);

  // Sincronização automática de datas e dias
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!newStart) return;

    if (daysCount > 0) {
      const d = new Date(newStart + 'T00:00:00');
      d.setDate(d.getDate() + (daysCount - 1));
      const calculatedEnd = d.toISOString().split('T')[0];
      setEndDate(calculatedEnd);
    }
  };

  const handleDaysChange = (newDays: number) => {
    const validDays = Math.max(1, newDays || 1);
    setDaysCount(validDays);

    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      d.setDate(d.getDate() + (validDays - 1));
      const calculatedEnd = d.toISOString().split('T')[0];
      setEndDate(calculatedEnd);
    }

    if (!isPartialDay) {
      setAbsenceHours(validDays * 8);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (!startDate || !newEnd) return;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(newEnd + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const validDays = Math.max(1, diffDays);
    setDaysCount(validDays);

    if (!isPartialDay) {
      setAbsenceHours(validDays * 8);
    }
  };

  // Toggle de período parcial
  const handleTogglePartialDay = (checked: boolean) => {
    setIsPartialDay(checked);
    if (!checked) {
      setAbsenceHours(daysCount * 8);
    } else if (absenceHours === daysCount * 8) {
      setAbsenceHours(4); // Default sugestão para parcial
    }
  };

  // Busca de CID com debounce
  useEffect(() => {
    if (!cidQuery || cidQuery.length < 2) {
      setCidSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCid(true);
      try {
        const results = await medicalCertificateService.searchCid10(cidQuery.trim(), 15);
        setCidSuggestions(results);
        setShowCidDropdown(true);
      } catch (err) {
        console.error('Erro ao buscar CID-10:', err);
      } finally {
        setIsSearchingCid(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cidQuery]);

  // Fechar dropdown de CID ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cidContainerRef.current && !cidContainerRef.current.contains(e.target as Node)) {
        setShowCidDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCid = (cid: Cid10DTO) => {
    setCidCode(cid.code);
    setCidDescription(cid.description);
    setCidQuery(`${cid.code} - ${cid.description}`);
    setShowCidDropdown(false);
  };

  const handleClearCid = () => {
    setCidCode('');
    setCidDescription('');
    setCidQuery('');
    setCidSuggestions([]);
    setShowCidDropdown(false);
  };

  // Upload de arquivo de comprovante
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo não deve ultrapassar 15MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await medicalCertificateService.uploadAttachment(file);
      setDocumentUrl(result.url);
      setDocumentName(result.fileName);
      setDocumentType(result.fileType);
      toast({
        title: 'Comprovante anexado!',
        description: `Arquivo ${result.fileName} enviado com sucesso.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro no upload',
        description: err?.response?.data?.error || err?.message || 'Falha ao enviar arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    setDocumentUrl('');
    setDocumentName('');
    setDocumentType('');
  };

  // Salvar registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      toast({
        title: 'Colaborador obrigatório',
        description: 'Por favor, selecione o funcionário que apresentou o atestado.',
        variant: 'destructive',
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: 'Período obrigatório',
        description: 'Informe as datas inicial e final do atestado.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId,
        type,
        startDate,
        endDate,
        daysCount,
        absenceHours: Number(absenceHours) || 8,
        isPartialDay,
        cidCode: cidCode || (cidQuery.length <= 15 ? cidQuery.toUpperCase() : undefined),
        cidDescription: cidDescription || undefined,
        doctorName: doctorName.trim() || undefined,
        doctorCrm: doctorCrm.trim() || undefined,
        doctorSpecialty: doctorSpecialty.trim() || undefined,
        documentUrl: documentUrl || undefined,
        documentName: documentName || undefined,
        documentType: documentType || undefined,
        notes: notes.trim() || undefined,
        status,
      };

      if (isEdit && certificate?.id) {
        await medicalCertificateService.update(certificate.id, payload);
        toast({
          title: 'Atestado atualizado!',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        await medicalCertificateService.create(payload);
        toast({
          title: 'Atestado lançado com sucesso!',
          description: 'O afastamento foi registrado e integrado ao prontuário.',
        });
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar atestado',
        description: err?.response?.data?.message || err?.message || 'Falha ao salvar no servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig = MEDICAL_CERTIFICATE_TYPE_COLORS[type] || {
    bg: 'bg-zinc-800',
    text: 'text-zinc-200',
    border: 'border-zinc-700',
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-zinc-950/95 border border-zinc-800 backdrop-blur-xl text-zinc-100 p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800/80 bg-gradient-to-r from-red-950/30 via-zinc-900/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0">
              <FileHeart className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                {isEdit ? 'Editar Atestado / Afastamento' : 'Novo Lançamento de Atestado'}
                <Badge className={`${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} border text-xs`}>
                  {MEDICAL_CERTIFICATE_TYPE_LABELS[type]}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1">
                Controle de faltas justificadas, declarações de comparecimento, licenças e afastamentos médicos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── SEÇÃO 1: FUNCIONÁRIO E TIPO ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <User className="h-4 w-4 text-red-400" />
              1. Identificação do Colaborador & Tipo de Ausência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Colaborador <span className="text-red-400">*</span>
                </Label>
                <SearchableSelect
                  value={employeeId}
                  onChange={(val) => setEmployeeId(val)}
                  options={employeeOptions}
                  placeholder={isLoadingEmployees ? 'Carregando colaboradores...' : 'Buscar colaborador (digite 3 letras)...'}
                  searchPlaceholder="Digite nome, CPF ou matrícula..."
                  emptyText="Nenhum colaborador encontrado com este termo."
                  minSearchLength={3}
                  minSearchHint="Digite no mínimo 3 caracteres para pesquisar colaboradores..."
                  disabled={isLoadingEmployees || isSubmitting}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Tipo de Atestado / Documento <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={(val) => setType(val as MedicalCertificateType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-h-72">
                    {Object.entries(MEDICAL_CERTIFICATE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs focus:bg-zinc-800 focus:text-zinc-100">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* ── SEÇÃO 2: PERÍODO, DIAS E HORAS AUSENTES ── */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                2. Período, Duração & Horas Ausentes no Posto
              </h3>
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg">
                <Switch
                  id="partial-day-switch"
                  checked={isPartialDay}
                  onCheckedChange={handleTogglePartialDay}
                  className="data-[state=checked]:bg-amber-600"
                />
                <Label htmlFor="partial-day-switch" className="text-xs text-zinc-300 cursor-pointer">
                  Atestado de fração de horas / comparecimento
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Data Inicial <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Quantidade de Dias <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={daysCount}
                  onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs font-semibold text-center"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">
                  Data Final <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 flex items-center justify-between">
                  <span>Horas Ausentes</span>
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-600/40">
                    {isPartialDay ? 'Fração manual' : 'Auto 8h/dia'}
                  </Badge>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={absenceHours}
                    onChange={(e) => setAbsenceHours(parseFloat(e.target.value) || 0)}
                    disabled={!isPartialDay}
                    className={`bg-zinc-900 border-zinc-700 text-xs font-mono font-bold ${
                      isPartialDay ? 'text-amber-400 border-amber-600/50' : 'text-emerald-400'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-zinc-500">horas</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                {isPartialDay ? (
                  <>Declaração com <strong>{absenceHours} horas</strong> de ausência justificadas no dia.</>
                ) : (
                  <>Período de <strong>{daysCount} dia(s)</strong> gerando <strong>{absenceHours} horas</strong> de abono integral na jornada de trabalho.</>
                )}
              </span>
            </div>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* ── SEÇÃO 3: CID-10 E DADOS MÉDICOS ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-cyan-400" />
              3. CID-10 & Dados do Profissional de Saúde
            </h3>

            {/* Campo Inteligente de CID-10 */}
            <div className="space-y-1.5 relative" ref={cidContainerRef}>
              <Label className="text-xs text-zinc-300 flex items-center justify-between">
                <span>Código CID-10 (Busca automática de código ou diagnóstico)</span>
                {cidCode && (
                  <button
                    type="button"
                    onClick={handleClearCid}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                  >
                    Limpar CID
                  </button>
                )}
              </Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Digite o código (ex: J06, M54) ou nome da doença (ex: Lombalgia, Gripe)..."
                  value={cidQuery}
                  onChange={(e) => {
                    setCidQuery(e.target.value);
                    if (!e.target.value) {
                      setCidCode('');
                      setCidDescription('');
                    }
                  }}
                  onFocus={() => cidSuggestions.length > 0 && setShowCidDropdown(true)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 pl-9 pr-10 text-xs"
                />
                {isSearchingCid && (
                  <Loader2 className="h-4 w-4 absolute right-3 top-2.5 animate-spin text-zinc-500" />
                )}
              </div>

              {/* Dropdown de sugestões do CID */}
              {showCidDropdown && cidSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl max-h-56 overflow-y-auto divide-y divide-zinc-800">
                  {cidSuggestions.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectCid(item)}
                      className="w-full text-left p-2.5 hover:bg-zinc-800/80 transition-colors flex items-start gap-3 group"
                    >
                      <Badge className="bg-cyan-950 text-cyan-300 border border-cyan-700 text-[11px] font-mono shrink-0">
                        {item.code}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 group-hover:text-cyan-200 truncate font-medium">
                          {item.description}
                        </p>
                        {item.category && (
                          <p className="text-[10px] text-zinc-500">{item.category}</p>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-cyan-400 opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Caixa da descrição oficial do CID */}
              {cidCode && cidDescription && (
                <div className="mt-2 p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-300">{cidCode}</span>
                    <p className="text-xs text-zinc-300 mt-0.5">{cidDescription}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CRM, Médico e Especialidade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">CRM do Médico / Conselho</Label>
                <Input
                  type="text"
                  placeholder="Ex: 12345/MG"
                  value={doctorCrm}
                  onChange={(e) => setDoctorCrm(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Nome do Médico</Label>
                <Input
                  type="text"
                  placeholder="Ex: Dr. Roberto Alencar"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Especialidade</Label>
                <Input
                  type="text"
                  placeholder="Ex: Ortopedia, Clínica Geral..."
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800/80" />

          {/* ── SEÇÃO 4: COMPROVANTE, OBSERVAÇÕES E STATUS ── */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-purple-400" />
              4. Comprovante Anexo (PDF ou Imagem) & Observações
            </h3>

            {/* Upload de Comprovante */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-300">Anexo do Atestado (Foto ou PDF)</Label>
              {documentUrl ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-zinc-200 truncate">{documentName || 'Comprovante anexado'}</p>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 mt-0.5"
                      >
                        Visualizar arquivo <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAttachment}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed border-zinc-800 hover:border-purple-600/60 bg-zinc-900/40 hover:bg-zinc-900/80 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-xs text-purple-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando comprovante...
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <UploadCloud className="h-6 w-6 text-zinc-500 mx-auto" />
                      <p className="text-xs font-medium text-zinc-300">
                        Clique para anexar ou arraste o arquivo do atestado
                      </p>
                      <p className="text-[10px] text-zinc-500">PDF, PNG ou JPG até 15MB</p>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* Observações e Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs text-zinc-300">Observações Internas</Label>
                <Textarea
                  placeholder="Detalhes adicionais, recomendações da medicina do trabalho, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs resize-none h-20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Status da Homologação</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as MedicalCertificateStatus)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="APROVADO" className="text-xs text-emerald-400">
                      Aprovado
                    </SelectItem>
                    <SelectItem value="PENDENTE" className="text-xs text-amber-400">
                      Pendente
                    </SelectItem>
                    <SelectItem value="REJEITADO" className="text-xs text-red-400">
                      Rejeitado
                    </SelectItem>
                    <SelectItem value="CANCELADO" className="text-xs text-zinc-400">
                      Cancelado
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Atestados aprovados abonam as horas de ausência na folha de ponto.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-zinc-800 bg-zinc-950/80 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs ml-2 shadow-lg shadow-red-900/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : isEdit ? (
                'Atualizar Atestado'
              ) : (
                'Salvar Lançamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalCertificateModal;
