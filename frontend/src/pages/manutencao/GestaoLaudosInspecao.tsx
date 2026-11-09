import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Download,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Camera,
  Loader2,
  Eye
} from 'lucide-react';
import vehicleInspectionService, {
  VehicleInspection,
  VehicleReleaseStatus
} from '@/services/vehicleInspectionService';
import { VehicleInspectionModal } from '@/components/manutencao/VehicleInspectionModal';
import {
  openVehicleInspectionPDFPreview,
  downloadVehicleInspectionPDF
} from '@/utils/vehicleInspectionPdfGenerator';

const STATUS_CONFIG: Record<
  VehicleReleaseStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  LIBERADO_SEM_RESTRICAO: {
    label: 'Liberado Sem Restrição',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: CheckCircle2,
  },
  LIBERADO_COM_RESTRICAO: {
    label: 'Liberado Com Restrição',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: AlertTriangle,
  },
  NAO_LIBERADO: {
    label: 'Bloqueado (Não Liberado)',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: XCircle,
  },
};

export const GestaoLaudosInspecao: React.FC = () => {
  const { toast } = useToast();

  const [inspections, setInspections] = useState<VehicleInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleReleaseStatus | 'ALL'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<VehicleInspection | null>(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleInspectionService.getInspections({
        search: searchTerm || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setInspections(data.content || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar laudos',
        description: err?.message || 'Falha ao buscar laudos de inspeção.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, toast]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleOpenCreate = () => {
    setSelectedInspection(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VehicleInspection) => {
    setSelectedInspection(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, reg: string) => {
    const ok = window.confirm(`Deseja realmente excluir o Laudo de Inspeção Nº ${reg}?`);
    if (!ok) return;

    try {
      await vehicleInspectionService.deleteInspection(id);
      toast({ title: 'Laudo Excluído', description: `Laudo Nº ${reg} removido com sucesso.` });
      loadInspections();
    } catch {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir o laudo.', variant: 'destructive' });
    }
  };

  const handlePreviewPdf = async (item: VehicleInspection) => {
    try {
      await openVehicleInspectionPDFPreview(item);
    } catch (err: any) {
      toast({ title: 'Erro ao abrir PDF', description: err?.message, variant: 'destructive' });
    }
  };

  const handleDownloadPdf = async (item: VehicleInspection) => {
    try {
      await downloadVehicleInspectionPDF(item);
      toast({ title: 'Download Iniciado', description: `PDF do Laudo Nº ${item.registryNumber} baixado.` });
    } catch (err: any) {
      toast({ title: 'Erro ao baixar PDF', description: err?.message, variant: 'destructive' });
    }
  };

  const totalCount = inspections.length;
  const semRestricaoCount = inspections.filter((i) => i.releaseStatus === 'LIBERADO_SEM_RESTRICAO').length;
  const comRestricaoCount = inspections.filter((i) => i.releaseStatus === 'LIBERADO_COM_RESTRICAO').length;
  const naoLiberadoCount = inspections.filter((i) => i.releaseStatus === 'NAO_LIBERADO').length;

  const countPhotos = (urls?: string) => {
    if (!urls) return 0;
    try {
      const parsed = JSON.parse(urls);
      return Array.isArray(parsed) ? parsed.filter(Boolean).length : 0;
    } catch {
      return urls.split(',').filter((s) => s.trim().length > 0).length;
    }
  };

  return (
    <StandardLayout
      title="Laudos de Inspeção Técnica"
      subtitle="Controle de vistorias, preventiva mensal, até 10 evidências fotográficas e liberação de veículos"
    >
      <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6 pb-24">
        {/* Cabeçalho de Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-seguranca-black/95 via-seguranca-graphite/80 to-seguranca-black/95 p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px] font-bold">
                  Manutenção & Segurança Veicular
                </Badge>
                <span className="text-xs text-zinc-400">Padrão Oficial Viação São Silvestre</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Laudos de Inspeção Técnica e Vistoria
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadInspections}
              disabled={loading}
              className="border-zinc-700 text-zinc-300 hover:bg-white/5 h-10 px-3.5 rounded-xl text-xs font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold h-10 px-5 rounded-xl shadow-lg shadow-amber-500/20 text-xs gap-1.5 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Novo Laudo de Inspeção
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-zinc-900 via-seguranca-darkgray to-black border-zinc-800 shadow-lg">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Total de Laudos</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1">{totalCount}</p>
                <span className="text-[10px] text-zinc-400">Vistorias registradas</span>
              </div>
              <div className="p-2.5 bg-zinc-800 rounded-xl text-amber-400 border border-zinc-700">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black border-emerald-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Liberados Sem Restrição</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{semRestricaoCount}</p>
                <span className="text-[10px] text-emerald-400/80">100% aptos para operação</span>
              </div>
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-950/40 via-zinc-900 to-black border-amber-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Com Restrição</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">{comRestricaoCount}</p>
                <span className="text-[10px] text-amber-400/80">Operação condicional</span>
              </div>
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/40">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-950/40 via-zinc-900 to-black border-rose-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">Não Liberados</p>
                <p className="text-2xl sm:text-3xl font-black text-rose-300 mt-1">{naoLiberadoCount}</p>
                <span className="text-[10px] text-rose-400/80">Bloqueados para tráfego</span>
              </div>
              <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/40">
                <XCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Barra de Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-black/40 border border-white/10 rounded-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, nº registro, cliente, obra ou serviço..."
              className="pl-9 bg-black/60 border-zinc-700 h-9 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Button
              size="sm"
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ALL')}
              className={`h-8 text-xs font-semibold px-3 rounded-lg ${
                statusFilter === 'ALL' ? 'bg-amber-500 text-black font-bold' : 'border-zinc-700 text-zinc-400'
              }`}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'LIBERADO_SEM_RESTRICAO' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('LIBERADO_SEM_RESTRICAO')}
              className={`h-8 text-xs font-semibold px-3 rounded-lg ${
                statusFilter === 'LIBERADO_SEM_RESTRICAO'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'border-emerald-500/40 text-emerald-400'
              }`}
            >
              Liberados
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'LIBERADO_COM_RESTRICAO' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('LIBERADO_COM_RESTRICAO')}
              className={`h-8 text-xs font-semibold px-3 rounded-lg ${
                statusFilter === 'LIBERADO_COM_RESTRICAO'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'border-amber-500/40 text-amber-400'
              }`}
            >
              Com Restrição
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'NAO_LIBERADO' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('NAO_LIBERADO')}
              className={`h-8 text-xs font-semibold px-3 rounded-lg ${
                statusFilter === 'NAO_LIBERADO'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'border-rose-500/40 text-rose-400'
              }`}
            >
              Bloqueados
            </Button>
          </div>
        </div>

        {/* Tabela de Laudos */}
        <Card className="bg-zinc-950/70 border-white/10 shadow-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-white/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-amber-400" />
                Registros de Laudos de Inspeção
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Laudos técnicos com evidências fotográficas e termo de responsabilidade
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-400 mb-2" />
                <p className="text-xs">Carregando laudos de inspeção...</p>
              </div>
            ) : inspections.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 space-y-3">
                <FileText className="h-12 w-12 mx-auto text-zinc-600 opacity-40" />
                <p className="text-sm font-semibold text-zinc-300">Nenhum laudo de inspeção encontrado</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Clique no botão acima para cadastrar um novo laudo preventivo com até 10 fotos de evidências.
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="bg-amber-500 text-black font-bold text-xs"
                >
                  <Plus className="h-4 w-4 mr-1" /> Criar Primeiro Laudo
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-zinc-400 border-b border-white/10 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Nº Registro</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Placa / Veículo</th>
                      <th className="py-3 px-4">Obra / Cliente</th>
                      <th className="py-3 px-4">KM & Horas</th>
                      <th className="py-3 px-4">Status de Liberação</th>
                      <th className="py-3 px-4">Evidências</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {inspections.map((item) => {
                      const cfg = STATUS_CONFIG[item.releaseStatus] || STATUS_CONFIG.LIBERADO_SEM_RESTRICAO;
                      const Icon = cfg.icon;
                      const photoCount = countPhotos(item.evidencesUrls);

                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                            #{item.registryNumber || '14598'}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                            {item.inspectionDate ? item.inspectionDate.split('-').reverse().join('/') : '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            <span className="font-mono text-sm px-2 py-0.5 bg-black/60 rounded border border-zinc-700">
                              {item.vehiclePlate}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            <div className="font-semibold text-white">{item.projectName || 'VALE'}</div>
                            <div className="text-[10px] text-zinc-400">Cliente: {item.clientName || 'MSM'}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                            <div>{item.currentMileage != null ? `${item.currentMileage} km` : '7000 km'}</div>
                            <div className="text-[10px] text-sky-400">{item.horimeterHours || '215HRS'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border} text-[10px] font-bold py-0.5 gap-1`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-mono ${
                                photoCount > 0
                                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                  : 'border-zinc-700 text-zinc-400 bg-black/40'
                              }`}
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              {photoCount}/10 fotos
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreviewPdf(item)}
                                title="Visualizar / Imprimir PDF Oficial"
                                className="h-7 px-2 border-amber-500/40 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Ver PDF</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPdf(item)}
                                title="Baixar PDF"
                                className="h-7 w-7 p-0 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(item)}
                                title="Editar Laudo"
                                className="h-7 w-7 p-0 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(item.id, item.registryNumber)}
                                title="Excluir Laudo"
                                className="h-7 w-7 p-0 border-rose-500/40 hover:bg-rose-500/20 text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Criação / Edição do Laudo */}
      <VehicleInspectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        inspection={selectedInspection}
        onSuccess={loadInspections}
      />
    </StandardLayout>
  );
};

export default GestaoLaudosInspecao;

