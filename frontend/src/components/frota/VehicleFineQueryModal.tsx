import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Car,
  DollarSign,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
  ChevronsUpDown,
  Database,
  Keyboard,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import vehicleFineQueryService, {
  VehicleFineQueryResponse,
  InfracaoDetalhada,
} from '@/services/vehicleFineQueryService';

interface VehicleFineQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
  initialRenavam?: string;
  initialUf?: string;
  onFinesUpdated?: () => void;
}

export const VehicleFineQueryModal: React.FC<VehicleFineQueryModalProps> = ({
  isOpen,
  onClose,
  initialPlate = '',
  initialRenavam = '',
  initialUf = 'MG',
  onFinesUpdated,
}) => {
  const { toast } = useToast();
  const [searchMode, setSearchMode] = useState<'fleet' | 'manual'>('fleet');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const [placa, setPlaca] = useState(initialPlate);
  const [renavam, setRenavam] = useState(initialRenavam);
  const [uf, setUf] = useState(initialUf);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [result, setResult] = useState<VehicleFineQueryResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFleetVehicles();
      if (initialPlate) {
        setPlaca(initialPlate);
        setRenavam(initialRenavam);
        setUf(initialUf || 'MG');
        handleSearch(false, initialPlate, initialRenavam, initialUf);
      } else {
        setPlaca('');
        setRenavam('');
        setUf('MG');
        setSelectedVehicle(null);
        setResult(null);
      }
    }
  }, [isOpen, initialPlate, initialRenavam, initialUf]);

  const loadFleetVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await fleetService.getVehicles();
      const list = Array.isArray(data) ? data : [];
      setVehicles(list);

      if (initialPlate && list.length > 0) {
        const cleanInitial = initialPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const found = list.find((v) => {
          const vPlate = (v.plate || (v as any).placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          return vPlate === cleanInitial;
        });
        if (found) {
          setSelectedVehicle(found);
          setSearchMode('fleet');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar veículos da frota:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSelectFleetVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const cleanPlate = (vehicle.plate || (vehicle as any).placa || '').toUpperCase();
    const cleanRenavam = ((vehicle as any).renavam || (vehicle as any).renavan || '').replace(/\D/g, '');
    const cleanUf = ((vehicle as any).uf || (vehicle as any).state || 'MG').toUpperCase();

    setPlaca(cleanPlate);
    setRenavam(cleanRenavam);
    setUf(cleanUf);
    setComboboxOpen(false);
  };

  const handleClearSelectedVehicle = () => {
    setSelectedVehicle(null);
    setPlaca('');
    setRenavam('');
    setUf('MG');
  };

  const validatePlate = (plate: string) => {
    const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const regexTradicional = /^[A-Z]{3}[0-9]{4}$/;
    return regexMercosul.test(clean) || regexTradicional.test(clean);
  };

  const handleSearch = async (
    forceRefresh = false,
    searchPlate = placa,
    searchRenavam = renavam,
    searchUf = uf
  ) => {
    const cleanPlate = searchPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleanPlate) {
      toast({
        title: 'Placa obrigatória',
        description: 'Por favor, informe a placa do veículo para realizar a consulta.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePlate(cleanPlate)) {
      toast({
        title: 'Formato de placa inválido',
        description: 'Utilize o formato padrão Mercosul (ex: ABC1D23) ou Tradicional (ex: ABC-1234).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await vehicleFineQueryService.consultarMultas({
        placa: cleanPlate,
        renavam: searchRenavam?.trim() || undefined,
        uf: searchUf?.trim() || 'MG',
        forceRefresh,
      });

      setResult(data);
      if (data.total_importadas_sistema && data.total_importadas_sistema > 0) {
        toast({
          title: 'Sincronização Automática',
          description: `${data.total_importadas_sistema} nova(s) multa(s) vinculada(s) à gestão do veículo!`,
        });
        if (onFinesUpdated) {
          onFinesUpdated();
        }
      }
    } catch (error: any) {
      console.error('Erro na consulta veicular:', error);
      toast({
        title: 'Falha na consulta veicular',
        description:
          error?.response?.data?.message ||
          'Serviço temporariamente indisponível. Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const blob = await vehicleFineQueryService.baixarExtratoPdf(result);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato-multas-${result.dados_veiculo?.placa || 'veiculo'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Extrato Gerado',
        description: 'O PDF do extrato de multas e condutores foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível gerar o PDF do extrato.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-3.5 sm:p-6 bg-card border-border text-foreground shadow-2xl w-[96vw] sm:w-full">
        <DialogHeader className="border-b border-border pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-sm shrink-0">
                <Car className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-xl font-bold flex flex-wrap items-center gap-1.5 sm:gap-2 text-foreground leading-tight">
                  Consulta de Multas e Restrições Veiculares
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] sm:text-xs">
                    Parte Diária Integrada
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Consulta consolidada de autuações com apuração inteligente do motorista por rotas e diárias.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Formulário de Busca com Abas/Alternador */}
        <div className="bg-muted/20 p-3 sm:p-4 rounded-xl border border-border mt-3 sm:mt-4">
          {/* Alternador de Modo: Frota vs Manual */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3 sm:mb-4 pb-3 border-b border-border/60">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSearchMode('fleet')}
                className={cn(
                  "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-center",
                  searchMode === 'fleet'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Database className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Base do Sistema</span>
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('manual')}
                className={cn(
                  "flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-center",
                  searchMode === 'manual'
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Keyboard className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Manual</span>
              </button>
            </div>

            {searchMode === 'fleet' ? (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-blue-400" />
                {loadingVehicles
                  ? 'Carregando veículos cadastrados...'
                  : `${vehicles.length} veículo(s) cadastrado(s) na frota`}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Digite a placa de qualquer veículo para consultar
              </span>
            )}
          </div>

          {/* Modo Frota: Campo de Busca com Dropdown Inteligente */}
          {searchMode === 'fleet' && (
            <div className="space-y-3 mb-4">
              <div>
                <Label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                  Selecionar Veículo da Frota
                </Label>
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between bg-background/60 border-border text-foreground hover:bg-muted/40 h-10 px-3 text-sm font-normal rounded-lg shadow-sm"
                      disabled={loading || loadingVehicles}
                    >
                      {loadingVehicles ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          Carregando frota do sistema...
                        </span>
                      ) : selectedVehicle ? (
                        <span className="flex items-center gap-2 truncate">
                          <Car className="h-4 w-4 text-blue-400 shrink-0" />
                          <span className="font-mono font-bold text-foreground">
                            {selectedVehicle.plate || (selectedVehicle as any).placa}
                          </span>
                          {selectedVehicle.fleetNumber && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-500/30 text-blue-400 bg-blue-500/10">
                              #{selectedVehicle.fleetNumber}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-xs truncate">
                            • {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year ? `(${selectedVehicle.year})` : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground/60" />
                          Clique para buscar por placa, modelo, marca ou prefixo...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border text-popover-foreground shadow-2xl rounded-xl z-[10080]"
                    align="start"
                  >
                    <Command className="bg-popover text-popover-foreground">
                      <CommandInput
                        placeholder="Buscar por placa, modelo, marca ou prefixo..."
                        className="border-b border-border text-foreground placeholder:text-muted-foreground text-sm"
                      />
                      <CommandList className="max-h-[260px] overflow-y-auto">
                        <CommandEmpty className="text-muted-foreground py-6 text-center text-xs">
                          Nenhum veículo encontrado na frota.
                        </CommandEmpty>
                        <CommandGroup heading="Veículos da Frota">
                          {vehicles.map((v) => {
                            const plateStr = (v.plate || (v as any).placa || '').toUpperCase();
                            const isSelected = selectedVehicle?.id === v.id;
                            return (
                              <CommandItem
                                key={v.id}
                                value={`${plateStr} ${v.fleetNumber || ''} ${v.brand || ''} ${v.model || ''}`}
                                onSelect={() => handleSelectFleetVehicle(v)}
                                className="cursor-pointer py-2.5 px-3 flex items-center justify-between hover:bg-muted/50 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <Car className={cn("h-4 w-4 shrink-0", isSelected ? "text-blue-400" : "text-muted-foreground")} />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-foreground">{plateStr}</span>
                                      {v.fleetNumber && (
                                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-border text-muted-foreground">
                                          #{v.fleetNumber}
                                        </Badge>
                                      )}
                                      {v.status && (
                                        <Badge
                                          className={cn(
                                            "text-[9px] py-0 px-1",
                                            v.status === 'ACTIVE'
                                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                              : "bg-muted text-muted-foreground"
                                          )}
                                        >
                                          {v.status === 'ACTIVE' ? 'Ativo' : v.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {v.brand} {v.model} {v.year ? `• ${v.year}` : ''}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-blue-400 ml-2 shrink-0" />}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Resumo Visual Sutil do Veículo Selecionado */}
              {selectedVehicle && (
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                      <Car className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </span>
                        {selectedVehicle.year && (
                          <span className="text-muted-foreground">({selectedVehicle.year})</span>
                        )}
                        {selectedVehicle.fleetNumber && (
                          <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                            Prefixo: {selectedVehicle.fleetNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5 flex-wrap">
                        <span>Placa: <strong className="text-foreground font-mono">{selectedVehicle.plate || (selectedVehicle as any).placa}</strong></span>
                        {((selectedVehicle as any).renavam || (selectedVehicle as any).renavan) && (
                          <span>RENAVAM: <strong className="text-foreground font-mono">{(selectedVehicle as any).renavam || (selectedVehicle as any).renavan}</strong></span>
                        )}
                        <span>Status: <strong className="text-emerald-400">{selectedVehicle.status === 'ACTIVE' ? 'Ativo na Frota' : selectedVehicle.status}</strong></span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelectedVehicle}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    title="Desmarcar veículo"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Trocar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Grid de Campos (Placa, RENAVAM, UF e Consultar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold text-foreground/80">Placa do Veículo *</Label>
              <Input
                placeholder="Ex: ABC1D23"
                value={placa}
                onChange={(e) => {
                  setPlaca(e.target.value.toUpperCase());
                  if (selectedVehicle && e.target.value.toUpperCase() !== (selectedVehicle.plate || (selectedVehicle as any).placa)) {
                    setSelectedVehicle(null);
                  }
                }}
                className="mt-1 font-mono uppercase tracking-wider font-semibold text-base bg-background/60 border-border focus-visible:ring-blue-500 h-10"
                maxLength={8}
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground/80">RENAVAM (Opcional)</Label>
              <Input
                placeholder="Ex: 00123456789"
                value={renavam}
                onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ''))}
                className="mt-1 bg-background/60 border-border focus-visible:ring-blue-500 h-10"
                maxLength={11}
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-foreground/80">UF de Registro</Label>
              <Input
                placeholder="MG"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="mt-1 uppercase bg-background/60 border-border focus-visible:ring-blue-500 h-10"
                maxLength={2}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSearch(false)}
                disabled={loading || !placa.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all h-10 text-xs sm:text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar
                  </>
                )}
              </Button>

              {result && (
                <Button
                  variant="outline"
                  size="icon"
                  title="Forçar atualização na API externa (ignorar cache)"
                  onClick={() => handleSearch(true)}
                  disabled={loading}
                  className="border-border bg-background/60 hover:bg-muted text-foreground h-10 w-10 shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4 animate-pulse">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Consultando Bases de Trânsito</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Verificando Detran, DNIT, órgãos municipais e cruzando com as Partes Diárias de motoristas...
            </p>
          </div>
        )}

        {/* Resultados */}
        {!loading && result && (
          <div className="space-y-6 mt-4">
            {/* Metadados da consulta */}
            <div className="flex items-center justify-between bg-muted/30 px-3.5 py-2.5 rounded-lg text-xs text-muted-foreground border border-border">
              <div className="flex items-center gap-2">
                <span>Origem dos Dados:</span>
                <Badge
                  variant="secondary"
                  className={
                    result.origem_dados === 'API_LIVE'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : result.origem_dados === 'CACHE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }
                >
                  {result.origem_dados === 'API_LIVE'
                    ? '🔴 API Em Tempo Real'
                    : result.origem_dados === 'CACHE'
                    ? '⚡ Cache Local (Economia de Créditos)'
                    : '🧪 Provedor Sandbox / Simulado'}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  Consultado em:{' '}
                  {result.consultado_em
                    ? new Date(result.consultado_em).toLocaleString('pt-BR')
                    : new Date().toLocaleString('pt-BR')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="h-7 text-xs bg-card hover:bg-muted text-foreground border-border"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  )}
                  Baixar Extrato PDF
                </Button>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                  <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-sm sm:text-lg font-bold text-foreground tracking-tight truncate">
                    {result.dados_veiculo?.marca_modelo || 'N/D'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">{result.dados_veiculo?.placa}</span>
                    <span>{result.dados_veiculo?.ano_modelo || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                  <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    Multas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold text-amber-500">
                    {result.resumo_debitos?.quantidade_multas || 0}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {result.resumo_debitos?.quantidade_multas ? 'Pendências ativas' : 'Sem autuações'}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                  <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    Total Débitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-base sm:text-2xl font-bold text-rose-500 truncate">
                    R${' '}
                    {(result.resumo_debitos?.valor_total || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Consolidado</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border bg-card">
                <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                  <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    Restrições
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  {result.restricoes && result.restricoes.length > 0 ? (
                    <div>
                      <Badge variant="destructive" className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px]">
                        {result.restricoes.length} Restrição(ões)
                      </Badge>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {result.restricoes[0].descricao}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Sem Restrições
                      </Badge>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Veículo regular</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Restrições Detalhadas (se existirem) */}
            {result.restricoes && result.restricoes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 sm:p-4 rounded-xl">
                <div className="flex items-center gap-2 font-semibold text-amber-400 text-xs sm:text-sm mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Restrições Administrativas e Judiciais Encontradas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {result.restricoes.map((r, idx) => (
                    <div key={idx} className="bg-card p-2.5 sm:p-3 rounded-lg border border-amber-500/20 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{r.tipo}</span>
                        <Badge variant="outline" className="text-[10px] border-border">{r.status || 'ATIVO'}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-[11px]">{r.descricao}</p>
                      {r.orgao && <p className="text-muted-foreground/70 mt-0.5 text-[10px]">Órgão: {r.orgao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Multas e Apuração da Parte Diária */}
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="p-3 sm:p-4 bg-muted/20 border-b border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-2">
                    Discriminação das Infrações & Cruzamento com a Parte Diária
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                      {result.infracoes?.length || 0} infrações
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                    O sistema cruza automaticamente o dia e o horário da infração com os registros de Partes Diárias para indicar o motorista em serviço.
                  </p>
                </div>
              </div>

              {result.infracoes && result.infracoes.length > 0 ? (
                <>
                  {/* Visualização Mobile (Cards) */}
                  <div className="block md:hidden p-3 space-y-3">
                    {result.infracoes.map((inf, idx) => (
                      <div
                        key={`modal-mobile-fine-${idx}`}
                        className="bg-muted/30 border border-border rounded-xl p-3 space-y-2.5"
                      >
                        {/* Auto e Valor */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-mono font-bold text-xs text-foreground">
                              {inf.auto_infracao}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {inf.orgao_autuador || 'Órgão Autuador'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-sm text-foreground">
                              R${' '}
                              {(inf.valor || 0).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30 mt-0.5">
                              {inf.situacao || 'PENDENTE'}
                            </Badge>
                          </div>
                        </div>

                        {/* Código, Pontos e Descrição */}
                        <div className="bg-background/60 rounded-lg p-2 border border-border/60 text-xs">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="font-mono text-[9px] border-border text-foreground/80">
                              {inf.codigo_infracao || '7455-0'}
                            </Badge>
                            {inf.pontos ? (
                              <span className="text-[10px] font-semibold text-rose-500">
                                {inf.pontos} pontos
                              </span>
                            ) : null}
                            {inf.ja_cadastrada_no_sistema && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">
                                Sincronizada
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-foreground/90 leading-tight">
                            {inf.descricao}
                          </p>
                        </div>

                        {/* Motorista Apurado na Parte Diária */}
                        {inf.motorista_apurado ? (
                          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-blue-300 flex items-center gap-1 text-[11px]">
                                <User className="h-3 w-3 text-blue-400 shrink-0" />
                                {inf.motorista_apurado.driver_name}
                              </span>
                              <Badge
                                className={`text-[8px] px-1 py-0 h-3.5 ${
                                  inf.motorista_apurado.confianca_cruzamento === 'ALTA'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-500 text-white'
                                }`}
                              >
                                {inf.motorista_apurado.confianca_cruzamento === 'ALTA' ? 'Horário Exato' : 'Mesmo Dia'}
                              </Badge>
                            </div>
                            {inf.motorista_apurado.parte_diaria_number && (
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground/70" />
                                Diária #{inf.motorista_apurado.parte_diaria_number}
                                {inf.motorista_apurado.horario_inicio && inf.motorista_apurado.horario_fim && (
                                  <span>({inf.motorista_apurado.horario_inicio} - {inf.motorista_apurado.horario_fim})</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/60 italic px-1">
                            Nenhuma diária localizada para este horário.
                          </div>
                        )}

                        {/* Data e Local */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {inf.data_hora ? new Date(inf.data_hora).toLocaleDateString('pt-BR') : 'Data N/D'}
                          </span>
                          <span className="truncate max-w-[180px]" title={inf.local}>
                            {inf.local || 'Local não informado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visualização Desktop (Tabela) */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-border">
                          <TableHead className="text-xs font-bold text-foreground/80">Auto / Órgão</TableHead>
                          <TableHead className="text-xs font-bold text-foreground/80">Código / Descrição</TableHead>
                          <TableHead className="text-xs font-bold text-blue-400 bg-blue-500/5">
                            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                              <User className="h-3.5 w-3.5" />
                              Motorista Apurado (Parte Diária)
                            </div>
                          </TableHead>
                          <TableHead className="text-xs font-bold text-foreground/80">Data / Local</TableHead>
                          <TableHead className="text-xs font-bold text-foreground/80 text-right">Valor / Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.infracoes.map((inf, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30 border-border">
                            {/* Auto e Órgão */}
                            <TableCell className="align-top py-3">
                              <div className="font-mono font-bold text-xs text-foreground">
                                {inf.auto_infracao}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {inf.orgao_autuador || 'Órgão Autuador'}
                              </div>
                              {inf.ja_cadastrada_no_sistema && (
                                <Badge variant="outline" className="mt-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-normal">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Sincronizada no Sistema
                                </Badge>
                              )}
                            </TableCell>

                            {/* Código e Descrição */}
                            <TableCell className="align-top py-3 max-w-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-[10px] border-border text-foreground/80">
                                  {inf.codigo_infracao || '7455-0'}
                                </Badge>
                                {inf.pontos ? (
                                  <span className="text-[11px] font-semibold text-rose-500">
                                    {inf.pontos} pontos
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-foreground/90 mt-1 line-clamp-2" title={inf.descricao}>
                                {inf.descricao}
                              </p>
                            </TableCell>

                            {/* Motorista Apurado na Parte Diária */}
                            <TableCell className="align-top py-3 bg-blue-500/5">
                              {inf.motorista_apurado ? (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-blue-300 flex items-center gap-1">
                                      <User className="h-3 w-3 text-blue-400" />
                                      {inf.motorista_apurado.driver_name}
                                    </span>
                                    <Badge
                                      className={`text-[9px] px-1.5 py-0 h-4 ${
                                        inf.motorista_apurado.confianca_cruzamento === 'ALTA'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-amber-500 text-white'
                                      }`}
                                    >
                                      {inf.motorista_apurado.confianca_cruzamento === 'ALTA'
                                        ? 'Horário Exato'
                                        : 'Mesmo Dia'}
                                    </Badge>
                                  </div>

                                  {inf.motorista_apurado.parte_diaria_number && (
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground/70" />
                                      Diária #{inf.motorista_apurado.parte_diaria_number}
                                      {inf.motorista_apurado.horario_inicio && inf.motorista_apurado.horario_fim && (
                                        <span className="text-muted-foreground/70">
                                          ({inf.motorista_apurado.horario_inicio} - {inf.motorista_apurado.horario_fim})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {inf.motorista_apurado.obra_nome && (
                                    <div className="text-[10px] text-muted-foreground/80 truncate max-w-[200px]">
                                      Obra: {inf.motorista_apurado.obra_nome}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground/60 italic">
                                  Nenhuma diária localizada para este horário.
                                </div>
                              )}
                            </TableCell>

                            {/* Data e Local */}
                            <TableCell className="align-top py-3">
                              <div className="text-xs text-foreground font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                                {inf.data_hora
                                  ? new Date(inf.data_hora).toLocaleString('pt-BR')
                                  : 'Data não informada'}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1 max-w-[220px]">
                                <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0 mt-0.5" />
                                <span className="truncate" title={inf.local}>{inf.local || 'Local não informado'}</span>
                              </div>
                            </TableCell>

                            {/* Valor e Situação */}
                            <TableCell className="align-top py-3 text-right">
                              <div className="text-xs font-bold text-foreground">
                                R${' '}
                                {(inf.valor || 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              {inf.data_vencimento && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Venc: {inf.data_vencimento}
                                </div>
                              )}
                              <Badge variant="outline" className="mt-1 text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                {inf.situacao || 'PENDENTE'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  Nenhuma infração pendente encontrada para este veículo.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFineQueryModal;
