import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, RefreshCw, Filter, Eye, Edit, Trash2, AlertTriangle, MapPin, Fuel, Calendar, Clock, DollarSign, TrendingUp, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { KmControl } from '@/types/fleet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import reportService from '@/services/reportService';
import kmControlService from '@/services/kmControlService';
// import { ImageViewerModal } from '@/components/ImageViewerModal';
import { Checkbox } from '@/components/ui/checkbox';
import { ReportFilters } from '@/services/reportService'; // Importar ReportFilters do reportService do frontend

interface KmControlTableProps {
  kmControls: KmControl[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (kmControl: KmControl) => void;
  onView: (kmControl: KmControl) => void;
  onDelete: (kmControl: KmControl) => void;
}

export const KmControlTable: React.FC<KmControlTableProps> = ({
  kmControls,
  onRefresh,
  onCreate,
  onEdit,
  onView,
  onDelete
}) => {
  const parseLocalDate = (value: string): Date => {
    if (!value) return new Date(NaN);
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return new Date(value);
  };

  const formatLocalBR = (value: string): string => {
    const d = parseLocalDate(value);
    if (isNaN(d.getTime())) return value || '-';
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };
  // Debug logs
  console.log('🔍 KmControlTable: Componente renderizado com props:', {
    dataLength: kmControls?.length || 0,
    dataType: typeof kmControls,
    isArray: Array.isArray(kmControls),
    firstItem: kmControls?.[0] || null
  });

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [allSupervisors, setAllSupervisors] = useState<string[]>([]);
  // Removido fluxo de upload/visualização de Foto do Painel nesta tela
  const [selectedKmControlIds, setSelectedKmControlIds] = useState<Set<string>>(new Set());

  // Removendo companyInfo pois será gerado no backend
  // const companyInfo = {
  //   name: "SEGURANÇA ELETRÔNICA LTDA",
  //   address: "Rua da Segurança, 123 - Centro, Cidade - UF",
  //   phone: "(XX) XXXX-XXXX",
  //   email: "contato@seguranca.com.br"
  // };

  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    supervisor: 'all',
    vehiclePlate: 'all'
  });

  // Função para formatar horário no padrão brasileiro
  const formatTime = (timeString: string) => {
    if (!timeString) return '-';

    try {
      // Se já estiver no formato HH:mm, retorna como está
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }

      // Se for um timestamp ou outro formato, converte
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) {
        return timeString; // Retorna original se não conseguir converter
      }

      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.warn('Erro ao formatar horário:', timeString, error);
      return timeString;
    }
  };

  // Buscar supervisores ao carregar o componente
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const supervisors = await kmControlService.getSupervisors();
        setAllSupervisors(supervisors);
      } catch (error) {
        console.error('Erro ao buscar supervisores:', error);
        // Fallback para supervisores dos registros existentes
        if (kmControls && Array.isArray(kmControls)) {
          const existingSupervisors = [...new Set(kmControls.map(control => control.supervisor))];
          setAllSupervisors(existingSupervisors.sort());
        } else {
          setAllSupervisors([]);
        }
      }
    };

    fetchSupervisors();
  }, [kmControls]);

  // Dados filtrados para busca
  const filteredKmControls = useMemo(() => {
    if (!kmControls || !Array.isArray(kmControls)) {
      return [];
    }
    return kmControls.filter(control => {
      const matchesSearch =
        control.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.workPost.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        '';

      return matchesSearch;
    });
  }, [kmControls, searchTerm]);

  // Dados filtrados para relatório
  const filteredReportData = useMemo(() => {
    if (!kmControls || !Array.isArray(kmControls)) {
      return [];
    }

    let filtered = kmControls;

    if (reportFilters.startDate) {
      filtered = filtered.filter(control => control.date >= reportFilters.startDate);
    }
    if (reportFilters.endDate) {
      filtered = filtered.filter(control => control.date <= reportFilters.endDate);
    }
    if (reportFilters.supervisor !== 'all') {
      filtered = filtered.filter(control => control.supervisor === reportFilters.supervisor);
    }
    if (reportFilters.vehiclePlate !== 'all') {
      filtered = filtered.filter(control => control.vehiclePlate === reportFilters.vehiclePlate);
    }

    return filtered;
  }, [kmControls, reportFilters]);

  // Lista única de supervisores (combinando API e dados existentes)
  const uniqueSupervisors = useMemo(() => {
    // Usar supervisores da API se disponível, senão usar dos dados existentes
    if (allSupervisors.length > 0) {
      return allSupervisors;
    }
    if (!kmControls || !Array.isArray(kmControls)) {
      return [];
    }
    const supervisors = [...new Set(kmControls.map(control => control.supervisor))];
    return supervisors.sort();
  }, [allSupervisors, kmControls]);

  // Lista única de placas de veículos
  const uniqueVehiclePlates = useMemo(() => {
    if (!kmControls || !Array.isArray(kmControls)) {
      return [];
    }
    const plates = [...new Set(kmControls.map(control => control.vehiclePlate).filter(Boolean))];
    return plates.sort();
  }, [kmControls]);

  // Cálculos para os totais do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const kmControlsThisMonth = useMemo(() => {
    if (!kmControls || !Array.isArray(kmControls)) {
      return [];
    }
    return kmControls.filter(control => {
      const controlDate = new Date(control.date);
      return controlDate.getMonth() === currentMonth && controlDate.getFullYear() === currentYear;
    });
  }, [kmControls, currentMonth, currentYear]);

  const totalKmMes = useMemo(() => {
    if (!kmControlsThisMonth || !Array.isArray(kmControlsThisMonth)) {
      return 0;
    }
    return kmControlsThisMonth.reduce((sum, control) => sum + (control.totalKm || 0), 0);
  }, [kmControlsThisMonth]);

  const totalValorMes = useMemo(() => {
    if (!kmControlsThisMonth || !Array.isArray(kmControlsThisMonth)) {
      return 0;
    }
    return kmControlsThisMonth.reduce((sum, control) => sum + (control.value || 0), 0);
  }, [kmControlsThisMonth]);

  const supervisoresMes = useMemo(() => {
    if (!kmControlsThisMonth || !Array.isArray(kmControlsThisMonth)) {
      return 0;
    }
    const uniqueSupervisorsThisMonth = new Set(kmControlsThisMonth.map(control => control.supervisor));
    return uniqueSupervisorsThisMonth.size;
  }, [kmControlsThisMonth]);

  // Função para gerar relatório PDF
  const generatePDFReport = async () => {
    try {
      setIsGeneratingReport(true);

      // Validar filtros
      const validation = reportService.validateFilters(reportFilters);
      if (!validation.isValid) {
        toast({
          title: "Erro de Validação",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Chamar o backend para gerar o relatório PDF
      const response = await reportService.generateReport(reportFilters, 'pdf');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_km_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Relatório PDF Gerado",
        description: `Relatório foi baixado com sucesso!`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório PDF:', error);
      toast({
        title: "Erro ao Gerar Relatório",
        description: error.message || "Não foi possível gerar o relatório PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Função para gerar relatório Excel
  const generateExcelReport = async () => {
    try {
      setIsGeneratingReport(true);

      // Validar filtros
      const validation = reportService.validateFilters(reportFilters);
      if (!validation.isValid) {
        toast({
          title: "Erro de Validação",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      // Chamar o backend para gerar o relatório Excel
      const response = await reportService.generateReport(reportFilters, 'xlsx');
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_km_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Relatório Excel Gerado",
        description: `Relatório foi baixado com sucesso!`,
        variant: "default"
      });
    } catch (error: unknown) {
      console.error('❌ Erro ao gerar relatório Excel:', error);
      toast({
        title: "Erro ao Gerar Relatório",
        description: error.message || "Não foi possível gerar o relatório Excel",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Função para limpar filtros
  const clearReportFilters = () => {
    setReportFilters({
      startDate: '',
      endDate: '',
      supervisor: 'all',
      vehiclePlate: 'all'
    });
  };

  // Calcular estatísticas
  const totalKm = filteredKmControls && Array.isArray(filteredKmControls)
    ? filteredKmControls.reduce((sum, control) => sum + (control.totalKm || 0), 0)
    : 0;
  const totalValue = filteredKmControls && Array.isArray(filteredKmControls)
    ? filteredKmControls.reduce((sum, control) => sum + (control.value || 0), 0)
    : 0;
  const averageKmPerDay = filteredKmControls && filteredKmControls.length > 0 ? totalKm / filteredKmControls.length : 0;

  // Função para fechar modal de upload
  // (removido: funções de upload/visualização)

  const isAllSelected = filteredKmControls.length > 0 && selectedKmControlIds.size === filteredKmControls.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredKmControls.map(control => control.id));
      setSelectedKmControlIds(allIds);
    } else {
      setSelectedKmControlIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedKmControlIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedKmControlIds.size === 0) return;

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedKmControlIds.size} registros de KM selecionados?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedKmControlIds).map(id => kmControlService.deleteKmControl(id));
      await Promise.all(deletePromises);

      toast({
        title: "Sucesso",
        description: `${selectedKmControlIds.size} registros de KM excluídos com sucesso!`,
        variant: "default"
      });

      setSelectedKmControlIds(new Set());
      onRefresh();
    } catch (error: unknown) {
      console.error('❌ Erro ao excluir controles de KM selecionados:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao excluir controles de KM selecionados",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                <MapPin className="h-5 w-5 text-seguranca-yellow" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Total KM</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  {totalKm !== null && totalKm !== undefined ? totalKm.toLocaleString() : '0'} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Valor Total</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  R$ {totalValue !== null && totalValue !== undefined ? totalValue.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Média KM/Dia</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  {averageKmPerDay !== null && averageKmPerDay !== undefined ? averageKmPerDay.toFixed(1) : '0.0'} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Registros</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  {filteredKmControls.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novos cards de Totais do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">KM Total do Mês</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  {totalKmMes !== null && totalKmMes !== undefined ? totalKmMes.toLocaleString() : '0'} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Valor Total do Mês</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  R$ {totalValorMes !== null && totalValorMes !== undefined ? totalValorMes.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600 hover:bg-seguranca-black/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 font-medium">Supervisores Ativos (Mês)</p>
                <p className="text-xl font-bold text-seguranca-lightgray">
                  {supervisoresMes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl text-seguranca-lightgray mb-2">
                Controle de Quilometragem
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Gerencie os registros de quilometragem da frota
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {selectedKmControlIds.size > 0 && (
                <Button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                  size="sm"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir Selecionados ({selectedKmControlIds.size})
                </Button>
              )}
              <Button
                onClick={() => setIsReportModalOpen(true)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 w-full sm:w-auto"
              >
                <FileText size={16} className="mr-2" />
                Gerar Relatório
              </Button>
              <Button
                onClick={onCreate}
                className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
                size="sm"
              >
                <Plus size={16} className="mr-2" />
                Novo Registro
              </Button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Buscar por supervisor, posto ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray h-10"
              />
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-700 h-10 px-4"
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600 hover:bg-gray-700/50">
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3">Data</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                      className="mr-2"
                    />
                    Supervisor
                  </TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3">Veículo</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">Combustível</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">KM Inicial</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">KM Final</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">KM Total</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">Valor</TableHead>
                  <TableHead className="text-seguranca-lightgray font-semibold px-4 py-3 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKmControls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400 py-12">
                      <div className="flex flex-col items-center space-y-2">
                        <MapPin className="h-8 w-8 text-gray-500" />
                        <p className="text-lg font-medium">Nenhum registro encontrado</p>
                        <p className="text-sm">Crie um novo registro para começar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKmControls.map((control) => (
                    <TableRow key={control.id} className="border-gray-600 hover:bg-gray-700/50 transition-colors">
                      <TableCell className="text-seguranca-lightgray px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {formatLocalBR(control.date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3">
                        <Checkbox
                          checked={selectedKmControlIds.has(control.id)}
                          onCheckedChange={(checked: boolean) => handleSelectOne(control.id, checked)}
                          aria-label={`Selecionar ${control.supervisor}`}
                          className="mr-2"
                        />
                        <span className="font-medium">{control.supervisor}</span>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3">
                        {control.vehiclePlate ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/50">
                            {control.vehiclePlate}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Não atribuído</span>
                        )}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3 text-center font-mono">
                        {control.fuelQuantity || '-'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3 text-center font-mono">
                        {control.initialKm === 0 ? '' : (control.initialKm !== null && control.initialKm !== undefined ? control.initialKm.toLocaleString() : '0')}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3 text-center font-mono">
                        {control.finalKm === 0 ? '' : (control.finalKm !== null && control.finalKm !== undefined ? control.finalKm.toLocaleString() : '0')}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-seguranca-yellow/20 text-seguranca-yellow border border-seguranca-yellow/30">
                          {control.totalKm !== null && control.totalKm !== undefined ? control.totalKm.toLocaleString() : '0'} km
                        </span>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray px-4 py-3 text-center">
                        <span className="font-semibold text-green-400">
                          R$ {control.value !== null && control.value !== undefined ? control.value.toFixed(2) : '0.00'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Indicador de Observações */}
                          {(control.observations || control.problemDescription) && (
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="relative cursor-help">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-white font-bold">!</span>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs p-3 bg-seguranca-black border border-gray-600">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-400 font-semibold">
                                      <AlertTriangle size={14} />
                                      <span>Observações Importantes</span>
                                    </div>
                                    {control.observations && (
                                      <div>
                                        <p className="text-xs text-gray-300 font-medium mb-1">Observações Gerais:</p>
                                        <p className="text-xs text-seguranca-lightgray leading-relaxed">
                                          {control.observations}
                                        </p>
                                      </div>
                                    )}
                                    {control.problemDescription && (
                                      <div>
                                        <p className="text-xs text-gray-300 font-medium mb-1">Problemas Reportados:</p>
                                        <p className="text-xs text-seguranca-lightgray leading-relaxed">
                                          {control.problemDescription}
                                        </p>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-2">
                                      Clique para ver detalhes completos
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(control)}
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 h-8 w-8 p-0"
                            title="Visualizar detalhes"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(control)}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 h-8 w-8 p-0"
                            title="Editar registro"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(control)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400 h-8 w-8 p-0"
                            title="Excluir registro"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Geração de Relatórios */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="bg-seguranca-black border-gray-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray text-xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-seguranca-yellow" />
              Gerar Relatório de Controle de KM
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filtros do Relatório */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-seguranca-lightgray font-medium">
                  Data Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reportFilters.startDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-seguranca-lightgray font-medium">
                  Data Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reportFilters.endDate}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisor" className="text-seguranca-lightgray font-medium">
                  Supervisor
                </Label>
                <Select value={reportFilters.supervisor} onValueChange={(value) => setReportFilters(prev => ({ ...prev, supervisor: value }))}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os supervisores" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os supervisores</SelectItem>
                    {uniqueSupervisors.map(supervisor => (
                      <SelectItem key={supervisor} value={supervisor}>
                        {supervisor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehiclePlate" className="text-seguranca-lightgray font-medium">
                  Veículo (Placa)
                </Label>
                <Select value={reportFilters.vehiclePlate} onValueChange={(value) => setReportFilters(prev => ({ ...prev, vehiclePlate: value }))}>
                  <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {uniqueVehiclePlates.map(plate => (
                      <SelectItem key={plate} value={plate}>
                        {plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo dos Filtros */}
            <div className="bg-seguranca-graphite rounded-lg p-4 border border-gray-600">
              <h4 className="text-seguranca-lightgray font-medium mb-3">Resumo dos Filtros:</h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Registros encontrados:</span>
                  <p className="text-seguranca-yellow font-semibold">{filteredReportData.length}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total KM:</span>
                  <p className="text-blue-400 font-semibold">{filteredReportData.reduce((sum, control) => sum + (control.totalKm || 0), 0).toLocaleString('pt-BR')} km</p>
                </div>
                <div>
                  <span className="text-gray-400">Valor Total:</span>
                  <p className="text-green-400 font-semibold">R$ {filteredReportData.reduce((sum, control) => sum + (control.value || 0), 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Período:</span>
                  <p className="text-purple-400 font-semibold">
                    {reportFilters.startDate && reportFilters.endDate
                      ? `${new Date(reportFilters.startDate).toLocaleDateString('pt-BR')} - ${new Date(reportFilters.endDate).toLocaleDateString('pt-BR')}`
                      : 'Todos os períodos'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Supervisor:</span>
                  <p className="text-orange-400 font-semibold">
                    {reportFilters.supervisor === 'all' ? 'Todos' : reportFilters.supervisor}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Veículo:</span>
                  <p className="text-cyan-400 font-semibold">
                    {reportFilters.vehiclePlate === 'all' ? 'Todos' : reportFilters.vehiclePlate}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={clearReportFilters}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Limpar Filtros
              </Button>
              <Button
                onClick={generatePDFReport}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={filteredReportData.length === 0 || isGeneratingReport}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isGeneratingReport ? 'Gerando...' : 'Gerar PDF'}
              </Button>
              <Button
                onClick={generateExcelReport}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={filteredReportData.length === 0 || isGeneratingReport}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {isGeneratingReport ? 'Gerando...' : 'Gerar Excel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removido: Modais de upload/visualização de Foto do Painel */}
    </div>
  );
};

export default KmControlTable;
