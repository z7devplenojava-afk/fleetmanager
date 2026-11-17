import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wrench,
  Camera,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  Truck,
  User as UserIcon,
  Calendar,
  Save,
  Loader2,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Building,
  Image as ImageIcon,
  Check,
  X,
  FileText,
  Gauge
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import fleetWorkOrderService, {
  FleetWorkOrder,
  WorkOrderStatus,
  LaborType
} from '@/services/fleetWorkOrderService';

interface MechanicWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: FleetWorkOrder | null;
  onSuccess?: () => void;
}

export const MechanicWorkOrderModal: React.FC<MechanicWorkOrderModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSuccess
}) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'execution' | 'evidence' | 'external'>('execution');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Campos do formulário
  const [status, setStatus] = useState<WorkOrderStatus>(WorkOrderStatus.OPEN);
  const [maintenancePerformed, setMaintenancePerformed] = useState('');
  const [notes, setNotes] = useState('');
  const [exitMileage, setExitMileage] = useState<number | string>('');
  const [exitDate, setExitDate] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [laborType, setLaborType] = useState<LaborType>(LaborType.INTERNAL);
  const [photos, setPhotos] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Preview de foto em tamanho maior
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Refs para inputs de câmera e arquivo
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permissão de aprovação de serviço externo
  const canApproveExternal = React.useMemo(() => {
    if (!currentUser?.roles) return false;
    const allowed = [
      'SUPER_ADMIN', 'ROLE_SUPER_ADMIN',
      'ADMIN', 'ROLE_ADMIN',
      'COMPANY_ADMIN', 'ROLE_COMPANY_ADMIN', 'ADMIN_EMPRESA', 'ROLE_ADMIN_EMPRESA',
      'GESTOR', 'ROLE_GESTOR',
      'GESTOR_MANUTENCAO', 'ROLE_GESTOR_MANUTENCAO',
      'ENCARREGADO_MANUTENCAO', 'ROLE_ENCARREGADO_MANUTENCAO',
      'GESTOR_OPERACIONAL', 'ROLE_GESTOR_OPERACIONAL',
      'ENCARREGADO_OPERACIONAL', 'ROLE_ENCARREGADO_OPERACIONAL'
    ];
    return currentUser.roles.some((r: any) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return roleName && allowed.includes(roleName.toUpperCase());
    });
  }, [currentUser]);

  useEffect(() => {
    if (workOrder) {
      setStatus(workOrder.status || WorkOrderStatus.OPEN);
      setMaintenancePerformed(workOrder.maintenancePerformed || '');
      setNotes(workOrder.notes || '');
      setExitMileage(workOrder.exitMileage || '');
      setExitDate(workOrder.exitDate || '');
      setExitTime(workOrder.exitTime || '');
      setLaborType(workOrder.laborType || LaborType.INTERNAL);
      setPhotos(workOrder.photoAttachments || []);
    }
  }, [workOrder]);

  if (!workOrder) return null;

  // Upload de fotos (câmera nativa ou arquivos da galeria)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingPhoto(true);
      toast({
        title: "Enviando evidência...",
        description: "Comprimindo e salvando foto da O.S.",
      });

      const fileList = Array.from(files);
      const uploadedUrls = await fleetWorkOrderService.uploadPhotos(fileList);

      if (uploadedUrls.length > 0) {
        const updatedPhotos = [...photos, ...uploadedUrls];
        setPhotos(updatedPhotos);

        // Salvar imediatamente na O.S.
        await fleetWorkOrderService.update(workOrder.id, {
          photoAttachments: updatedPhotos
        });

        toast({
          title: "Foto anexada com sucesso!",
          description: `${uploadedUrls.length} evidência(s) salva(s) na Ordem de Serviço.`,
        });
      }
    } catch (err: any) {
      console.error('Erro ao enviar foto:', err);
      toast({
        title: "Erro ao anexar foto",
        description: err?.message || "Não foi possível enviar a evidência.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    setPhotos(updated);
    try {
      await fleetWorkOrderService.update(workOrder.id, {
        photoAttachments: updated
      });
      toast({ title: "Evidência removida." });
    } catch (err) {
      console.error('Erro ao remover foto:', err);
    }
  };

  // Assumir O.S. pelo mecânico logado (mantém status A Fazer até iniciar execução)
  const handleAssignToMe = async () => {
    try {
      setIsAssigning(true);
      const updated = await fleetWorkOrderService.assignMechanic(workOrder.id);
      if (updated?.status) {
        setStatus(updated.status);
      }
      toast({
        title: "O.S. assumida!",
        description: "A O.S. foi movida para 'Minhas OS' no status 'A Fazer'.",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Não foi possível assumir a O.S.",
        variant: "destructive"
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Aprovar serviço externo
  const handleApproveExternal = async () => {
    try {
      setIsApproving(true);
      await fleetWorkOrderService.approveExternalService(workOrder.id);
      setLaborType(LaborType.EXTERNAL);
      setStatus(WorkOrderStatus.APPROVED);
      toast({
        title: "Serviço Externo Aprovado!",
        description: "Notificação enviada ao Mecânico e ao setor de Compras para cotação.",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Erro na aprovação",
        description: err?.message || "Falha ao aprovar serviço externo.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Recusar serviço externo
  const handleRejectExternal = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da recusa.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRejecting(true);
      await fleetWorkOrderService.rejectExternalService(workOrder.id, rejectReason.trim());
      setStatus(WorkOrderStatus.IN_PROGRESS);
      setIsRejectDialogOpen(false);
      setRejectReason('');
      toast({
        title: "Serviço Externo Devolvido",
        description: "A O.S. retornou para execução com aviso ao mecânico.",
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err?.message || "Falha ao registrar recusa.",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Salvar preenchimento da O.S.
  const handleSave = async () => {
    try {
      setIsSaving(true);

      const payload: Partial<FleetWorkOrder> = {
        status,
        maintenancePerformed,
        notes,
        laborType,
        exitMileage: exitMileage ? Number(exitMileage) : undefined,
        exitDate: exitDate || undefined,
        exitTime: exitTime || undefined,
        photoAttachments: photos
      };

      await fleetWorkOrderService.update(workOrder.id, payload);

      toast({
        title: "O.S. Atualizada!",
        description: "Informações salvas com sucesso.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar O.S.:', err);
      toast({
        title: "Erro ao salvar",
        description: err?.response?.data?.error || err?.message || "Falha ao atualizar Ordem de Serviço.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (st: WorkOrderStatus) => {
    switch (st) {
      case WorkOrderStatus.IN_PROGRESS:
        return <Badge className="bg-amber-600/30 text-amber-300 border-amber-600/50">Em Execução</Badge>;
      case WorkOrderStatus.WAITING_PARTS:
        return <Badge className="bg-purple-600/30 text-purple-300 border-purple-600/50">Aguardando Peças</Badge>;
      case WorkOrderStatus.COMPLETED:
        return <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-600/50">Finalizada</Badge>;
      case WorkOrderStatus.APPROVED:
        return <Badge className="bg-blue-600/30 text-blue-300 border-blue-600/50">Aprovada / Fila</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400 border-slate-700">A Fazer</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[92vh] bg-slate-950 text-slate-100 border-slate-800 p-0 overflow-hidden flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex flex-wrap justify-between items-center gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  O.S. #{workOrder.id ? workOrder.id.substring(0, 8).toUpperCase() : 'NOVA'}
                </span>
                {getStatusBadge(status)}
                {laborType === LaborType.EXTERNAL && (
                  <Badge variant="outline" className="border-cyan-600/60 text-cyan-400 bg-cyan-950/40 text-[10px]">
                    Prestador Externo
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-red-500" />
                {workOrder.vehiclePlate || 'Sem Placa'}
                <span className="text-sm font-normal text-slate-400">
                  {workOrder.vehicleModel ? `• ${workOrder.vehicleModel}` : ''}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Mecânico: <strong className="text-slate-200">{workOrder.mechanicName || 'Não atribuído'}</strong>
                {workOrder.driverName && ` | Motorista: ${workOrder.driverName}`}
              </DialogDescription>
            </div>

            {/* Ações Rápidas de Status */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {!workOrder.mechanicId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAssignToMe}
                  disabled={isAssigning}
                  className="h-8 text-xs bg-emerald-950/40 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60"
                >
                  {isAssigning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserIcon className="h-3 w-3 mr-1" />}
                  Assumir O.S.
                </Button>
              )}

              {status !== WorkOrderStatus.IN_PROGRESS && status !== WorkOrderStatus.COMPLETED && (
                <Button
                  size="sm"
                  onClick={() => setStatus(WorkOrderStatus.IN_PROGRESS)}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                >
                  <Wrench className="h-3 w-3 mr-1" /> Iniciar Execução
                </Button>
              )}

              {status === WorkOrderStatus.IN_PROGRESS && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus(WorkOrderStatus.WAITING_PARTS)}
                  className="h-8 text-xs border-purple-600 text-purple-300 hover:bg-purple-950/40"
                >
                  <Clock className="h-3 w-3 mr-1" /> Aguardando Peças
                </Button>
              )}

              {status !== WorkOrderStatus.COMPLETED && (
                <Button
                  size="sm"
                  onClick={() => setStatus(WorkOrderStatus.COMPLETED)}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <CheckCircle className="h-3 w-3 mr-1" /> Concluir O.S.
                </Button>
              )}
            </div>
          </div>

          {/* Navegação por Abas */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 border-b border-slate-800 bg-slate-900/40">
              <TabsList className="bg-transparent h-10 p-0 gap-2">
                <TabsTrigger
                  value="execution"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs h-8 px-3 rounded-md"
                >
                  <Wrench className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                  Execução & Laudo
                </TabsTrigger>
                <TabsTrigger
                  value="evidence"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs h-8 px-3 rounded-md"
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Evidências & Fotos ({photos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="external"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs h-8 px-3 rounded-md"
                >
                  <Building className="h-3.5 w-3.5 mr-1.5 text-cyan-500" />
                  Serviço Externo
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs h-8 px-3 rounded-md"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Dados do Veículo
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {/* ABA 1: EXECUÇÃO */}
              <TabsContent value="execution" className="m-0 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                    Manutenção Realizada / Diagnóstico Técnico *
                  </Label>
                  <Textarea
                    rows={4}
                    value={maintenancePerformed}
                    onChange={(e) => setMaintenancePerformed(e.target.value)}
                    placeholder="Descreva detalhadamente os procedimentos, ajustes, trocas de peças e reparos realizados..."
                    className="bg-slate-900 border-slate-700 text-slate-100 text-sm focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-300">
                    Observações Internas da Oficina / Pendências
                  </Label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações adicionais para o gestor ou próximo turno..."
                    className="bg-slate-900 border-slate-700 text-slate-100 text-sm"
                  />
                </div>

                {/* Dados de Saída */}
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/50 space-y-3">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-yellow-500" />
                    Dados de Saída & Quilometragem
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-400">KM / Odômetro de Saída</Label>
                      <Input
                        type="number"
                        value={exitMileage}
                        onChange={(e) => setExitMileage(e.target.value)}
                        placeholder="Ex: 125800"
                        className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-400">Data de Saída</Label>
                      <Input
                        type="date"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-400">Hora de Saída</Label>
                      <Input
                        type="time"
                        value={exitTime}
                        onChange={(e) => setExitTime(e.target.value)}
                        className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ABA 2: EVIDÊNCIAS E FOTOS */}
              <TabsContent value="evidence" className="m-0 space-y-4">
                {/* Inputs ocultos para Câmera direta e Upload de Arquivo */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                {/* Botões de Ação para Celular / Tablet / Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg rounded-xl text-sm"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    <span>Tirar Foto com a Câmera</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="h-14 border-slate-700 hover:bg-slate-900 text-slate-200 font-semibold flex items-center justify-center gap-2 rounded-xl text-sm"
                  >
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span>Selecionar Arquivo / Galeria</span>
                  </Button>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  💡 <strong>Câmera Direta:</strong> No celular ou tablet, o botão azul aciona a câmera do aparelho diretamente para fotografar a peça/veículo sem salvar na galeria pessoal. Imagens são otimizadas automaticamente para envio rápido.
                </div>

                {/* Grid de Fotos Anexadas */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Evidências Salvas ({photos.length})</span>
                  </Label>

                  {photos.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                      <ImageIcon className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Nenhuma evidência ou foto anexada ainda.</p>
                      <p className="text-[11px] text-slate-600">Use os botões acima para fotografar o veículo ou a peça avariada.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {photos.map((url, idx) => (
                        <div key={idx} className="group relative rounded-lg border border-slate-800 bg-slate-900 overflow-hidden aspect-video flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Evidência ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewPhoto(url)}
                          />
                          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6 rounded-md bg-red-600/90 text-white shadow-xs"
                              onClick={() => handleRemovePhoto(idx)}
                              title="Remover Evidência"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ABA 3: SERVIÇO EXTERNO & APROVAÇÃO */}
              <TabsContent value="external" className="m-0 space-y-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building className="h-4 w-4 text-cyan-400" />
                        Execução por Prestador de Serviço Externo
                      </h4>
                      <p className="text-xs text-slate-400">
                        Serviços realizados em oficinas autorizadas, retíficas, concessionárias ou terceirizados.
                      </p>
                    </div>
                    <Badge variant={laborType === LaborType.EXTERNAL ? "default" : "outline"} className={laborType === LaborType.EXTERNAL ? "bg-cyan-600 text-white" : "text-slate-400"}>
                      {laborType === LaborType.EXTERNAL ? "Serviço Externo" : "Interna (Própria)"}
                    </Badge>
                  </div>

                  {/* Alternar Mão de Obra */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={laborType === LaborType.INTERNAL ? "default" : "outline"}
                      onClick={() => setLaborType(LaborType.INTERNAL)}
                      className={laborType === LaborType.INTERNAL ? "bg-slate-700 text-white text-xs" : "border-slate-700 text-slate-400 text-xs"}
                    >
                      Oficina Própria (Interna)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={laborType === LaborType.EXTERNAL ? "default" : "outline"}
                      onClick={() => setLaborType(LaborType.EXTERNAL)}
                      className={laborType === LaborType.EXTERNAL ? "bg-cyan-600 text-white text-xs" : "border-slate-700 text-slate-400 text-xs"}
                    >
                      Prestador Externo (Terceiro)
                    </Button>
                  </div>
                </div>

                {/* Painel de Aprovação da Gestão */}
                {laborType === LaborType.EXTERNAL && (
                  <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-400" />
                          <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                            Governança & Aprovação de Serviço Externo
                          </h5>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          A execução terceirizada requer aprovação de <strong>Gestor de Manutenção</strong>, <strong>Encarregado de Manutenção</strong>, <strong>Gestor Operacional</strong> ou <strong>Encarregado Operacional</strong>.
                        </p>
                      </div>

                      {workOrder.status === WorkOrderStatus.APPROVED ? (
                        <Badge className="bg-emerald-600/40 text-emerald-300 border-emerald-600/60 shrink-0">
                          ✓ Aprovado para Cotação
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600/30 text-amber-300 border-amber-600/60 shrink-0">
                          Aguardando Aprovação
                        </Badge>
                      )}
                    </div>

                    {/* Botões de Ação para o Gestor */}
                    {canApproveExternal && (
                      <div className="pt-2 border-t border-cyan-900/40 flex flex-wrap gap-2 items-center">
                        <Button
                          size="sm"
                          onClick={handleApproveExternal}
                          disabled={isApproving}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-medium"
                        >
                          {isApproving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                          Aprovar Serviço Externo
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setIsRejectDialogOpen(true)}
                          disabled={isRejecting}
                          className="bg-red-600/80 hover:bg-red-600 text-white text-xs h-8 font-medium"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Recusar / Devolver
                        </Button>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 pt-1">
                      ℹ️ Após aprovação, notificações automáticas são disparadas ao <strong>Mecânico</strong> e ao setor de <strong>Compras</strong> para iniciar as cotações com fornecedores.
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ABA 4: DADOS DO VEÍCULO E SOLICITAÇÃO */}
              <TabsContent value="info" className="m-0 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Veículo / Placa</span>
                    <strong className="text-sm text-white">{workOrder.vehiclePlate}</strong>
                    <div className="text-slate-400 text-[11px] mt-0.5">{workOrder.vehicleModel}</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Tipo de Manutenção</span>
                    <strong className="text-white">{workOrder.maintenanceType}</strong>
                    <div className="text-slate-400 text-[11px] mt-0.5">Prioridade: {workOrder.priority || 'Média'}</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Motorista Solicitante</span>
                    <strong className="text-white">{workOrder.driverName || 'Não informado'}</strong>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Garagem de Execução</span>
                    <strong className="text-white">{workOrder.garageName || 'Principal'}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-xs font-semibold text-slate-300 block">Reclamação do Motorista / Motivo da Parada:</span>
                  <p className="text-xs text-amber-200/90 whitespace-pre-wrap">
                    {workOrder.stopReason || workOrder.notes || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 h-9 shadow-xs"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Recusa do Serviço Externo */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Recusar Serviço Externo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              A O.S. retornará para a oficina com a justificativa registrada para o mecânico.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label className="text-xs font-semibold text-slate-300">Motivo / Justificativa *</Label>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Serviço pode ser realizado internamente com peças do estoque..."
              className="bg-slate-900 border-slate-700 text-slate-100 text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectDialogOpen(false)}
              className="border-slate-700 text-slate-400 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectExternal}
              disabled={isRejecting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {isRejecting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Zoom da Foto */}
      {previewPhoto && (
        <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
          <DialogContent className="max-w-3xl bg-black/95 border-slate-800 p-2 flex flex-col items-center">
            <img src={previewPhoto} alt="Visualização" className="max-h-[80vh] w-auto object-contain rounded-md" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreviewPhoto(null)}
              className="mt-2 text-xs text-slate-300"
            >
              Fechar Visualização
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MechanicWorkOrderModal;
