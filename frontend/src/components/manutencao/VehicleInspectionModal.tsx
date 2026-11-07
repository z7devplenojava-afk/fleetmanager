import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Camera,
  Upload,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Truck,
  Wrench,
  X
} from 'lucide-react';
import vehicleInspectionService, {
  VehicleInspection,
  CreateVehicleInspectionDTO,
  DEFAULT_SERVICES_PERFORMED_TEMPLATE,
  VehicleReleaseStatus
} from '@/services/vehicleInspectionService';
import fleetService from '@/services/fleetService';
import { openVehicleInspectionPDFPreview } from '@/utils/vehicleInspectionPdfGenerator';

interface VehicleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: VehicleInspection | null;
  onSuccess?: () => void;
  initialVehiclePlate?: string;
}

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  open,
  onOpenChange,
  inspection,
  onSuccess,
  initialVehiclePlate
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Form State
  const [registryNumber, setRegistryNumber] = useState('');
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [projectName, setProjectName] = useState('VALE');
  const [clientName, setClientName] = useState('MSM');
  const [currentMileage, setCurrentMileage] = useState<string>('7000');
  const [horimeterHours, setHorimeterHours] = useState('215HRS');
  const [problemDescription, setProblemDescription] = useState('1- MANUTENÇÃO PREVENTIVA\n2-\n3-');
  const [occurrenceDescription, setOccurrenceDescription] = useState('PREVENTIVA MENSAL');
  const [executionTeam, setExecutionTeam] = useState('VAGNER SABINO / JAIRO');
  const [servicesPerformed, setServicesPerformed] = useState(DEFAULT_SERVICES_PERFORMED_TEMPLATE);
  const [partsReplaced, setPartsReplaced] = useState('Descritas acima.');
  const [releaseStatus, setReleaseStatus] = useState<VehicleReleaseStatus>('LIBERADO_SEM_RESTRICAO');
  const [restrictionDescription, setRestrictionDescription] = useState('Sem restrição.');
  const [managerName, setManagerName] = useState('Gerente de Manutenção');
  const [engineerName, setEngineerName] = useState('Engenheiro Mecânico');

  // Evidências Fotográficas (Mosaico de 8 fotos)
  const [evidences, setEvidences] = useState<string[]>(Array(8).fill(''));

  // Veículos cadastrados para auto-preenchimento
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;

    fleetService.getVehicles().then((list) => {
      if (Array.isArray(list)) setVehicles(list);
    }).catch(() => {});

    if (inspection) {
      setRegistryNumber(inspection.registryNumber || '');
      setInspectionDate(inspection.inspectionDate || new Date().toISOString().substring(0, 10));
      setVehiclePlate(inspection.vehiclePlate || '');
      setProjectName(inspection.projectName || 'VALE');
      setClientName(inspection.clientName || 'MSM');
      setCurrentMileage(inspection.currentMileage != null ? String(inspection.currentMileage) : '7000');
      setHorimeterHours(inspection.horimeterHours || '215HRS');
      setProblemDescription(inspection.problemDescription || '1- MANUTENÇÃO PREVENTIVA\n2-\n3-');
      setOccurrenceDescription(inspection.occurrenceDescription || 'PREVENTIVA MENSAL');
      setExecutionTeam(inspection.executionTeam || 'VAGNER SABINO / JAIRO');
      setServicesPerformed(inspection.servicesPerformed || DEFAULT_SERVICES_PERFORMED_TEMPLATE);
      setPartsReplaced(inspection.partsReplaced || inspection.partsUsed || 'Descritas acima.');
      setReleaseStatus(inspection.releaseStatus || 'LIBERADO_SEM_RESTRICAO');
      setRestrictionDescription(inspection.restrictionDescription || 'Sem restrição.');
      setManagerName(inspection.managerName || inspection.supervisorName || 'Gerente de Manutenção');
      setEngineerName(inspection.engineerName || inspection.inspectorName || 'Engenheiro Mecânico');

      let parsedPhotos: string[] = [];
      if (inspection.evidencesUrls) {
        try {
          const arr = JSON.parse(inspection.evidencesUrls);
          if (Array.isArray(arr)) parsedPhotos = arr;
        } catch {
          parsedPhotos = inspection.evidencesUrls.split(',').map((u) => u.trim()).filter(Boolean);
        }
      }
      const filled = Array(8).fill('');
      for (let i = 0; i < 8; i++) {
        if (parsedPhotos[i]) filled[i] = parsedPhotos[i];
      }
      setEvidences(filled);
    } else {
      // Criação de novo laudo
      vehicleInspectionService.getNextRegistryNumber().then((next) => {
        setRegistryNumber(next);
      }).catch(() => {
        setRegistryNumber('14598');
      });

      if (initialVehiclePlate) {
        setVehiclePlate(initialVehiclePlate);
      }
      setEvidences(Array(8).fill(''));
      setReleaseStatus('LIBERADO_SEM_RESTRICAO');
      setRestrictionDescription('Sem restrição.');
    }
  }, [open, inspection, initialVehiclePlate]);

  const handleSelectVehicle = (plate: string) => {
    setVehiclePlate(plate);
    const found = vehicles.find((v) => (v.plate || v.placa || '').toUpperCase() === plate.toUpperCase());
    if (found) {
      if (found.currentMileage != null) setCurrentMileage(String(found.currentMileage));
      if (found.clientName || found.client?.name) setClientName(found.clientName || found.client?.name);
      if (found.projectName || found.obraName) setProjectName(found.projectName || found.obraName);
    }
  };

  const handleTriggerUpload = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSlot === null || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEvidences((prev) => {
        const next = [...prev];
        next[activeSlot] = result;
        return next;
      });
      toast({
        title: `Evidência ${activeSlot + 1} anexada`,
        description: 'Foto carregada com sucesso para o mosaico do laudo.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (slotIndex: number) => {
    setEvidences((prev) => {
      const next = [...prev];
      next[slotIndex] = '';
      return next;
    });
  };

  const buildFormData = (): CreateVehicleInspectionDTO => {
    const validPhotos = evidences.filter(Boolean);
    const photosJson = validPhotos.length > 0 ? JSON.stringify(validPhotos) : undefined;
    return {
      registryNumber,
      inspectionType: 'LAUDO',
      inspectionDate,
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      projectName,
      clientName,
      currentMileage: currentMileage ? parseInt(currentMileage, 10) : undefined,
      horimeterHours,
      executionTeam,
      problemDescription,
      occurrenceDescription,
      servicesPerformed,
      partsReplaced,
      partsUsed: partsReplaced,
      evidencesUrls: photosJson,
      releaseStatus,
      restrictionDescription: releaseStatus === 'LIBERADO_SEM_RESTRICAO' ? 'Sem restrição.' : restrictionDescription,
      managerName,
      engineerName,
      supervisorName: managerName,
      inspectorName: engineerName,
    };
  };

  const handleSave = async () => {
    if (!vehiclePlate.trim()) {
      toast({ title: 'Campo Obrigatório', description: 'Por favor, informe a placa do veículo.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = buildFormData();
      if (inspection?.id) {
        await vehicleInspectionService.updateInspection(inspection.id, payload);
        toast({ title: 'Laudo Atualizado!', description: `Laudo Nº ${registryNumber} salvo com sucesso.` });
      } else {
        await vehicleInspectionService.createInspection(payload);
        toast({ title: 'Laudo Criado!', description: `Laudo Nº ${registryNumber} emitido com sucesso.` });
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: 'Erro ao Salvar Laudo',
        description: err?.message || 'Não foi possível salvar o laudo de inspeção.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    setGeneratingPdf(true);
    try {
      const mockObj: VehicleInspection = {
        id: inspection?.id || 'preview',
        ...buildFormData(),
      };
      await openVehicleInspectionPDFPreview(mockObj);
      toast({
        title: 'PDF Aberto para Impressão',
        description: 'O Laudo de Inspeção Oficial foi aberto na aba de visualização.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao Gerar PDF',
        description: err?.message || 'Falha ao processar o PDF do laudo.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-seguranca-darkgray/95 border-amber-500/30 text-white shadow-2xl p-4 sm:p-6">
          <DialogHeader className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    LAUDO DE INSPEÇÃO TÉCNICA E MANUTENÇÃO
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                      Nº {registryNumber || '14598'}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400">
                    Formulário de vistoria preventiva e inspeção com registro de 8 evidências fotográficas
                  </DialogDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintPDF}
                disabled={generatingPdf}
                className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20 text-xs font-bold gap-1.5 h-8"
              >
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Visualizar / Imprimir PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Bloco 1: Cabeçalho com Registro e Identificação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Nº Registro</Label>
                <Input
                  value={registryNumber}
                  onChange={(e) => setRegistryNumber(e.target.value)}
                  placeholder="14598"
                  className="bg-black/60 border-zinc-700 h-9 font-mono font-bold text-amber-400 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Data Inspeção</Label>
                <Input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">KM Atual</Label>
                <Input
                  type="number"
                  value={currentMileage}
                  onChange={(e) => setCurrentMileage(e.target.value)}
                  placeholder="7000"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Horímetro (Horas)</Label>
                <Input
                  value={horimeterHours}
                  onChange={(e) => setHorimeterHours(e.target.value)}
                  placeholder="215HRS"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-mono font-bold text-sky-400"
                />
              </div>
            </div>

            {/* Bloco 2: Obra, Placa, Cliente e Equipe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Obra / Projeto</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="VALE"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-bold"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase flex items-center justify-between">
                  <span>Placa do Veículo</span>
                  {vehicles.length > 0 && <span className="text-[10px] text-amber-400">Sugestões disponíveis</span>}
                </Label>
                <Input
                  value={vehiclePlate}
                  onChange={(e) => handleSelectVehicle(e.target.value)}
                  placeholder="UVG3H03"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-mono uppercase font-bold text-amber-300"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Cliente</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="MSM"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Execução (Equipe)</Label>
                <Input
                  value={executionTeam}
                  onChange={(e) => setExecutionTeam(e.target.value)}
                  placeholder="VAGNER SABINO / JAIRO"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-medium"
                />
              </div>
            </div>

            {/* Bloco 3: Descrição do Problema e Ocorrido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Descrição do Problema (Numerado)</Label>
                <Textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="1- MANUTENÇÃO PREVENTIVA&#10;2-&#10;3-"
                  className="bg-black/60 border-zinc-700 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Descrição do Ocorrido</Label>
                <Input
                  value={occurrenceDescription}
                  onChange={(e) => setOccurrenceDescription(e.target.value)}
                  placeholder="PREVENTIVA MENSAL"
                  className="bg-black/60 border-zinc-700 h-9 text-sm mt-1 font-bold text-emerald-400 uppercase"
                />
                <div className="mt-2.5">
                  <Label className="text-xs text-zinc-400 font-bold uppercase">Peças Trocadas</Label>
                  <Input
                    value={partsReplaced}
                    onChange={(e) => setPartsReplaced(e.target.value)}
                    placeholder="Descritas acima."
                    className="bg-black/60 border-zinc-700 h-9 text-sm mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Serviço Realizado */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 font-bold uppercase flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  Serviço Realizado (Itens Inspecionados e Revisados)
                </Label>
                <button
                  type="button"
                  onClick={() => setServicesPerformed(DEFAULT_SERVICES_PERFORMED_TEMPLATE)}
                  className="text-[11px] text-amber-400 hover:underline font-semibold"
                >
                  Restaurar Padrão São Silvestre
                </button>
              </div>
              <Textarea
                rows={4}
                value={servicesPerformed}
                onChange={(e) => setServicesPerformed(e.target.value)}
                placeholder="Descreva todos os serviços executados..."
                className="bg-black/60 border-zinc-700 text-xs leading-relaxed"
              />
            </div>

            {/* Bloco 5: EVIDÊNCIAS FOTOGRÁFICAS (MOSAICO 2x4 - 8 FOTOS) */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-300 font-extrabold uppercase tracking-wider flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-400" />
                  Evidências Fotográficas (Mosaico Oficial de 8 Fotos: Placa, Painel/Horímetro e Componentes com Giz)
                </Label>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {evidences.filter(Boolean).length} de 8 fotos anexadas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {evidences.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-[4/3] rounded-lg border border-dashed border-zinc-700 bg-black/60 hover:border-amber-500/60 overflow-hidden flex flex-col items-center justify-center transition-all p-1"
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={`Evidência ${idx + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(idx)}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-md text-xs font-bold"
                            title="Trocar Foto"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold"
                            title="Remover Foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded font-mono text-zinc-300">
                          #{idx + 1}
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(idx)}
                        className="w-full h-full flex flex-col items-center justify-center text-zinc-500 hover:text-amber-400 p-2 text-center"
                      >
                        <Camera className="h-5 w-5 mb-1" />
                        <span className="text-[11px] font-semibold">
                          {idx === 0 ? '1. Placa/Frente' : idx === 1 ? '2. Odômetro/Painel' : `Foto #${idx + 1}`}
                        </span>
                        <span className="text-[9px] text-zinc-600 mt-0.5">Clique p/ Anexar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 6: Declaração de Conclusão / Liberação Operativa */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-3">
              <Label className="text-xs text-zinc-300 font-extrabold uppercase tracking-wider">
                Declaro que o veículo foi inspecionado por mim com a seguinte conclusão:
              </Label>

              <RadioGroup
                value={releaseStatus}
                onValueChange={(val: any) => setReleaseStatus(val)}
                className="space-y-2"
              >
                <div
                  onClick={() => setReleaseStatus('LIBERADO_SEM_RESTRICAO')}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    releaseStatus === 'LIBERADO_SEM_RESTRICAO'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : 'bg-black/30 border-zinc-800 text-zinc-400 hover:bg-black/50'
                  }`}
                >
                  <RadioGroupItem value="LIBERADO_SEM_RESTRICAO" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ( X ) EQUIPAMENTO LIBERADO SEM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA
                  </Label>
                </div>

                <div
                  onClick={() => setReleaseStatus('LIBERADO_COM_RESTRICAO')}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    releaseStatus === 'LIBERADO_COM_RESTRICAO'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                      : 'bg-black/30 border-zinc-800 text-zinc-400 hover:bg-black/50'
                  }`}
                >
                  <RadioGroupItem value="LIBERADO_COM_RESTRICAO" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    (   ) EQUIPAMENTO LIBERADO COM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA
                  </Label>
                </div>

                <div
                  onClick={() => setReleaseStatus('NAO_LIBERADO')}
                  className={`flex items-center space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    releaseStatus === 'NAO_LIBERADO'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-black/30 border-zinc-800 text-zinc-400 hover:bg-black/50'
                  }`}
                >
                  <RadioGroupItem value="NAO_LIBERADO" id="r3" />
                  <Label htmlFor="r3" className="cursor-pointer font-bold text-xs flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    (   ) EQUIPAMENTO NÃO LIBERADO PARA OPERAÇÃO
                  </Label>
                </div>
              </RadioGroup>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Descrever a Restrição</Label>
                <Input
                  value={restrictionDescription}
                  onChange={(e) => setRestrictionDescription(e.target.value)}
                  placeholder="Sem restrição."
                  className="bg-black/60 border-zinc-700 h-9 text-xs mt-1"
                />
              </div>
            </div>

            {/* Bloco 7: Responsáveis Técnicos (Gerente Manutenção & Engenheiro Mecânico) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-xl">
              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Gerente de Manutenção</Label>
                <Input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Nome do Gerente de Manutenção"
                  className="bg-black/60 border-zinc-700 h-9 text-xs mt-1 font-bold"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400 font-bold uppercase">Engenheiro Mecânico</Label>
                <Input
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Nome do Engenheiro Mecânico"
                  className="bg-black/60 border-zinc-700 h-9 text-xs mt-1 font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintPDF}
                disabled={generatingPdf}
                className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5"
              >
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Prévia PDF
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs px-5 shadow-lg shadow-amber-500/20 gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar Laudo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

