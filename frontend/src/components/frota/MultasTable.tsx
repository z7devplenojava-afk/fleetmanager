import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Car,
  RefreshCw,
  User,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import fleetService from '@/services/fleetService';

interface Multa {
  id: string;
  veiculo_id: string;
  placa: string;
  marca: string;
  modelo: string;
  motorista_id?: string;
  motorista_nome?: string;
  motorista_cnh?: string;
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface MultasTableProps {
  multas: Multa[];
  onRefresh: () => void;
  onEdit: (multa: Multa) => void;
  onDelete: (multa: Multa) => void;
  onDeleteMultiple?: (selectedIds: string[]) => void;
  onView: (multa: Multa) => void;
  onGenerateReport?: (selectedIds: string[], format: 'pdf' | 'excel') => void;
  showSelection?: boolean;
}

const MultasTable: React.FC<MultasTableProps> = ({
  multas,
  onRefresh,
  onEdit,
  onDelete,
  onDeleteMultiple,
  onView,
  onGenerateReport,
  showSelection = false
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMultas, setSelectedMultas] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // State for PDF report modal
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfFilters, setPdfFilters] = useState({
    vehiclePlate: '',
    driverName: '',
    infraction: '',
    startDate: '',
    endDate: '',
    dueDateStart: '',
    dueDateEnd: '',
    minValue: '',
    maxValue: '',
    status: ''
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Get unique values from data
  const uniquePlates = useMemo(() => {
    const plates = new Set(multas.map(m => m.placa));
    return Array.from(plates).sort();
  }, [multas]);
  
  const uniqueDrivers = useMemo(() => {
    const drivers = new Set(multas.map(m => m.motorista_nome).filter(Boolean));
    return Array.from(drivers).sort();
  }, [multas]);
  
  const uniqueInfractions = useMemo(() => {
    const infractions = new Set(multas.map(m => m.tipo_infracao));
    return Array.from(infractions).sort();
  }, [multas]);

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const filters: any = {};
      
      if (pdfFilters.vehiclePlate && pdfFilters.vehiclePlate !== 'all') {
        filters.vehiclePlate = pdfFilters.vehiclePlate;
      }
      if (pdfFilters.driverName && pdfFilters.driverName !== 'all') {
        filters.driverName = pdfFilters.driverName;
      }
      if (pdfFilters.infraction && pdfFilters.infraction !== 'all') {
        filters.infraction = pdfFilters.infraction;
      }
      if (pdfFilters.startDate) {
        filters.startDate = pdfFilters.startDate;
      }
      if (pdfFilters.endDate) {
        filters.endDate = pdfFilters.endDate;
      }
      if (pdfFilters.dueDateStart) {
        filters.dueDateStart = pdfFilters.dueDateStart;
      }
      if (pdfFilters.dueDateEnd) {
        filters.dueDateEnd = pdfFilters.dueDateEnd;
      }
      if (pdfFilters.minValue) {
        filters.minValue = parseFloat(pdfFilters.minValue);
      }
      if (pdfFilters.maxValue) {
        filters.maxValue = parseFloat(pdfFilters.maxValue);
      }
      if (pdfFilters.status && pdfFilters.status !== 'all') {
        filters.status = pdfFilters.status;
      }

      const blob = await fleetService.exportFinesReportPDF(filters);
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Definir nome do arquivo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `relatorio_multas_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório de multas foi baixado com sucesso.",
        variant: "default",
      });
      
      setIsPDFModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      const errorMessage = error?.message || 'Ocorreu um erro ao gerar o relatório PDF. Tente novamente.';
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paga':
        return 'Paga';
      case 'vencida':
        return 'Vencida';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
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

  const isVencida = (dataVencimento: string) => {
    return new Date(dataVencimento) < new Date();
  };

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMultas(multas.map(multa => multa.id));
      setIsAllSelected(true);
    } else {
      setSelectedMultas([]);
      setIsAllSelected(false);
    }
  };

  const handleSelectMulta = (multaId: string, checked: boolean) => {
    if (checked) {
      setSelectedMultas(prev => [...prev, multaId]);
    } else {
      setSelectedMultas(prev => prev.filter(id => id !== multaId));
    }
  };

  const handleGenerateReport = (format: 'pdf' | 'excel') => {
    if (selectedMultas.length === 0) {
      toast({
        title: 'Atenção!',
        description: 'Selecione pelo menos uma multa para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    if (onGenerateReport) {
      onGenerateReport(selectedMultas, format);
    }
  };

  const handleDeleteMultiple = () => {
    if (selectedMultas.length === 0) {
      toast({
        title: 'Atenção!',
        description: 'Selecione pelo menos uma multa para excluir.',
        variant: 'destructive',
      });
      return;
    }

    if (onDeleteMultiple) {
      onDeleteMultiple(selectedMultas);
    }
  };

  // Atualizar estado de "selecionar todos" quando multas mudarem
  useEffect(() => {
    if (selectedMultas.length === multas.length && multas.length > 0) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedMultas, multas.length]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh();
      toast({
        title: 'Sucesso!',
        description: 'Lista de multas atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao atualizar lista de multas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (multas.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma multa encontrada
            </h3>
            <p className="text-gray-400">
              Não há multas registradas no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
          <h3 className="text-lg font-medium text-seguranca-lightgray">
            Multas ({multas.length})
          </h3>
          {showSelection && selectedMultas.length > 0 && (
            <Badge variant="outline" className="border-blue-600 text-blue-400">
              {selectedMultas.length} selecionada{selectedMultas.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPDFModalOpen(true)}
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white flex-1 sm:flex-initial text-xs h-8"
          >
            <FileText size={15} className="mr-1.5" />
            Gerar Relatório PDF
          </Button>
          
          {showSelection && selectedMultas.length > 0 && (
            <>
              {onDeleteMultiple && (
                <Button
                  onClick={handleDeleteMultiple}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xs h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Excluir ({selectedMultas.length})
                </Button>
              )}
              {onGenerateReport && (
                <>
                  <Button
                    onClick={() => handleGenerateReport('pdf')}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    PDF
                  </Button>
                  <Button
                    onClick={() => handleGenerateReport('excel')}
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-xs h-8"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Excel
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Visualização Mobile (Cards Individuais) */}
      <div className="block md:hidden space-y-3">
        {showSelection && multas.length > 0 && (
          <div className="flex items-center justify-between bg-seguranca-graphite border border-gray-700/80 rounded-lg px-3 py-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow h-4 w-4"
              />
              <span>Selecionar todas ({multas.length})</span>
            </label>
            {selectedMultas.length > 0 && (
              <span className="text-seguranca-yellow font-bold">
                {selectedMultas.length} selecionada(s)
              </span>
            )}
          </div>
        )}

        {multas.map((multa) => (
          <div
            key={`mobile-multa-${multa.id}`}
            className="bg-seguranca-black border border-gray-700/80 hover:border-gray-600 rounded-xl p-3.5 space-y-3 shadow-md transition-all"
          >
            {/* Header: Checkbox + Placa + Status */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {showSelection && (
                  <Checkbox
                    checked={selectedMultas.includes(multa.id)}
                    onCheckedChange={(checked) => handleSelectMulta(multa.id, checked as boolean)}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow h-4 w-4 shrink-0"
                  />
                )}
                <div className="w-9 h-9 bg-seguranca-red/20 border border-seguranca-red/40 rounded-lg flex items-center justify-center shrink-0">
                  <Car className="text-seguranca-red" size={16} />
                </div>
                <div className="min-w-0">
                  <div className="font-mono font-extrabold text-seguranca-yellow text-base tracking-wider leading-none truncate">
                    {multa.placa}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 truncate leading-none">
                    {multa.marca} {multa.modelo}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <Badge
                  className={
                    multa.status === 'paga'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold'
                      : multa.status === 'vencida'
                      ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30 text-[10px] font-semibold'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold'
                  }
                >
                  {getStatusText(multa.status)}
                </Badge>
              </div>
            </div>

            {/* Infração e Código */}
            <div className="bg-seguranca-graphite/40 border border-gray-800 rounded-lg p-2.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-200 line-clamp-1" title={multa.tipo_infracao}>
                  {multa.tipo_infracao}
                </span>
                {multa.pontos ? (
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-rose-500/40 text-rose-400 bg-rose-500/10 shrink-0">
                    {multa.pontos} pts
                  </Badge>
                ) : null}
              </div>

              {/* Motorista */}
              <div className="flex items-center gap-1.5 text-gray-300 text-[11px] pt-1 border-t border-gray-800">
                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {multa.motorista_nome || 'Motorista não identificado'}
                </span>
                {multa.motorista_cnh && (
                  <span className="text-gray-500 text-[10px]">
                    (CNH: {multa.motorista_cnh})
                  </span>
                )}
              </div>
            </div>

            {/* Grid de Datas e Valores */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-seguranca-graphite/30 rounded-lg p-2.5 border border-gray-800/80">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Infração</span>
                <span className="font-mono text-gray-200 text-[11px] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {formatDate(multa.data_infracao)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Vencimento</span>
                <span className={`font-mono text-[11px] flex items-center gap-1 mt-0.5 ${isVencida(multa.data_vencimento) && multa.status !== 'paga' ? 'text-rose-400 font-bold' : 'text-gray-200'}`}>
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {formatDate(multa.data_vencimento)}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-gray-800/60 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Valor</span>
                <span className="font-mono font-bold text-sm text-seguranca-yellow">
                  {formatCurrency(multa.valor)}
                </span>
              </div>
            </div>

            {/* Ações Mobile */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(multa)}
                className="flex-1 h-9 border-blue-500/40 text-blue-400 hover:bg-blue-950/30 text-xs font-semibold"
              >
                <Eye size={14} className="mr-1" />
                Visualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(multa)}
                className="flex-1 h-9 border-green-600/40 text-green-400 hover:bg-green-950/30 text-xs font-semibold"
              >
                <Edit size={14} className="mr-1" />
                Editar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(multa)}
                className="h-9 w-9 p-0 border-red-700/50 text-red-400 hover:bg-red-950/30 shrink-0"
                title="Excluir Multa"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Visualização Desktop (Tabela) */}
      <div className="hidden md:block rounded-md border border-gray-600 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              {showSelection && (
                <TableHead className="text-seguranca-lightgray w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-gray-400"
                  />
                </TableHead>
              )}
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Veículo</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Motorista</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Infração</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Data Infração</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Vencimento</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Valor</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap min-w-[100px] w-[100px]" style={{ display: 'table-cell' }}>Pontos</TableHead>
              <TableHead className="text-seguranca-lightgray whitespace-nowrap">Status</TableHead>
              <TableHead className="text-seguranca-lightgray text-right whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {multas.map((multa) => {
              // Debug: verificar se pontos está presente
              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Multa:', multa.placa, 'Pontos:', multa.pontos);
              }
              return (
              <TableRow key={multa.id} className="border-gray-600 hover:bg-seguranca-black">
                {showSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedMultas.includes(multa.id)}
                      onCheckedChange={(checked) => handleSelectMulta(multa.id, checked as boolean)}
                      className="border-gray-400"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-seguranca-red rounded-full flex items-center justify-center">
                      <Car className="text-white" size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-seguranca-lightgray">{multa.placa}</div>
                      <div className="text-sm text-gray-400">{multa.marca} {multa.modelo}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="text-white" size={12} />
                    </div>
                    <div>
                      <div className="font-medium text-seguranca-lightgray">
                        {multa.motorista_nome || 'Não informado'}
                      </div>
                      {multa.motorista_cnh && (
                        <div className="text-sm text-gray-400">CNH: {multa.motorista_cnh}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-seguranca-lightgray">{multa.tipo_infracao}</div>
                    <div className="text-sm text-gray-400">{multa.local_infracao}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-seguranca-lightgray">{formatDate(multa.data_infracao)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center space-x-2 ${isVencida(multa.data_vencimento) ? 'text-red-500' : ''}`}>
                    <Calendar size={14} className="text-gray-400" />
                    <span className={isVencida(multa.data_vencimento) ? 'text-red-500 font-medium' : 'text-seguranca-lightgray'}>
                      {formatDate(multa.data_vencimento)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <DollarSign size={14} className="text-gray-400" />
                    <span className="font-medium text-seguranca-lightgray">
                      {formatCurrency(multa.valor)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap min-w-[100px] w-[100px]" style={{ display: 'table-cell' }}>
                  <Badge variant="outline" className="border-gray-600 text-seguranca-lightgray bg-gray-800/50">
                    {multa.pontos || 0} pts
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(multa.status)}>
                    {getStatusText(multa.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(multa)}
                      title="Visualizar Multa"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(multa)}
                      title="Editar Multa"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(multa)}
                      title="Excluir Multa"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Geração de PDF */}
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Gerar Relatório PDF de Multas
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Veículo (Placa)</Label>
                <Select 
                  value={pdfFilters.vehiclePlate} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, vehiclePlate: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todas as placas" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todas as placas</SelectItem>
                    {uniquePlates.map((plate) => (
                      <SelectItem key={plate} value={plate}>
                        {plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Motorista</Label>
                <Select 
                  value={pdfFilters.driverName} 
                  onValueChange={(value) => setPdfFilters({ ...pdfFilters, driverName: value })}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os motoristas" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    <SelectItem value="all">Todos os motoristas</SelectItem>
                    {uniqueDrivers.map((driver) => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Infração</Label>
              <Select 
                value={pdfFilters.infraction} 
                onValueChange={(value) => setPdfFilters({ ...pdfFilters, infraction: value })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todas as infrações" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todas as infrações</SelectItem>
                  {uniqueInfractions.map((infraction) => (
                    <SelectItem key={infraction} value={infraction}>
                      {infraction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data Infração - Início</Label>
                <Input
                  type="date"
                  value={pdfFilters.startDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, startDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Data Infração - Fim</Label>
                <Input
                  type="date"
                  value={pdfFilters.endDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, endDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Vencimento - Início</Label>
                <Input
                  type="date"
                  value={pdfFilters.dueDateStart}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, dueDateStart: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Vencimento - Fim</Label>
                <Input
                  type="date"
                  value={pdfFilters.dueDateEnd}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, dueDateEnd: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pdfFilters.minValue}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, minValue: e.target.value })}
                  placeholder="0.00"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pdfFilters.maxValue}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, maxValue: e.target.value })}
                  placeholder="0.00"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Status</Label>
              <Select 
                value={pdfFilters.status} 
                onValueChange={(value) => setPdfFilters({ ...pdfFilters, status: value })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Paga</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsPDFModalOpen(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultasTable; 
